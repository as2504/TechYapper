---
slug: auth-jwt
title: Authentication and JWT
category: security
aliases: auth, authentication, authorization, JWT, JSON Web Token, OAuth, OAuth 2.0, OpenID Connect, OIDC, SSO, sessions, tokens, RLS
tagline: Proving who someone is, deciding what they can do, and carrying that proof between requests.
level: intermediate
minutes: 5
concepts: jwt-auth, supabase-rls, cors
related: rest-apis, postgresql, system-design
popular: true
---
::what
**Authentication** is proving who you are (logging in). **Authorisation** is deciding what you're allowed to do. A **JWT** (JSON Web Token) is a common way to carry the result of authentication between requests: a signed string containing claims like the user's ID and expiry time. **OAuth 2.0** and **OpenID Connect** are standards for logging in through another provider, like "Sign in with Google".

::why
HTTP is stateless, so every request has to prove who sent it. Typing a password every time isn't an option. After you log in once, the server gives you a token or a session cookie, and you send that with each request instead.

::how
- **Sessions:** the server stores session data and gives the browser a random session ID in a cookie.
- **JWTs:** the server signs a token containing claims. Any server with the key can verify the signature without a database lookup.
A JWT has three parts, `header.payload.signature`, each base64url-encoded. The payload is **readable by anyone**; the signature only proves it wasn't tampered with. Short-lived **access tokens** are paired with longer-lived **refresh tokens** to get new ones.

::where
- Web and mobile app logins
- APIs that accept `Authorization: Bearer <token>` headers
- Single sign-on across company apps with Microsoft Entra ID, Okta or Google
- Database-level security: Supabase passes the JWT to Postgres, and RLS policies check `auth.uid()`

::know
- **Authentication ≠ authorisation.**
- **JWTs are signed, not encrypted.** Never put secrets in them.
- **JWTs are hard to revoke** before they expire, so keep access tokens short-lived.
- **Store tokens carefully:** HttpOnly cookies protect against XSS reading them; localStorage is readable by any script on the page.
- **OAuth is for delegated authorisation; OpenID Connect adds login (identity) on top.**

::analogy
A JWT is like a festival wristband. Security checked your ticket once at the gate (login). After that, staff just look at the wristband (verify the signature) instead of calling the ticket office every time. If someone steals your wristband, they get in until it expires.

::talk10
Authentication is proving who you are; authorisation is what you're allowed to do. A JWT is a signed token that carries who you are, so the server can verify each request without a database lookup.

::talk30
Authentication is logging in, authorisation is permissions. After login, the server needs a way to recognise you on every request, either with a session cookie that points to data stored on the server, or with a JWT, a signed token containing claims like your user ID and an expiry time. Servers can verify a JWT's signature without a database call, which scales nicely, but the trade-off is that tokens are hard to revoke, so they're kept short-lived and refreshed. Also, a JWT isn't encrypted, so anyone can read its contents. OAuth and OpenID Connect are the standards behind "Sign in with Google".

::comebacks
- Are JWTs better than sessions? || Not automatically. Sessions are simpler to revoke; JWTs avoid server-side lookups and suit APIs and multiple services.
- Is a JWT encrypted? || Usually not. It's signed. Anyone can decode and read the payload.
- What's OAuth? || A standard for granting an app limited access to your account on another service without sharing your password. OpenID Connect builds login on top of it.

::facts
- JWT is pronounced "jot", according to the RFC 7519 spec.
- The `alg: none` vulnerability let attackers forge tokens in some early libraries that trusted the token's own header.

::deeper
### Inside a JWT
```text
eyJhbGciOiJIUzI1NiJ9 . eyJzdWIiOiI0MiIsImV4cCI6MTcwMDAwMDAwMH0 . <signature>
header: {"alg":"HS256"}   payload: {"sub":"42","exp":1700000000}
```
Verify with a fixed, expected algorithm, check `exp`, and check the audience and issuer claims.

### Access and refresh tokens
- **Access token:** short-lived (minutes), sent on every request.
- **Refresh token:** longer-lived, stored more carefully, used only to get new access tokens, and can be rotated and revoked.

### Authorisation in the database
With Supabase, the JWT reaches Postgres, and a policy like `using ((select auth.uid()) = user_id)` means even a bug in your API can't return another user's rows.

::sources
- [RFC 7519: JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519)
- [OWASP: JWT cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [OAuth 2.0 overview](https://oauth.net/2/)

::check
A developer puts the user's password hash in the JWT payload "because it's signed". What's wrong?
- [ ] Nothing, signed tokens are secure
- [x] JWT payloads are only base64-encoded, so anyone with the token can read it
- [ ] The token will be too big to send
- [ ] Signatures don't work with hashes
> Signing proves integrity, not secrecy. Treat the payload as public. Keep only non-sensitive claims in it.

::interview
=== q: What's the difference between authentication and authorisation? | level: beginner | pro: false
#answer
1. Authentication: verifying identity (who are you?).
2. Authorisation: verifying permissions (what can you do?).
3. Authentication happens first; authorisation is checked on each action.
4. HTTP 401 relates to authentication; 403 relates to authorisation.
#short
Authentication is proving who you are, like logging in. Authorisation is checking what you're allowed to do once we know who you are, like whether you can delete this order. 401 is "not authenticated", 403 is "not allowed".
#detail
A concrete example helps: in a shared document app, logging in is authentication; being able to edit one doc but only view another is authorisation.
#followups
- Where should authorisation checks live? || On the server, ideally close to the data, never only in the UI.
#mistakes
- Using the two terms interchangeably

=== q: How do JWTs work, and what are their downsides? | level: intermediate | pro: false
#answer
1. Header, payload and signature, base64url-encoded.
2. The server signs claims; any service with the key verifies them without a database lookup.
3. Downsides: hard to revoke, payload is readable, token theft risk.
4. Mitigations: short expiry, refresh tokens, HttpOnly cookies, strict verification.
#short
A JWT is a signed token with claims like the user ID and an expiry. The server checks the signature on each request, so there's no session lookup, which is nice for APIs. The downsides are that you can't easily revoke one before it expires and anyone can read the payload, so we keep them short-lived and put nothing sensitive in them.
#detail
Mention verifying the algorithm explicitly and checking the expiry, issuer and audience. Mention where you'd store the token in a browser and why.
#followups
- How would you log a user out everywhere with JWTs? || Revoke their refresh tokens and keep access tokens short; for immediate effect, keep a deny-list or a token version per user.
#mistakes
- Saying JWTs are encrypted

=== q: Explain the OAuth 2.0 authorization code flow. | level: advanced | pro: true
#answer
1. The app redirects the user to the provider's authorisation page.
2. The user logs in and consents.
3. The provider redirects back with a short-lived authorisation code.
4. The app's back end exchanges the code (with PKCE or a client secret) for tokens.
5. OpenID Connect adds an ID token with the user's identity.
#short
The app sends the user to the provider, like Google, to log in and consent. Google redirects back with a one-time code, and the app exchanges that code for tokens behind the scenes. PKCE protects that exchange for browser and mobile apps. OpenID Connect adds an ID token that says who the user is.
#detail
Explain why the code is exchanged rather than receiving tokens directly: tokens never pass through the browser's address bar, and PKCE stops a stolen code from being used.
#followups
- What is PKCE? || Proof Key for Code Exchange: the app sends a hash of a secret at the start and the secret at exchange, so an intercepted code is useless.
#mistakes
- Confusing OAuth (authorisation) with OpenID Connect (authentication)
