---
slug: rest-apis
title: REST APIs
category: backend-infra
aliases: REST, RESTful, API, HTTP API, endpoints, HTTP methods, status codes, idempotency, CORS
tagline: The common way for apps to talk over HTTP, using URLs for things and HTTP methods for actions.
level: beginner
minutes: 4
concepts: rest-idempotency, cors, jwt-auth
related: system-design, auth-jwt, javascript
popular: true
---
::what
A REST API is a way for one program to ask another for data or actions over HTTP. Things are identified by URLs (`/orders/42`), and you act on them with HTTP methods: `GET` to read, `POST` to create, `PUT` or `PATCH` to update, `DELETE` to remove. Responses usually come back as JSON with a status code like `200 OK` or `404 Not Found`.

::why
Front ends, mobile apps and other services all need to talk to a back end. REST builds on HTTP, which every language, browser and tool already understands. That makes APIs easy to build, call, cache and debug without special software.

::how
A client sends a request: method, URL, headers (like `Authorization`) and optionally a body. The server routes it to a handler, does the work and returns a status code, headers and a body. REST requests are **stateless**: each request carries everything needed, usually including a token, so any server can handle it. That's what makes REST APIs easy to scale horizontally.

::where
- Almost every web and mobile back end
- Public APIs: Stripe, GitHub, Razorpay, Google Maps
- Communication between internal microservices
- Low-code connectors in tools like Power Automate, which wrap REST APIs

::know
- **Resources are nouns, methods are verbs:** `POST /orders`, not `/createOrder`.
- **Status codes have meaning:** 2xx success, 4xx client mistake, 5xx server problem.
- **Idempotency:** `GET`, `PUT` and `DELETE` should be safe to repeat; `POST` usually isn't, which matters for retries.
- **Stateless:** no server-side session per request is required.
- **Versioning and pagination** matter once other teams depend on your API.

::analogy
A REST API is a restaurant menu with a waiter. The menu (the API docs) lists what you can order, you make a specific request, and the kitchen sends back exactly that dish with a note on how it went (the status code). You don't walk into the kitchen.

::talk10
A REST API lets apps talk over HTTP: URLs identify resources, methods like GET and POST say what to do, and responses come back as JSON with a status code.

::talk30
REST is the most common style for web APIs. You model your data as resources with URLs, like /users/42, and use HTTP methods for actions: GET to read, POST to create, PUT or PATCH to update, DELETE to remove. Each request is stateless and carries its own authentication, usually a token, so servers can scale easily. Good REST APIs use status codes properly, are predictable, and think about idempotency, so that retrying a request, like a payment, doesn't do it twice.

::comebacks
- REST vs GraphQL? || REST has many endpoints with fixed responses. GraphQL has one endpoint where the client asks for exactly the fields it needs. REST is simpler to cache; GraphQL helps when clients need very different data shapes.
- What's the difference between PUT and PATCH? || PUT replaces the whole resource; PATCH changes part of it.
- Is REST a protocol? || No, it's an architectural style that uses HTTP.

::facts
- REST was defined by Roy Fielding in his 2000 PhD dissertation.
- Most "REST" APIs don't follow every constraint Fielding described, like hypermedia links. People usually mean "JSON over HTTP with sensible URLs".

::deeper
### Idempotency keys
Networks fail. If a client retries `POST /payments` after a timeout, it might charge twice. Payment APIs like Stripe accept an `Idempotency-Key` header: the server stores the result for that key and returns the same result on retries instead of charging again.

### Status codes worth knowing
- `200 OK`, `201 Created`, `204 No Content`
- `400 Bad Request`, `401 Unauthorized` (not logged in), `403 Forbidden` (logged in, not allowed), `404 Not Found`, `409 Conflict`, `429 Too Many Requests`
- `500 Internal Server Error`, `503 Service Unavailable`

### Pagination
Offset pagination (`?page=3`) is simple but slow and inconsistent on large, changing data. Cursor pagination (`?after=abc123`) is stable and fast.

::sources
- [MDN: HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)
- [MDN: HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [Stripe docs: Idempotent requests](https://docs.stripe.com/api/idempotent_requests)

::check
A user is logged in but tries to delete someone else's order. Which status code fits best?
- [ ] 401 Unauthorized
- [x] 403 Forbidden
- [ ] 404 Not Found is the only valid option
- [ ] 500 Internal Server Error
> 401 means "we don't know who you are". 403 means "we know who you are, and you're not allowed". Some APIs return 404 to avoid revealing the order exists, which is also defensible.

::interview
=== q: What makes an API RESTful? | level: beginner | pro: false
#answer
1. Resources identified by URLs.
2. Standard HTTP methods for actions.
3. Stateless requests.
4. Standard representations (usually JSON) and meaningful status codes.
5. Cacheable responses where possible.
#short
A RESTful API models things as resources with URLs, uses HTTP methods like GET and POST for actions, keeps each request stateless, and uses status codes properly. For example, POST /orders creates an order and returns 201 Created.
#detail
Mention a design example and a mistake to avoid, such as `GET /deleteUser?id=5`, which breaks expectations because GET should never change data.
#followups
- What does stateless mean here? || The server doesn't rely on stored session state between requests; each request carries what it needs.
- 401 vs 403? || 401: not authenticated. 403: authenticated but not allowed.
#mistakes
- Verbs in URLs like /getUsers

=== q: What is idempotency and why does it matter? | level: intermediate | pro: false
#answer
1. An idempotent operation has the same effect whether you do it once or many times.
2. GET, PUT and DELETE are idempotent by definition; POST is not.
3. It matters because clients and networks retry.
4. For non-idempotent operations like payments, use idempotency keys.
#short
Idempotent means doing it twice has the same effect as doing it once. It matters because requests get retried after timeouts. For things like payments, the client sends an idempotency key, and the server returns the original result instead of charging again.
#detail
This is a favourite question in fintech and payments interviews. Walk through the timeout scenario: the server processed the payment, the response got lost, the client retries. Without a key, the customer pays twice.
#followups
- How would you implement idempotency keys? || Store the key with the request's result in a table with a unique constraint; on a repeat key, return the stored result.
#mistakes
- Saying POST can never be made safe to retry

=== q: How would you design pagination and versioning for a public API? | level: advanced | pro: true
#answer
1. Pagination: prefer cursor-based for large or changing data; return a next cursor.
2. Set sensible default and maximum page sizes.
3. Versioning: in the URL (/v1) or a header; never break existing clients silently.
4. Deprecate with notice, documentation and sunset dates.
#short
For pagination I'd use cursors rather than page numbers, because they stay correct when data changes and they're fast on big tables. For versioning I'd use /v1 in the URL, add fields without breaking anything, and only introduce v2 for breaking changes, with a deprecation period.
#detail
Mention what counts as a breaking change: removing a field, renaming it, changing its type or meaning. Adding optional fields is usually safe.
#followups
- Why is offset pagination slow? || The database still has to walk past all skipped rows, and inserts shift pages so items get duplicated or skipped.
#mistakes
- Making breaking changes without a new version
