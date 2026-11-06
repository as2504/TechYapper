---
slug: rest-idempotency
title: Idempotency, the API property that saves your money
topic: backend
difficulty: intermediate
minutes: 6
pro: false
related: caching-strategies, jwt-auth, postgres-mvcc
---
::dek
Networks fail in the worst possible place: after the server did the work, before the client heard about it. Idempotency is how good APIs survive retries.

::hook
A user taps "Pay ₹799". The spinner spins. The network drops. They tap again. Did you charge them once or twice? If your answer is "depends on timing", you've met the reason Stripe, Razorpay and every serious payments API ask for an idempotency key — and why "what's the difference between PUT and POST?" is really a question about retries.

::yap
An idempotent request can be sent twice with the same effect as once. That's what makes it safe to retry when you don't know whether the first attempt worked.

::basics
An operation is **idempotent** if doing it many times has the same effect as doing it once.

- Setting your profile name to "Asha" — idempotent. Do it ten times, still "Asha".
- Adding ₹100 to a wallet — not idempotent. Ten times is ₹1,000.

Why it matters: **clients retry**. Mobile networks drop, load balancers time out, users double-tap. When a request fails without a response, the client can't know whether the server processed it. If the operation is idempotent, retrying is safe.

REST maps this onto HTTP methods:

- `GET`, `HEAD`, `OPTIONS`: safe (no changes) and idempotent.
- `PUT`: idempotent — "make the resource look like this".
- `DELETE`: idempotent — deleting twice leaves it deleted (the second call may return 404; the *state* is the same).
- `POST`: **not** idempotent by default — "create something new" or "do this action".
- `PATCH`: may or may not be, depending on the patch.

::hood
### Idempotency keys for POST

For non-idempotent operations like payments, the client generates a unique key per logical operation and sends it with every retry:

```http
POST /v1/payments
Idempotency-Key: 6f1e0c2a-8b1d-4c1e-9f3a-2a7b5d9e0c11
Content-Type: application/json

{ "amount": 79900, "currency": "INR" }
```

The server:

1. Looks up the key. If a completed result exists, returns **the same response** without redoing the work.
2. If not, records the key as "in progress" (atomically), performs the operation, stores the response against the key, and returns it.

### Enforcing it in the database

The simplest robust implementation is a unique constraint:

```sql
create table idempotency_keys (
  key text primary key,
  user_id uuid not null,
  request_hash text not null,
  response jsonb,
  created_at timestamptz default now()
);
```

Two concurrent requests with the same key: one insert wins, the other gets a conflict and waits for or returns the stored result. Store a hash of the request body so a reused key with a *different* payload is rejected rather than silently ignored.

### Natural idempotency

Often you can design it in: `PUT /users/7/settings` with the full settings object, or "upsert" with a unique business key (`order_number`) instead of blindly inserting.

::deep
### Exactly-once is (mostly) a myth

Across networks you get **at-most-once** (never retry, risk losing work) or **at-least-once** (retry, risk duplicates). "Exactly-once" in practice means **at-least-once delivery plus idempotent processing**. That's true for HTTP clients, message queues, webhooks and stream processors alike.

### Webhooks

Payment providers deliver webhooks at least once and may retry for hours. Your handler must:

- Verify the signature.
- De-duplicate using the provider's event ID (store processed IDs with a unique constraint).
- Apply state transitions that tolerate repeats and out-of-order events ("mark paid" is safe to repeat; "add credit" is not unless keyed).

### Key scope, expiry and edge cases

- Scope keys per user or API account so keys from different clients can't collide.
- Expire them (Stripe keeps keys for 24 hours) to bound storage.
- Decide what to store for failures: a validation error should probably be replayed; a transient 5xx usually shouldn't be cached, so a retry can succeed.
- Handle the "in progress" state: a retry arriving while the first attempt is still running should get a 409 or wait, not start a parallel charge.

### Retries need backoff

Idempotency makes retries *safe*; it doesn't make them *free*. Clients should use exponential backoff with jitter and a retry budget, or a burst of retries during an outage becomes a self-inflicted DDoS.

::myths
- POST requests can never be safely retried || They can, if the server supports idempotency keys or the operation is designed as an upsert.
- DELETE isn't idempotent because the second call returns 404 || Idempotency is about server state, not identical responses. The resource is deleted either way.
- Idempotency means the response is always identical || It means the effect is the same. Responses may differ (e.g. 201 then 200 or 404).

::facts
- HTTP method idempotency is defined in the HTTP semantics spec (RFC 9110).
- An IETF draft standardises the `Idempotency-Key` header, following conventions popularised by Stripe.

::realworld
- Payment APIs (Stripe, Razorpay, Adyen) accepting idempotency keys on create calls.
- Webhook consumers de-duplicating by event ID.
- Message queue consumers (SQS, Kafka) designed for at-least-once delivery.

::check
A client sends `POST /orders` with an idempotency key; the server creates the order, but the response is lost. The client retries with the **same key**. What should a well-designed server do?
- [ ] Create a second order — it's a new request
- [x] Return the stored result of the first request without creating another order
- [ ] Return 400 Bad Request because the key was already used
- [ ] Delete the first order and create a new one
> The key identifies one logical operation. The server replays the original outcome, so the client gets its answer and the customer gets exactly one order.
