---
slug: postgres-mvcc
title: How Postgres lets everyone read at once (MVCC)
topic: databases
difficulty: advanced
minutes: 7
pro: true
related: sql-indexes, supabase-rls, rest-idempotency
---
::dek
Postgres never edits a row in place. It writes a new version and lets each transaction see the version that was true when it started.

::hook
A finance team runs a 20-minute report while the app processes thousands of payments. Nobody waits for anybody, and the report's totals still add up to a consistent moment in time. That's not luck — it's Multi-Version Concurrency Control, and it shapes everything from isolation levels to why `VACUUM` exists.

::yap
In Postgres, readers never block writers and writers never block readers — because an UPDATE doesn't change a row, it creates a new version of it.

::basics
Imagine a shared document where nobody is allowed to erase anything. To change a sentence, you write the new version below and mark the old one with "replaced at 10:42". Someone who started reading at 10:40 keeps seeing the old sentence; anyone starting after 10:42 sees the new one.

That's **MVCC — Multi-Version Concurrency Control**.

- An `UPDATE` creates a **new version** of the row and marks the old one as outdated.
- A `DELETE` just marks the row as deleted.
- Each transaction gets a **snapshot**: a rule for which versions it can see.

The result: reports, dashboards and API reads never wait for writes to finish, and writes don't wait for reads. The only time transactions wait for each other is when two of them try to change the *same* row.

The catch: old versions pile up. Postgres needs a cleanup process — **VACUUM** — to reclaim that space. It usually runs automatically (autovacuum).

::hood
### xmin and xmax

Every row version (a **tuple**) carries hidden system columns:

- `xmin`: the ID of the transaction that created it.
- `xmax`: the ID of the transaction that deleted or replaced it (0 if still current).

```sql
SELECT xmin, xmax, * FROM accounts WHERE id = 1;
```

A snapshot records which transactions had committed when it was taken. A tuple is visible if its `xmin` committed before the snapshot and its `xmax` didn't.

### Isolation levels are snapshot policies

- **Read Committed** (default): each *statement* gets a fresh snapshot. Two `SELECT`s in one transaction can see different data.
- **Repeatable Read**: one snapshot for the whole transaction. If you try to update a row someone else changed since your snapshot, you get a serialization error and must retry.
- **Serializable**: Repeatable Read plus detection of dangerous read/write patterns (Serializable Snapshot Isolation). Results are as if transactions ran one at a time; some get aborted and must be retried.

### Writers still conflict

Two transactions updating the same row: the second waits for the first to commit or roll back. Under Read Committed it then re-reads the latest version and proceeds. That's why `UPDATE … SET stock = stock - 1` is safe but "read in app, compute, write back" can lose updates.

::deep
### Dead tuples, bloat and VACUUM

Superseded versions become **dead tuples** once no running transaction can see them. `VACUUM` marks their space reusable and updates the **visibility map** (which enables index-only scans) and the **free space map**. It doesn't shrink the file — `VACUUM FULL` or `pg_repack` do, with locking trade-offs.

**Autovacuum** triggers based on the fraction of changed rows. On very large, hot tables, the default 20% threshold is too lazy; per-table settings like `autovacuum_vacuum_scale_factor = 0.01` are common tuning.

### The long-transaction trap

VACUUM can only remove tuples older than the **oldest running snapshot**. One forgotten `BEGIN` in a console, or a long analytics query on the primary, holds back cleanup across the whole database. Bloat grows, indexes swell, queries slow. Monitor `pg_stat_activity` for old `xact_start` values and set `idle_in_transaction_session_timeout`.

### Transaction ID wraparound

Transaction IDs are 32-bit and wrap around after ~4 billion. To keep old rows visible, VACUUM **freezes** them — marking them as visible to all. If freezing falls too far behind, Postgres eventually refuses new writes to protect data. It's rare on healthy systems but has caused famous production outages.

### HOT updates

If an update doesn't modify any indexed column and there's room on the same page, Postgres does a **Heap-Only Tuple** update: the new version is chained from the old one and no index needs updating. Leaving free space with `fillfactor` on update-heavy tables increases HOT updates.

### Compared with other engines

MySQL's InnoDB and Oracle also use MVCC, but store old versions in **undo logs**, keeping the main table compact. Postgres stores versions in the table itself: simpler rollbacks and no undo-log size limits, at the price of VACUUM.

::myths
- UPDATE changes the row in place || It writes a new row version; the old one stays until VACUUM cleans it.
- SELECT queries take locks that block UPDATEs || Plain SELECTs take no row locks. Only `SELECT … FOR UPDATE/SHARE` does.
- VACUUM shrinks the table file || Regular VACUUM makes space reusable inside the file. Shrinking needs VACUUM FULL or pg_repack.

::facts
- Postgres's MVCC design dates back to the POSTGRES research project at Berkeley led by Michael Stonebraker in the 1980s.
- `SELECT txid_current();` shows your current transaction ID.

::realworld
- Running reports on the primary without blocking checkout traffic.
- Diagnosing table bloat after a long-running migration or idle transaction.
- Choosing Serializable for financial invariants and adding automatic retry logic.

::check
A developer leaves a `BEGIN;` open in a SQL console over the weekend on a busy database. What's the most likely effect?
- [ ] All writes are blocked until it's closed
- [x] VACUUM can't remove dead tuples newer than that transaction's snapshot, so bloat builds up
- [ ] The database crashes after 24 hours
- [ ] Nothing — idle transactions have no effect
> An open transaction holds back the "oldest visible snapshot" horizon. Dead tuples created after it began can't be cleaned, so tables and indexes bloat and queries slow down. It doesn't block writes unless it holds locks on specific rows.
