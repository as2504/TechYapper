---
slug: postgresql
title: PostgreSQL
category: data-cloud
aliases: Postgres, SQL, relational database, RDBMS, psql, Supabase, indexes, MVCC
tagline: The open-source relational database that most new products reach for first.
level: beginner
minutes: 5
concepts: sql-indexes, postgres-mvcc, supabase-rls
related: vector-databases, system-design, cloud-computing
popular: true
---
::what
PostgreSQL, usually called Postgres, is an open-source relational database. It stores data in tables with rows and columns, you query it with SQL, and it guarantees that transactions either fully happen or don't happen at all. It's been developed since the 1980s and is known for reliability and a huge extension ecosystem.

::why
Applications need to store data so that it survives crashes, stays consistent when many users write at once, and can be queried flexibly. Relational databases solved that decades ago. Postgres became the default open-source choice because it's free, standards-compliant, and keeps adding features like JSON support, full-text search and vector search.

::how
You define tables with types and constraints, and relate them with foreign keys. SQL queries are parsed, planned by a **query planner** that picks the cheapest way to get the data (for example, using an index or scanning the table), and executed. **Transactions** follow ACID rules. Postgres uses **MVCC** (multi-version concurrency control), so readers don't block writers: each transaction sees a consistent snapshot.

::where
- Back ends for web and mobile apps (Instagram, Reddit and many startups have used it)
- Managed platforms: Supabase, Neon, AWS RDS and Aurora, Google Cloud SQL, Azure
- Analytics on moderate data sizes, geospatial apps with PostGIS, and vector search with pgvector

::know
- **Relational model:** data lives in tables, and you join them by keys.
- **ACID transactions:** atomic, consistent, isolated, durable.
- **Indexes** make reads fast and writes a little slower. Most slow queries are a missing index.
- **`EXPLAIN ANALYZE`** shows how a query actually ran.
- **JSONB** lets you store flexible documents alongside relational data.
- **Row Level Security (RLS)** lets the database itself enforce who can see which rows.

::analogy
Postgres is a very strict, very fast librarian. Every book has a fixed catalogue card format, nothing gets shelved half-done, and the card index (your indexes) means they don't have to walk every aisle to find what you asked for.

::talk10
Postgres is an open-source relational database: tables, SQL and reliable transactions. It's the default choice for a lot of new apps because it's robust and has extensions for things like JSON, geospatial and vector search.

::talk30
PostgreSQL is a relational database, so data lives in tables you query with SQL, and every transaction is all-or-nothing. It's open source, very reliable, and has grown a lot of features: JSONB for document-style data, full-text search, PostGIS for maps, and pgvector for AI embeddings. It handles concurrency with MVCC, so reads don't block writes. Most performance work comes down to good schema design, the right indexes and reading query plans with EXPLAIN ANALYZE. Platforms like Supabase and Neon make it easy to use as a managed service.

::comebacks
- SQL or NoSQL? || For most apps with related data, start with Postgres. JSONB covers a lot of "I need flexible fields" cases. NoSQL makes sense for specific scale or access patterns.
- Is Postgres slow at scale? || Large companies run it at big scale. Usually slowness is missing indexes or poor queries, not Postgres itself.
- What's Supabase? || A hosted Postgres with auth, storage and auto-generated APIs on top.

::facts
- Postgres grew out of the POSTGRES project at UC Berkeley, started in 1986 by Michael Stonebraker.
- It's been the "DBMS of the Year" on DB-Engines several times.
- Deleted and updated rows aren't removed immediately because of MVCC. VACUUM cleans them up later.

::deeper
### Indexes, briefly
The default index is a **B-tree**, good for equality and range lookups. A composite index on `(user_id, created_at)` serves `where user_id = ? order by created_at` well, but not a query filtering only on `created_at`. Column order matters.

### Reading a plan
```sql
explain analyze select * from orders where customer_id = 42;
```
A `Seq Scan` on a large table for a selective filter usually means a missing index. An `Index Scan` or `Bitmap Index Scan` is what you want.

### Isolation levels
Postgres defaults to **Read Committed**. **Repeatable Read** and **Serializable** give stronger guarantees at the cost of possible serialization errors that your code must retry.

::sources
- [PostgreSQL documentation](https://www.postgresql.org/docs/current/)
- [PostgreSQL docs: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
- [PostgreSQL docs: MVCC](https://www.postgresql.org/docs/current/mvcc-intro.html)

::check
A query `where email = 'a@b.com'` on a 5-million-row users table is slow. The plan shows a Seq Scan. What's the likely fix?
- [ ] Increase the server's RAM
- [x] Add an index on email
- [ ] Switch to a NoSQL database
- [ ] Use SELECT with fewer columns
> A sequential scan reads every row. An index on `email` (often unique) lets Postgres jump straight to the matching row.

::interview
=== q: What is ACID? | level: beginner | pro: false
#answer
1. Atomicity: a transaction fully happens or not at all.
2. Consistency: constraints hold before and after each transaction.
3. Isolation: concurrent transactions don't see each other's partial work.
4. Durability: once committed, data survives a crash.
#short
ACID describes reliable transactions. Atomic means all or nothing, consistent means rules like constraints always hold, isolated means concurrent transactions don't step on each other, and durable means committed data survives crashes. A bank transfer is the classic example.
#detail
Use the transfer example: debit one account and credit another in one transaction, so a crash can't leave money missing. Mention that isolation has levels, which trade strictness for concurrency.
#followups
- What are isolation levels? || Read Committed, Repeatable Read and Serializable. Higher levels prevent more anomalies but can cause more retries.
#mistakes
- Mixing up the consistency in ACID with the consistency in the CAP theorem

=== q: How do indexes work and what are their costs? | level: intermediate | pro: false
#answer
1. An index is a separate data structure, usually a B-tree, that maps column values to rows.
2. It turns full table scans into fast lookups for selective queries.
3. Costs: extra storage, and slower inserts and updates because the index must be maintained.
4. Composite index column order matters.
#short
An index is like a book's index: a sorted structure that lets the database jump straight to matching rows instead of scanning the whole table. The cost is extra storage and slower writes, so you add indexes for the queries you actually run.
#detail
Mention checking with EXPLAIN ANALYZE, the leftmost-prefix rule for composite indexes, and that low-selectivity columns, like a boolean, often don't benefit.
#followups
- When won't Postgres use your index? || When the query returns a large share of the table, when a function wraps the column, or when the query doesn't match the index's leading column.
#mistakes
- Saying "index every column"

=== q: What is MVCC? | level: advanced | pro: true
#answer
1. Multi-Version Concurrency Control keeps multiple versions of a row.
2. Each transaction sees a consistent snapshot of the data.
3. Readers don't block writers and writers don't block readers.
4. Old versions are cleaned up later by VACUUM.
#short
MVCC means Postgres keeps old versions of rows around, so each transaction reads a consistent snapshot. That way reads and writes don't block each other. The trade-off is cleanup: VACUUM has to remove dead row versions.
#detail
Mention that an UPDATE in Postgres writes a new row version rather than overwriting in place, which is why heavy updates cause table bloat, and why long-running transactions prevent cleanup.
#followups
- What is table bloat? || Space taken by dead row versions that haven't been vacuumed yet.
#mistakes
- Thinking MVCC means no locks at all; writers still lock rows against other writers
