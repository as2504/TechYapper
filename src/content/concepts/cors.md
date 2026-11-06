---
slug: cors
title: CORS is the browser protecting your users
topic: security
difficulty: beginner
minutes: 5
pro: false
related: jwt-auth, caching-strategies, supabase-rls
---
::dek
That red console error isn't your API being broken. It's the browser refusing to let one website read another website's responses — unless the server says it's fine.

::hook
Every web developer has seen it: "blocked by CORS policy". The request works in Postman. It works with curl. It just doesn't work from your frontend. The instinctive fix — `Access-Control-Allow-Origin: *` and move on — sometimes works and sometimes opens a hole. Knowing *who* is enforcing the rule, and *why*, makes the right fix obvious.

::yap
CORS isn't a server firewall — it's the browser asking the server "may this website read your response?". Postman works because Postman isn't protecting anyone.

::basics
### The same-origin policy

Browsers enforce a rule: a web page can only **read** responses from its own **origin** — the combination of scheme, host and port.

- `https://app.sumitsk.in` and `https://api.sumitsk.in` → different origins (different host)
- `http://localhost:5173` and `http://localhost:3000` → different origins (different port)

Why? Imagine you're logged into your bank in one tab, and visit a malicious site in another. Without this rule, the malicious page could call your bank's API — your cookies would be sent automatically — and read your account details.

### CORS relaxes the rule, safely

**CORS (Cross-Origin Resource Sharing)** lets a server say "it's fine for these other origins to read my responses":

```http
Access-Control-Allow-Origin: https://app.sumitsk.in
```

The **browser** checks this header. If the page's origin isn't allowed, the browser blocks your JavaScript from seeing the response — even though the server may have already processed the request.

That's why curl and Postman "work": they're not browsers and don't enforce CORS.

::hood
### Simple requests vs preflight

For "simple" requests — `GET`, `HEAD` or `POST` with form-style content types and no custom headers — the browser sends the request and checks the response headers.

For anything else — `PUT`, `DELETE`, `Content-Type: application/json`, an `Authorization` header — the browser first sends a **preflight** `OPTIONS` request:

```http
OPTIONS /api/answers
Origin: https://techyapper.sumitsk.in
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization
```

The server must reply with matching permissions:

```http
Access-Control-Allow-Origin: https://techyapper.sumitsk.in
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: content-type, authorization
Access-Control-Max-Age: 600
```

Only then does the browser send the real request. `Max-Age` lets it cache that permission.

### Credentials

To send cookies cross-origin, the frontend uses `credentials: 'include'` and the server must respond with `Access-Control-Allow-Credentials: true` **and** a specific origin — the wildcard `*` is not allowed with credentials.

::deep
### What CORS is not

- **Not authentication**: anyone can call your API from a server, script or curl. CORS only governs what browsers let *pages* read.
- **Not CSRF protection by itself**: a cross-site form POST can still be *sent* and processed; CORS only stops the attacker's page reading the response. Use SameSite cookies and CSRF tokens for state-changing endpoints.
- **Not a server-side block**: for simple requests, the server receives and handles them regardless. Side effects still happen.

### Dangerous configurations

- **Reflecting the Origin header** back with `Allow-Credentials: true` for any origin effectively disables the same-origin policy for your users' authenticated sessions.
- **Sloppy matching**: allowing anything that *ends with* `sumitsk.in` also allows `evilsumitsk.in`. Match exact origins or proper subdomains.
- **Trusting `null` origin**: sandboxed iframes and local files send `Origin: null`; allowing it can be exploited.

### Caching gotcha

If your server varies `Access-Control-Allow-Origin` per request origin, it must send `Vary: Origin` — otherwise a CDN may cache a response allowed for one origin and serve it to another, causing confusing intermittent CORS failures.

### Often the best fix is no CORS

Serve the frontend and API from the same origin (e.g. `/api` via a reverse proxy or your hosting platform's rewrites) and CORS never comes up. Dev servers do the same with a proxy config.

::myths
- CORS protects my API from unauthorised access || It controls what browsers let pages read. Servers, scripts and tools can call your API freely.
- The CORS error means the request never reached the server || Simple requests are sent and processed; the browser just hides the response. Preflighted requests are stopped before the real request.
- `Access-Control-Allow-Origin: *` works for everything || It's not allowed when credentials (cookies) are included.

::facts
- The same-origin policy dates back to Netscape Navigator 2.0 in 1995, introduced alongside JavaScript.
- CORS is now defined in the WHATWG Fetch standard rather than its own specification.

::realworld
- Configuring allowed origins for a frontend on one subdomain calling an API on another.
- Supabase and Firebase APIs sending permissive CORS headers because their security relies on tokens and RLS, not origin.
- Using Vite's dev-server proxy to avoid CORS during local development.

::check
Your API works from curl, but the browser shows "blocked by CORS policy" for a `fetch` with `Content-Type: application/json`. What's the most likely missing piece?
- [ ] The API needs HTTPS
- [x] The server doesn't answer the OPTIONS preflight with the right `Access-Control-Allow-*` headers
- [ ] curl is caching the response
- [ ] JSON can't be sent cross-origin
> JSON content-type triggers a preflight. If the server doesn't respond to `OPTIONS` with an allowed origin, methods and headers, the browser never sends the real request. curl doesn't do preflights at all.
