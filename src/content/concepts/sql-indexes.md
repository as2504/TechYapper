---
slug: sql-indexes
title: Database indexes are sorted shortcuts
topic: databases
difficulty: beginner
minutes: 6
pro: false
related: postgres-mvcc, caching-strategies, supabase-rls
---
::dek
Why one line of SQL can turn a 4-second query into a 4-millisecond one — and why adding indexes everywhere makes things worse.

::hook
Every slow-app war story eventually reaches the same plot twist: "there was no index." Indexes are the cheapest big performance win in software. They're also widely misunderstood — people add them to every column, then wonder why writes got slow and the query planner ignores half of them.

::yap
An index is a sorted copy of a column with pointers back to the rows. It turns "read everything" into "jump to the right page" — and every write pays to keep that copy sorted.

::basics
Without an index, finding rows is like finding a word in a book with no index at the back: you read every page. Databases call this a **sequential scan**.

```sql
SELECT * FROM users WHERE email = 'asha@example.com';
```

On a million-row table, that's a million rows checked to find one.

An **index** is a separate, sorted structure built from one or more columns, with each entry pointing to the matching row. With an index on `email`, the database jumps almost directly to the right entry.

```sql
CREATE INDEX users_email_idx ON users (email);
```

When indexes help:

- Columns you filter on often (`WHERE`)
- Columns you join on (`JOIN … ON orders.user_id = users.id`)
- Columns you sort by (`ORDER BY created_at`)

The cost: every `INSERT`, `UPDATE` and `DELETE` must update every index on the table. Indexes also use disk and memory. They're a trade: faster reads, slower writes.

::hood
### B-trees: the default

Most indexes are **B-trees**: balanced trees where each node holds many sorted keys. A million rows typically fit in a tree only 3–4 levels deep, so a lookup touches just a handful of pages. Because keys are sorted, B-trees support `=`, `<`, `>`, `BETWEEN`, prefix `LIKE 'abc%'` and `ORDER BY` — but not `LIKE '%abc'`.

### Composite indexes and column order

```sql
CREATE INDEX ON orders (customer_id, created_at);
```

This is sorted by `customer_id` first, then `created_at` within each customer — like a phone book sorted by last name, then first name. It helps queries filtering on `customer_id`, or on `customer_id` *and* `created_at`. It doesn't help a query filtering only by `created_at`. Put equality-filtered columns first, range/sort columns after.

### The planner decides

The database's **query planner** estimates costs using table statistics. If your query matches 40% of the table, reading the index then jumping to each row is slower than a straight scan — so it won't use the index. That's correct behaviour, not a bug. Check with:

```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 42;
```

Look for `Index Scan` vs `Seq Scan`, and compare estimated vs actual rows.

### Functions break indexes

`WHERE lower(email) = 'a@b.com'` can't use an index on `email`. Create an **expression index**: `CREATE INDEX ON users (lower(email))`.

::deep
### Covering indexes and index-only scans

If the index contains every column a query needs, the database can answer from the index alone. In Postgres, `INCLUDE` adds non-key columns:

```sql
CREATE INDEX ON orders (customer_id, created_at DESC) INCLUDE (total);
```

Postgres must still check visibility (see MVCC); the **visibility map** lets it skip the table for pages known to be all-visible, which is why freshly vacuumed tables get faster index-only scans.

### Other index types in Postgres

- **Hash**: equality only; rarely better than B-tree.
- **GIN**: inverted index for "contains" queries — JSONB keys, arrays, full-text search, trigram search with `pg_trgm`.
- **GiST / SP-GiST**: geometric data, ranges, nearest-neighbour.
- **BRIN**: tiny indexes for huge, naturally ordered tables (time-series logs) that store min/max per block range.
- **HNSW / IVFFlat** (via pgvector): approximate nearest-neighbour search over embeddings.

### Partial indexes

```sql
CREATE INDEX ON tasks (due_at) WHERE completed = false;
```

Index only the rows you query. Smaller, faster, cheaper to maintain.

### Write amplification and the real cost

Each index adds write work, WAL volume and memory pressure. In Postgres, an update that changes an indexed column can't use a **HOT update** (heap-only tuple), so it touches every index. Unused indexes are pure cost — `pg_stat_user_indexes.idx_scan = 0` finds them.

### Selectivity

An index on a boolean column with 50/50 distribution is nearly useless; one on a column where each value matches 0.01% of rows is gold. Cardinality matters more than "is it in the WHERE clause?".

::myths
- More indexes always mean a faster database || Each index slows down writes and uses memory. Unused ones are pure overhead.
- If an index exists, the database will use it || The planner skips indexes when a scan is cheaper — e.g. when the query returns a large fraction of the table.
- Column order in a composite index doesn't matter || It matters a lot. `(a, b)` helps queries on `a` or `a+b`, not queries on `b` alone.

::facts
- The B-tree was introduced by Rudolf Bayer and Edward McCreight in 1970 at Boeing; what the "B" stands for has never been settled.
- Postgres automatically creates an index for every `PRIMARY KEY` and `UNIQUE` constraint — but not for foreign keys.

::realworld
- Adding an index on a foreign key (`orders.user_id`) to fix slow joins and slow cascading deletes.
- Supabase's Performance Advisor flags unindexed foreign keys and unused indexes.
- `pg_trgm` GIN indexes powering fuzzy search boxes without a separate search engine.

::check
A table has `CREATE INDEX ON events (user_id, created_at)`. Which query benefits *least*?
- [ ] `WHERE user_id = 7`
- [ ] `WHERE user_id = 7 AND created_at > now() - interval '1 day'`
- [x] `WHERE created_at > now() - interval '1 day'`
- [ ] `WHERE user_id = 7 ORDER BY created_at DESC LIMIT 10`
> The index is sorted by `user_id` first. Without a `user_id` condition, the matching `created_at` values are scattered across every user's section of the index, so it can't seek efficiently.
