---
slug: jwt-auth
title: JWTs are signed, not secret
topic: security
difficulty: intermediate
minutes: 6
pro: true
related: supabase-rls, cors, rest-idempotency
---
::dek
A JSON Web Token is a tamper-proof note, not a locked box. Understanding that one difference prevents most JWT mistakes.

::hook
Paste any JWT into jwt.io and its contents spill out: user ID, email, roles, expiry. Developers seeing this for the first time often panic — "isn't this supposed to be secure?" It is. Just not in the way they assumed. JWTs prove *who issued* the data and that nobody changed it. They hide nothing.

::yap
A JWT is a signed note, not a sealed envelope: anyone can read it, but nobody can change it without the server noticing.

::basics
After you log in, the server needs a way to recognise you on every following request. One approach: give you a **token** to send back each time. A **JWT (JSON Web Token)** is a popular format for that token.

A JWT has three parts, separated by dots:

```text
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0MiIsImV4cCI6MTc5MzAwMDAwMH0.Xp3k…
     header                     payload                     signature
```

- **Header**: which algorithm signed it.
- **Payload** (claims): data like `sub` (user ID), `exp` (expiry time), `role`.
- **Signature**: computed from the header and payload using a secret or private key.

The header and payload are just **Base64URL-encoded JSON** — anyone can decode them. The signature is what makes it trustworthy: if someone changes `"role": "user"` to `"role": "admin"`, the signature no longer matches and the server rejects the token.

So: **never put secrets in a JWT payload**. Treat it as public.

::hood
### Verifying a token

On each request the server:

1. Splits the token and decodes the header.
2. Recomputes the signature using its key and the **algorithm it expects** (not just whatever the header claims).
3. Checks claims: `exp` (not expired), `nbf` (not before), `iss` (issuer), `aud` (audience).
4. Trusts the claims and proceeds — **without a database lookup**.

That last step is the selling point: any server instance can verify a token independently, which suits distributed systems.

### HS256 vs RS256/ES256

- **HS256** (HMAC): one shared secret signs and verifies. Simple, but every verifier holds a key that can also *create* tokens.
- **RS256 / ES256** (asymmetric): a private key signs, a public key verifies. Services can verify without being able to mint tokens. Public keys are often published at a **JWKS** endpoint for rotation.

### Where to store it in the browser

- **localStorage**: easy, but readable by any JavaScript on the page — an XSS bug can steal it.
- **HttpOnly cookie**: JavaScript can't read it, which blunts XSS token theft, but you must handle **CSRF** (SameSite cookies, CSRF tokens).

There's no free lunch; pick deliberately and keep tokens short-lived.

::deep
### The revocation problem

A stateless token stays valid until it expires — even after logout, a password change or a ban. Common designs:

- **Short-lived access tokens** (5–15 minutes) plus long-lived **refresh tokens** stored server-side and revocable. The refresh step is where you enforce logout and bans.
- **Token versioning**: store a `token_version` per user and include it in the JWT; bump it to invalidate all existing tokens (costs a lookup, which you can cache).
- **Denylist** of token IDs (`jti`) until their expiry.

Each adds state back — the honest trade-off of "stateless" auth.

### Refresh token rotation

Each time a refresh token is used, issue a new one and invalidate the old. If an old refresh token is ever reused, assume theft and revoke the whole session family. This is the approach recommended in OAuth 2.0 security best practices for browser apps.

### Classic vulnerabilities

- **`alg: none`**: early libraries accepted unsigned tokens if the header said so.
- **Algorithm confusion**: a server expecting RS256 is tricked into verifying with HS256 using the *public* key as the HMAC secret — letting attackers forge tokens. Always pin the allowed algorithms.
- **Missing `aud`/`iss` checks**: a token issued for one service accepted by another.
- **Weak HMAC secrets**: HS256 tokens can be brute-forced offline if the secret is guessable.

### JWT vs session cookies

Server-side sessions (random ID in a cookie, data in Redis/DB) are simple, instantly revocable, and perfectly scalable with a shared store. JWTs shine when multiple independent services or third parties need to verify identity without calling a central server. Many teams pick JWTs by default when sessions would be simpler.

### JWE

If you genuinely need the contents hidden, **JWE** (JSON Web Encryption) encrypts the payload. It's far less common than signed JWTs (JWS), which is what people almost always mean by "JWT".

::myths
- JWTs are encrypted || Standard JWTs are signed (JWS). The payload is readable by anyone. Encryption requires JWE.
- Logging out invalidates the JWT || Unless the server tracks revocation, the token remains valid until `exp`.
- JWTs are always better than sessions || They trade easy revocation for stateless verification. Sessions are often simpler and safer for a single app.

::facts
- JWT is standardised in RFC 7519 (2015) and is commonly pronounced "jot".
- Supabase Auth issues JWTs whose `sub` claim is what `auth.uid()` returns inside Postgres policies.

::realworld
- Supabase, Auth0, Firebase and Cognito issuing JWT access tokens.
- API gateways verifying tokens at the edge before requests reach services.
- Service-to-service auth with short-lived signed tokens.

::check
You decode a JWT and see `{"sub": "42", "role": "user"}`. You change role to "admin", re-encode the payload, and send it. What happens on a correctly implemented server?
- [ ] You get admin access — the payload is trusted
- [x] Verification fails because the signature no longer matches the modified payload
- [ ] The server decrypts it and notices the change
- [ ] The token works until it expires
> The signature covers the header and payload. Without the signing key, you can't produce a valid signature for the altered payload, so the server rejects it.
