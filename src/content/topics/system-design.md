---
slug: system-design
title: System design
category: engineering
aliases: architecture, scalability, load balancing, caching, sharding, microservices, CAP theorem, distributed systems, HLD
tagline: How you put components together so a system stays fast, reliable and affordable as it grows.
level: intermediate
minutes: 6
concepts: caching-strategies, sql-indexes, rest-idempotency
related: postgresql, cloud-computing, rest-apis, kubernetes
popular: true
---
::what
System design is the practice of deciding how the parts of a software system fit together: clients, APIs, databases, caches, queues and services. It's about meeting requirements like scale, latency, reliability and cost, and being able to explain the trade-offs you made.

::why
A system that works for 100 users can fall over at 100,000. The database gets overloaded, one slow service blocks the rest, or a single server failing takes everything down. Design decisions made early, like where state lives and what can be cached, decide how painful growth will be.

::how
Most designs combine a few building blocks:
- **Load balancer:** spreads traffic across stateless app servers.
- **Database:** usually the hardest part to scale; add indexes, read replicas, then partitioning (sharding).
- **Cache** (like Redis or a CDN): serves frequent reads without hitting the database.
- **Message queue** (like Kafka, SQS or RabbitMQ): decouples slow work, such as emails or video processing, from requests.
- **Object storage** (like S3): stores files and images.
You start from requirements, estimate load, sketch the simple version, and then fix the bottlenecks.

::where
- Every product past the prototype stage
- System design interviews for mid and senior engineering roles
- Architecture reviews before building a new feature or service

::know
- **Start from requirements:** functional (what it does) and non-functional (scale, latency, availability).
- **Scale horizontally** by keeping app servers stateless.
- **Caching** is the biggest cheap win, and invalidation is the hard part.
- **Asynchronous processing** with queues keeps requests fast.
- **Every choice is a trade-off:** consistency vs availability, cost vs latency, simplicity vs flexibility.

::analogy
System design is like planning a restaurant kitchen. One chef works for a café. For a thousand covers a night you need stations, prep done ahead (caching), tickets passed along a rail (queues), and backup staff if someone calls in sick (redundancy).

::talk10
System design is deciding how the pieces of a system, like servers, databases, caches and queues, fit together so it stays fast and reliable as it grows, and being clear about the trade-offs.

::talk30
System design is about the architecture of a system rather than individual lines of code. You start with requirements, like how many users and how fast it must be, then combine building blocks: load balancers in front of stateless servers, a database with indexes and replicas, a cache for hot data, queues for slow background work, and object storage for files. Every choice is a trade-off, for example caching makes reads faster but data can be stale. Good system design is less about knowing every tool and more about explaining why you picked each one.

::comebacks
- Monolith or microservices? || Start with a well-structured monolith in most cases. Split into services when team size or scaling needs clearly justify the extra complexity.
- What's the CAP theorem? || In a network partition, a distributed system must choose between consistency and availability. Without partitions, you can have both.
- How do you scale a database? || Indexes and query tuning first, then caching, read replicas, and finally partitioning or sharding.

::facts
- Many well-known systems started as monoliths, including Shopify, which still runs a large modular monolith.
- "There are only two hard things in computer science: cache invalidation and naming things" is attributed to Phil Karlton.

::deeper
### A repeatable interview structure
1. **Clarify requirements** and what's out of scope.
2. **Estimate** users, requests per second, storage.
3. **API and data model.**
4. **High-level design:** draw the boxes.
5. **Deep dive** into the bottleneck (often the database or a hot path).
6. **Trade-offs and failure modes:** what breaks, and what you'd do.

### Example: URL shortener
- Write: `POST /links` generates a short code, stored with the long URL.
- Read: `GET /:code` returns a redirect. Reads vastly outnumber writes, so cache hot codes and put a CDN in front.
- Codes: base62 from an ID or random with collision checks.

### Consistency choices
- **Strong consistency:** reads always see the latest write; needed for balances and inventory.
- **Eventual consistency:** replicas catch up shortly; fine for likes, views and feeds.

::sources
- [Martin Kleppmann, Designing Data-Intensive Applications](https://dataintensive.net/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [Martin Fowler: Monolith first](https://martinfowler.com/bliki/MonolithFirst.html)

::check
Your product page is slow because every view runs the same expensive database query, and the data changes a few times a day. What's the most effective first step?
- [ ] Shard the database
- [x] Cache the result with a sensible expiry or invalidate it on change
- [ ] Rewrite the service in a faster language
- [ ] Move to microservices
> Read-heavy data that changes rarely is the ideal case for caching. Sharding and rewrites are far more expensive and don't address the repeated work.

::interview
=== q: How would you approach a system design interview question? | level: beginner | pro: false
#answer
1. Clarify functional and non-functional requirements.
2. Estimate scale: users, requests per second, data size.
3. Define the API and data model.
4. Draw a simple high-level design.
5. Deep dive into bottlenecks, then discuss trade-offs and failures.
#short
I start by clarifying requirements and scale, sketch the API and data model, draw the simplest design that works, and then go deep on the bottleneck. Throughout, I explain the trade-offs rather than just naming technologies.
#detail
Interviewers mostly assess your reasoning. Saying "I'd start simple and here's what breaks first at 10x" is much stronger than starting with Kafka and Kubernetes.
#followups
- How do you estimate scale? || Rough numbers: daily active users times actions per user, divided by seconds in a day, and multiplied for peak traffic.
#mistakes
- Jumping into components before clarifying requirements
- Over-engineering from the start

=== q: How would you scale a read-heavy application? | level: intermediate | pro: false
#answer
1. Indexes and query optimisation.
2. Caching: application cache (Redis) and a CDN for static and public content.
3. Read replicas for the database.
4. Stateless app servers behind a load balancer, scaled horizontally.
5. Handle staleness: TTLs, invalidation, and reading from the primary where freshness matters.
#short
First I'd make sure queries are indexed. Then I'd add caching, Redis for hot data and a CDN for anything public, and add read replicas for the database. App servers stay stateless so I can add more behind a load balancer. The main trade-off is stale data, so I'd decide where freshness really matters.
#detail
Mention replication lag: a user who just updated their profile might read old data from a replica. A common fix is to read your own writes from the primary.
#followups
- What is cache stampede? || Many requests miss the cache at the same moment and all hit the database. Fixes include request coalescing and staggered expiry.
#mistakes
- Jumping straight to sharding

=== q: Design a notification system for email, SMS and push. | level: advanced | pro: true
#answer
1. API accepts notification requests and returns quickly.
2. Requests go onto a queue; workers per channel send them through providers.
3. Store user preferences and templates; respect opt-outs and quiet hours.
4. Retries with backoff, idempotency to avoid duplicates, and a dead-letter queue.
5. Track delivery status and rate-limit per user and provider.
#short
I'd have an API that validates the request and puts it on a queue, with separate workers per channel calling providers like an email service or SMS gateway. Preferences and templates are stored centrally. Workers retry with backoff, use idempotency keys so retries don't send twice, and failures go to a dead-letter queue for inspection.
#detail
Key points: decoupling with queues so a slow SMS provider doesn't block email; per-channel scaling; and making the "send" step idempotent, since retries are guaranteed to happen.
#followups
- How do you avoid sending duplicates? || Give each notification an ID and record sends; workers check before sending, and providers that support idempotency keys get them.
#mistakes
- Sending synchronously inside the user's request
