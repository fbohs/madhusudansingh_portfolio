# Senior Engineer's Database Reference Guide
## Pragmatic Answers for PostgreSQL & MySQL

> **How to use this guide**: Each answer follows a What/Why/How/Trade-offs/Real-world pattern. Focus on the *why* and *trade-offs* — that's what separates senior engineers from juniors.

---

## SECTION 1: FUNDAMENTAL CONCEPTS

### Q1. Clustered vs Non-Clustered Index (PostgreSQL vs MySQL InnoDB)

**What**: A clustered index physically orders table rows on disk by the index key. Non-clustered indexes are separate structures pointing to row locations.

**Why it matters**: This is THE fundamental difference between MySQL and PostgreSQL storage that affects every query.

**How they differ**:
- **InnoDB (MySQL)**: Tables are *always* clustered by primary key. Rows live INSIDE the PK B-tree leaves. Secondary indexes store PK values (not row pointers).
- **PostgreSQL**: All indexes are non-clustered (heap-organized). `CLUSTER` command physically reorders rows ONE TIME — order isn't maintained after writes.

**Pros/Cons**:
| Aspect | InnoDB Clustered | PostgreSQL Heap |
|--------|------------------|-----------------|
| PK lookup | Single B-tree traversal | Index lookup + heap fetch |
| Secondary index lookup | 2 lookups (secondary → PK → row) | 1 index + heap fetch |
| Insert with random PK (UUID) | Page splits, fragmentation | No reordering, append-friendly |
| Range scans on PK | Excellent (sequential) | Depends on physical order |

**Real-world example**: At a payments company, switching from UUID v4 to UUID v7 (time-ordered) PKs on MySQL reduced write IOPS by 40% because B-tree leaf pages stopped splitting randomly. In PostgreSQL, this matters less for inserts but still helps index-only scans.

```sql
-- MySQL: PK choice has massive write impact
CREATE TABLE orders (
  id BINARY(16) PRIMARY KEY,  -- UUID v7 (time-ordered) >> UUID v4
  amount DECIMAL(10,2)
);

-- PostgreSQL: CLUSTER is one-shot, requires AccessExclusiveLock
CLUSTER orders USING orders_created_at_idx;  -- Blocks reads/writes!
```

---

### Q2. Primary Key vs Unique Constraint

**What**: Both enforce uniqueness. PK additionally implies NOT NULL and is the "canonical identifier."

**Why distinct**: Semantic and physical differences matter.
- Only ONE PK per table; multiple unique constraints allowed
- PK in InnoDB defines the clustered index — choosing it is a physical layout decision
- Unique constraints allow NULLs (multiple NULLs allowed in PostgreSQL; behavior varies)

**How they behave**:
```sql
-- PostgreSQL: multiple NULLs allowed in UNIQUE
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE,           -- multiple NULL emails OK
  ssn TEXT UNIQUE NULLS NOT DISTINCT  -- PG 15+: treat NULLs as equal
);

-- MySQL: similar NULL behavior; multiple NULLs allowed in UNIQUE
```

**Pros/Cons**:
- **PK**: Use for the immutable identity of a row. Foreign keys typically reference PKs.
- **Unique constraint**: Use for business-level uniqueness (email, SSN, slug) that might change or be nullable.

**Real-world example**: A SaaS app uses `BIGSERIAL` as PK (immutable internal ID) and a UNIQUE constraint on `(tenant_id, email)`. When a user changes email, the PK stays stable so foreign keys don't cascade-update. Auditing systems rely on stable PKs.

---

### Q3. B-tree Structure — Why It Dominates

**What**: A self-balancing tree where each node has many children (high fan-out). Leaves hold actual data/pointers, all at the same depth.

**Why it dominates**:
1. **Logarithmic lookups** (O(log n))
2. **Range scans are cheap** — leaves are linked
3. **Disk-friendly** — node size matches page size (typically 8KB in PG, 16KB in InnoDB)
4. **Maintains sorted order** for ORDER BY without sorting

**How it works**:
- Root + internal nodes hold separator keys; leaves hold actual data
- A 4-level B-tree with 100 children per node = 100M rows in 4 disk reads
- Self-balancing via splits (on insert) and merges (on delete)

**When B-tree is NOT ideal**:
- Equality on millions of categorical values → Hash index (PG)
- Geospatial queries → GiST/SP-GiST
- Full-text search → GIN
- Time-series append-heavy → BRIN (PG only)

**Real-world example**: A log aggregation table with 500M rows: using BRIN on `created_at` instead of B-tree dropped index size from 12GB to 8MB while keeping range queries fast. Trade-off: BRIN requires physically ordered data.

```sql
-- PostgreSQL: BRIN for time-series
CREATE INDEX logs_ts_brin ON logs USING BRIN (created_at);
```

---

### Q4. OLTP vs OLAP Workload Design

**What**:
- **OLTP** (Online Transaction Processing): Many small transactions (orders, payments). Latency-sensitive.
- **OLAP** (Online Analytical Processing): Few large queries scanning millions of rows for aggregations.

**Why design differs**: They have opposite optimization goals.

| Dimension | OLTP | OLAP |
|-----------|------|------|
| Row count per query | Few (1-100) | Millions |
| Concurrency | Very high | Low |
| Schema | Normalized (3NF) | Denormalized (star schema) |
| Storage | Row-oriented | Column-oriented |
| Indexes | Many narrow indexes | Few wide indexes, partitions |
| Latency target | ms | seconds/minutes |
| Tools | PostgreSQL, MySQL | Snowflake, BigQuery, Redshift, ClickHouse |

**How a senior engineer approaches this**: Don't run analytics on your OLTP DB. Use CDC (Change Data Capture) to replicate to a warehouse.

**Real-world example**: A fintech ran a "monthly report" SQL on production Postgres. It took 4 hours, locked vacuum, and bloated tables 30%. Solution: Debezium → Kafka → Snowflake. Reports moved from 4 hours to 30 seconds; OLTP latency p99 dropped 60%.

---

### Q5. Normalization (1NF, 2NF, 3NF) — When to Denormalize

**What**:
- **1NF**: Atomic values (no arrays/lists in columns)
- **2NF**: 1NF + no partial dependencies on composite keys
- **3NF**: 2NF + no transitive dependencies (non-key columns depend only on the PK)

**Why normalize**: Reduces redundancy, prevents update anomalies, smaller storage.

**Why denormalize**: Reads >> Writes; joining is expensive; you need a specific access pattern fast.

**How to decide**:
1. Start normalized (3NF default).
2. Measure: profile slow queries.
3. Denormalize selectively — duplicate the column where the read hot path needs it.
4. Use triggers, application logic, or materialized views to keep denormalized data in sync.

**Real-world example**: An e-commerce platform stored `order.user_email` (denormalized) alongside `user_id`. Why? The "send shipping notification" service joined `orders` to `users` 50K times/hour. Denormalizing email saved 50K joins/hour. Trade-off: if a user changes email, old orders still show old email — which is actually correct for shipping history!

```sql
-- Selective denormalization with a trigger
ALTER TABLE orders ADD COLUMN user_email TEXT;

-- Backfill once, then keep denormalized intentionally (historical email)
UPDATE orders o SET user_email = u.email
FROM users u WHERE o.user_id = u.id;
```

---

### Q6. Query Cardinality

**What**: The estimated number of rows a query operation produces.

**Why it matters**: The optimizer uses cardinality to choose join order, join algorithm, and whether to use an index. Wrong estimates → catastrophic plans.

**How to inspect**:
```sql
-- PostgreSQL
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending';
--  Index Scan ... (cost=0.43..8.45 rows=10 width=...) (actual rows=15234 ...)
--                                       ^^^^^ estimated   ^^^^^ actual
-- 10 vs 15234 → 1500x underestimate → bad plans downstream
```

When estimated and actual diverge >10x, expect plan problems.

**Common causes of bad cardinality**:
- Stale statistics → `ANALYZE` the table
- Correlated columns (city + zip code) → use extended statistics (PG)
- Skewed distributions → check histogram bucket counts
- Functions hiding values: `WHERE LOWER(email) = ...` defeats stats

**Real-world example**: A dashboard query joined 6 tables. p99 went from 200ms to 30s overnight. Cause: `auto_analyze` hadn't run on a hot table because it had high `autovacuum_analyze_scale_factor`. Manual `ANALYZE` restored the plan. Fix: per-table `ALTER TABLE x SET (autovacuum_analyze_scale_factor = 0.02)`.

---

### Q7. Vertical vs Horizontal Partitioning/Sharding

**What**:
- **Vertical**: Split a table by *columns*. Move rarely-used or wide columns to a separate table.
- **Horizontal (sharding)**: Split rows across machines/tables by a shard key (user_id hash, region).

**Why**:
- **Vertical**: Hot rows fit more per page → better cache hit ratio.
- **Horizontal**: Single machine can't hold data or handle write rate.

**How**:
```sql
-- Vertical: split a wide "users" table
CREATE TABLE users (id BIGINT PK, email, name, created_at);
CREATE TABLE user_profile_blobs (user_id BIGINT PK, bio TEXT, avatar BYTEA);

-- Horizontal: app-level routing by tenant_id % N shards
```

**Pros/Cons of sharding**:
- ✅ Linear scaling for writes
- ❌ Cross-shard joins are painful or impossible
- ❌ Rebalancing shards is operationally complex
- ❌ Global uniqueness/secondary indexes need extra infra

**Real-world example**: Discord sharded their messages table by `channel_id` across thousands of Cassandra nodes. PostgreSQL/MySQL alternative: Citus (PG), Vitess (MySQL). At a smaller scale, partitioning by month using PG native partitioning often suffices — don't shard prematurely.

---

### Q8. Query Optimizer Internals

**What**: A cost-based optimizer enumerates plans, estimates each plan's cost using statistics, and picks the cheapest.

**Why understand it**: When you fight the optimizer, you usually lose. Understanding its inputs helps you give it what it needs.

**How it works** (simplified pipeline):
1. **Parser** → parse tree
2. **Rewriter** → applies rules (view expansion, etc.)
3. **Planner**:
   - Generates candidate plans (join orders, access methods)
   - Costs each using statistics (page count, row count, histogram, correlation)
   - Picks cheapest using cost model: `cost = seq_page_cost * pages + cpu_tuple_cost * tuples + ...`
4. **Executor** → runs the chosen plan

**Key statistics it uses**:
- `n_distinct` (number of distinct values)
- Most common values (MCV) and their frequencies
- Histogram for ranges
- Correlation between physical order and logical order

**Real-world example**: A query did a Nested Loop instead of Hash Join because the planner thought the inner table had 10 rows; actually it had 10M. Cause: stats were collected when the table was empty. Lesson: run `ANALYZE` after bulk loads.

```sql
-- After bulk insert
COPY orders FROM '/tmp/orders.csv';
ANALYZE orders;  -- CRITICAL: otherwise next query may pick the wrong plan
```

---

### Q9. Histograms in Statistics

**What**: A summary of value distribution in a column, divided into buckets where each holds ~equal numbers of rows.

**Why critical**: Without histograms, the optimizer assumes uniform distribution. Real data is skewed.

**How they're used**:
- For `WHERE amount > 100`, the optimizer checks histogram buckets to estimate matching rows.
- PostgreSQL `default_statistics_target` controls bucket count (default 100). Raise for skewed columns.

```sql
-- PostgreSQL
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;
ANALYZE orders;

-- View histogram
SELECT histogram_bounds FROM pg_stats WHERE tablename='orders' AND attname='amount';
```

**Trade-off**: More buckets = more accurate estimates but slower `ANALYZE` and bigger `pg_statistic` table.

**Real-world example**: A column `country_code` had 99% of values = 'US', 1% spread across 50 other countries. Default stats merged everything into a few buckets. Queries for `country_code = 'CA'` planned for 50% of rows when it was 0.1%. Raising stats target to 1000 fixed it.

---

### Q10. Optimistic vs Pessimistic Locking

**What**:
- **Pessimistic**: Lock the row when you read it (`SELECT ... FOR UPDATE`). Others wait.
- **Optimistic**: No lock; on update, check that the row hasn't changed (version column or timestamp).

**Why pick one**: Depends on contention rate.

**How**:
```sql
-- Pessimistic
BEGIN;
SELECT balance FROM accounts WHERE id = 42 FOR UPDATE;  -- others block
UPDATE accounts SET balance = balance - 100 WHERE id = 42;
COMMIT;

-- Optimistic
SELECT balance, version FROM accounts WHERE id = 42;  -- no lock
-- application computes new balance
UPDATE accounts SET balance = ?, version = version + 1
WHERE id = 42 AND version = ?;  -- 0 rows affected → retry
```

**Pros/Cons**:
| | Pessimistic | Optimistic |
|---|---|---|
| Low contention | Overkill, hurts throughput | Excellent |
| High contention | Predictable but throughput drops | Retry storms |
| Distributed systems | Hard (lock holding across services) | Natural fit |
| Deadlock risk | Yes | No |

**Real-world example**: Stripe-style payment flows use optimistic locking (idempotency keys + version). Inventory counters with frequent decrements (flash sale) use pessimistic (or atomic `UPDATE counter = counter - 1 WHERE counter > 0`) to avoid retry storms.

---

### Q11. Phantom vs Dirty vs Non-Repeatable Reads

**What**: Three concurrency anomalies that isolation levels prevent:

| Anomaly | Description | Example |
|---------|-------------|---------|
| **Dirty read** | Read uncommitted data | T1 sees T2's pending UPDATE |
| **Non-repeatable read** | Same row read twice in T1 returns different data | T2 commits an UPDATE between T1's reads |
| **Phantom read** | Same range query returns different *rows* | T2 INSERTs a matching row between T1's reads |

**Why distinguish**: Each higher isolation level prevents more, but costs more.

**How isolation levels handle them**:
| Isolation | Dirty | Non-Repeat | Phantom |
|-----------|-------|-----------|---------|
| READ UNCOMMITTED | ❌ | ❌ | ❌ |
| READ COMMITTED | ✅ | ❌ | ❌ |
| REPEATABLE READ | ✅ | ✅ | ❌ (✅ in InnoDB/PG via snapshot) |
| SERIALIZABLE | ✅ | ✅ | ✅ |

**Real-world example**: A bank report counted accounts twice because new accounts were inserted mid-query. Moving to REPEATABLE READ (PostgreSQL — uses snapshot isolation) fixed it. SERIALIZABLE wasn't needed because there were no write-write conflicts.

---

### Q12. Connection Pooling

**What**: Reusing a fixed number of DB connections instead of opening one per request.

**Why critical**:
- Each PostgreSQL connection = one OS process + ~10MB RAM
- Postgres at 5000 connections = 50GB RAM just for connections, plus context-switch hell
- Connection setup costs ~50ms (auth, SSL handshake)

**How**:
- **Application-side**: HikariCP (Java), pgx pool (Go), SQLAlchemy pool (Python)
- **External proxy**: PgBouncer (PG), ProxySQL (MySQL)
- **Pool modes**:
  - *Session*: Connection held for entire session — wastes connections
  - *Transaction* (PgBouncer default): Returned to pool after COMMIT — most efficient
  - *Statement*: Returned after each statement — breaks transactions

**Rules of thumb**:
- Pool size ≈ `((core_count * 2) + effective_spindle_count)` for OLTP — Hikari's formula
- For PG: `max_connections` = 200-500; PgBouncer fronts thousands of clients

**Real-world example**: A startup's API ran 200 app pods × 20 connections each = 4000 connections to a Postgres with `max_connections=300`. App crashed nightly. Solution: PgBouncer with `pool_size=50, max_client_conn=4000` — same 4000 clients, only 50 actual PG connections. Crashes stopped, p99 latency dropped 70%.

```ini
# pgbouncer.ini
pool_mode = transaction
default_pool_size = 50
max_client_conn = 4000
```

---

### Q13. Write Amplification

**What**: When a logical write (1 row) causes multiple physical writes.

**Why understand it**: It's a hidden cost that destroys SSD lifespan and IOPS budgets.

**Sources in databases**:
1. **WAL/binlog**: Every write goes to WAL first, then data files (2x)
2. **Double-write buffer (InnoDB)**: Writes go to doublewrite area first (3x)
3. **Index updates**: Each secondary index update = another write
4. **Page-level writes**: Changing 1 byte rewrites 8KB/16KB page
5. **HOT updates vs cold updates in PG**: cold ones update all indexes

**How to reduce**:
- Use HOT (Heap-Only Tuple) updates: don't update indexed columns
- Reduce number of secondary indexes
- Use fillfactor < 100 to leave space for HOT updates
- Use BRIN over B-tree for time-series

**Real-world example**: An analytics table had 8 indexes. Each row update wrote: WAL + data page + 8 index pages = 10x amplification. Removing 5 unused indexes (verified via `pg_stat_user_indexes`) reduced disk writes by 60% and made VACUUM 4x faster.

```sql
-- PostgreSQL: find unused indexes
SELECT schemaname, indexrelname, idx_scan
FROM pg_stat_user_indexes WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

### Q14. Working Set Concept

**What**: The subset of data actively used by queries — what should fit in RAM for good performance.

**Why critical**: If working set > RAM, every query hits disk. Performance falls off a cliff (often 100x slower).

**How to estimate**:
- Look at `pg_stat_database.blks_hit` vs `blks_read` — hit ratio should be >99%
- Track buffer pool hit ratio in MySQL: `SHOW STATUS LIKE 'Innodb_buffer_pool_read%'`
- Monitor cache miss rate; sudden increases signal working set exceeded RAM

**Tuning**:
- PostgreSQL `shared_buffers`: typically 25% of RAM
- InnoDB `innodb_buffer_pool_size`: typically 70-80% of dedicated DB server RAM
- The OS page cache also caches DB files (PG relies on this)

**Real-world example**: A reporting query started failing nightly. Cause: a new "audit log" table grew to 200GB on a 64GB-RAM server. Each report scan evicted hot user data, then user-facing queries had cache misses, then bigger reports needed even more data, cascading. Fix: partition audit log by month, drop old partitions, archive to S3. Working set returned to RAM.

---

### Q15. Full Scan vs Index Scan — When Each Wins

**What**:
- **Sequential/Full Scan**: Read entire table page by page
- **Index Scan**: Walk index, fetch matching rows from heap

**Why full scan is sometimes better**:
- Reading 30%+ of a table sequentially is faster than 30% random I/O via index
- Index requires 2 reads per row (index page + heap page)
- Sequential reads benefit from disk prefetching and SSD parallelism

**Crossover point**: ~5-10% of table on HDD; up to 25%+ on SSD (depends on row width).

**How to influence**:
- Don't index low-cardinality columns alone (boolean, status with 2-3 values)
- Use covering indexes (`INCLUDE`) to avoid heap fetches
- Use BRIN for time-series where physical and logical order match

**Real-world example**: A "find unprocessed jobs" query — `WHERE status='pending'` — used an index on status. With 5% pending jobs in a 100M-row table, the index scan was slower than a sequential scan because 5M random heap reads thrashed the cache. Switching to `WHERE status='pending' AND created_at > now() - interval '1 day'` with a partial index made the working set tiny:

```sql
CREATE INDEX ON jobs(created_at) WHERE status = 'pending';
-- Index only contains pending jobs, used only when relevant
```

---

## SECTION 2: INDEXING & QUERY OPTIMIZATION

### Q16. Composite Indexes — Column Order Matters

**What**: An index on multiple columns, e.g., `(tenant_id, status, created_at)`.

**Why order matters**: B-tree is sorted left-to-right. You can use the index for prefixes of the column list, not arbitrary subsets.

**Rule (ESR — Equality, Sort, Range)**:
1. **Equality columns first** (`tenant_id = ?`)
2. **Sort columns next** (for ORDER BY)
3. **Range columns last** (`created_at > ?`)

**How**:
```sql
-- For: WHERE tenant_id = ? AND status = 'active' ORDER BY created_at DESC
CREATE INDEX ON orders (tenant_id, status, created_at DESC);

-- This index works for:
WHERE tenant_id = ?                                  -- ✅ leftmost
WHERE tenant_id = ? AND status = ?                   -- ✅ left two
WHERE tenant_id = ? AND status = ? ORDER BY created_at DESC  -- ✅ perfect

-- Does NOT efficiently support:
WHERE status = ?                                     -- ❌ skips leftmost
WHERE tenant_id = ? AND created_at > ?               -- ⚠️ skips middle (PG can sometimes skip-scan)
```

**Real-world example**: A multi-tenant app had 50 separate indexes on `user_id`, `(user_id, status)`, `(user_id, created_at)`, etc. Replaced with one `(user_id, status, created_at)` — removed 4 of 5 indexes, write throughput up 30%, read perf same.

---

### Q17. Index Selectivity

**What**: The fraction of rows an index value matches. `selectivity = distinct_values / total_rows`.

**Why it matters**: An index on a column where every query matches 50% of rows is useless — full scan is faster.

**Rule of thumb**: Index is useful when selectivity < 5-10%.

**How to measure**:
```sql
-- PostgreSQL
SELECT n_distinct, most_common_freqs[1]
FROM pg_stats WHERE tablename='orders' AND attname='status';
-- If most_common_freq = 0.95, index on status is useless for top value
```

**Trade-offs**:
- Low selectivity (status, gender, boolean) → don't index alone; combine with high-selectivity column
- High selectivity (UUID, email) → index works great
- Skewed columns → partial index on rare values

**Real-world example**: A `users.status` column had 'active'=98%, 'banned'=1%, 'deleted'=1%. Full B-tree index was 2GB and rarely used. Replaced with two partial indexes (1MB each) on banned/deleted only. Admin queries got faster; write overhead dropped 95%.

```sql
CREATE INDEX ON users (id) WHERE status = 'banned';
CREATE INDEX ON users (id) WHERE status = 'deleted';
```

---

### Q18. Index Skip Scan (PostgreSQL)

**What**: When the leading column of a composite index has few distinct values, PG can "skip" through them to use the index even if the leading column isn't in WHERE.

**Why useful**: Avoids creating redundant indexes when you have low-cardinality leading column.

**Caveat**: True skip scan only landed in PostgreSQL 18 (2025). Prior versions emulated via Recursive CTE patterns ("loose index scan"). MySQL has had it since 5.6.

**How**:
```sql
-- Index: (status, created_at)  -- status has 3 values
-- Query: WHERE created_at > now() - interval '1 hour'
-- PG 18+: skip scan iterates status values, uses index for each
```

**When it kicks in**: Leading column has very few distinct values (3-100). Doesn't help with high-cardinality leading columns.

**Real-world example**: Before PG 18, teams created 2 indexes: `(created_at)` AND `(status, created_at)`. With skip scan, the second alone covers both. Storage savings ~30% on a hot table.

---

### Q19. Covering Index vs Inclusive Index

**What**:
- **Covering index**: All columns the query needs are in the index — no heap lookup needed.
- **INCLUDE (PostgreSQL/SQL Server)**: Adds non-key columns to index leaves; they're not sortable but ARE returnable.

**Why critical**: Heap fetches are random I/O. Eliminating them is a huge win.

**How**:
```sql
-- Query: SELECT email, name FROM users WHERE tenant_id = ?

-- Without INCLUDE: heap fetch needed
CREATE INDEX ON users (tenant_id);

-- Covering — fully covers query, no heap fetch
CREATE INDEX ON users (tenant_id) INCLUDE (email, name);

-- MySQL InnoDB: any secondary index implicitly includes the PK
-- and you can "fake" INCLUDE by adding columns to the index key
CREATE INDEX idx ON users (tenant_id, email, name);  -- but order in key matters
```

**Trade-off**: Wider index = more storage, slower writes. Only INCLUDE columns frequently read together.

**Real-world example**: A "user lookup" service did 10K QPS, each query doing `SELECT id, email FROM users WHERE tenant_id = ?`. Adding `INCLUDE (email)` enabled index-only scan, dropped p99 from 8ms to 1ms, and reduced shared_buffers pressure 70%.

---

### Q20. Partial Indexes — Real-World Use Cases

**What**: An index over a subset of rows matching a predicate.

**Why**:
- Smaller index → fits in memory, faster scans
- Less write overhead
- Skip irrelevant rows entirely

**How**:
```sql
-- Active users only (rare queries on inactive users)
CREATE INDEX ON users (email) WHERE deleted_at IS NULL;

-- Job queue: only pending jobs matter
CREATE INDEX ON jobs (priority, created_at)
WHERE status = 'pending';

-- Soft-delete pattern
CREATE INDEX ON orders (created_at) WHERE refunded = false;
```

**Trade-off**: The predicate must match the query exactly. Query `WHERE deleted_at IS NULL` uses it; `WHERE deleted_at IS NULL OR active = true` does not.

**Real-world example**: A job queue had 500M historical jobs + 10K pending. Full index = 50GB, partial index on pending = 2MB, easily fits in cache. Worker poll latency dropped from 200ms to 2ms.

---

### Q21. Diagnosing Slow Queries — Senior Engineer's Playbook

**What**: A systematic approach to finding and fixing slow queries.

**How (the playbook)**:
1. **Identify**: Use slow query log (MySQL) or `pg_stat_statements` (PG)
   ```sql
   -- PostgreSQL: top 10 by total time
   SELECT query, calls, total_exec_time, mean_exec_time
   FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;
   ```
2. **Reproduce**: Get parameters that trigger slowness
3. **Explain**: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)` (PG); `EXPLAIN FORMAT=TREE` (MySQL 8)
4. **Look for**:
   - Sequential scans on large tables
   - Estimated rows ≠ actual rows (>10x)
   - Nested Loop with high outer cardinality
   - Sort operations spilling to disk (`Sort Method: external merge Disk: ...`)
   - Hash joins with `Batches: > 1` (hash spill)
5. **Hypothesize fix**: Add index? Rewrite query? Increase `work_mem`? Better stats?
6. **Test**: Measure with realistic data; don't trust dev environment
7. **Deploy** carefully — new index can take hours and lock table

**Real-world example**: A search query was 30s p99. EXPLAIN showed a nested loop with outer rows=2M. Fixed by adding `(tenant_id, search_term)` index → 50ms. Lesson: always include the access predicate prefix.

---

### Q22. Reading EXPLAIN ANALYZE Output

**What**: Shows the actual query plan with timing.

**Why critical**: EXPLAIN alone shows estimates; EXPLAIN ANALYZE actually runs it.

**How** (PG example):
```
Hash Join  (cost=0.0..123.0 rows=100 width=50) (actual time=2.1..15.3 rows=152 loops=1)
  Hash Cond: (a.id = b.a_id)
  Buffers: shared hit=50 read=10
  ->  Seq Scan on a  ...                    (actual time=0.1..0.5 rows=1000 ...)
  ->  Hash  ...                              (actual time=2.0..2.0 rows=150 ...)
        Buckets: 1024  Batches: 1  Memory: 12kB
```

**Key signals**:
- **cost=A..B**: planner's estimate (startup..total)
- **actual time=A..B**: real ms (startup..total)
- **rows=N (estimated) vs actual rows=M**: divergence = bad stats
- **loops=N**: how many times this node ran
- **Buffers: hit/read**: cache hits vs disk reads
- **Batches: > 1**: hash spilled to disk → increase `work_mem`

**Tip**: Always use `BUFFERS` to see I/O. Use https://explain.depesz.com or https://explain.dalibo.com for visualization.

**Real-world example**: Senior engineer saw `Sort Method: external merge Disk: 800MB`. That's a query sorting 800MB on disk. Raised `work_mem` to 1GB session-locally — query dropped from 45s to 4s.

---

### Q23. Index Bloat — Detection & Remediation

**What**: Index pages that contain dead tuples or are partially empty. Inflates index size and slows scans.

**Why it happens**:
- PostgreSQL: deletes/updates leave dead tuples until VACUUM
- InnoDB: page splits during random inserts leave half-empty pages

**How to detect**:
```sql
-- PostgreSQL: bloat estimation
SELECT * FROM pgstattuple_approx('orders_pkey');
-- Or use pg_stat_user_indexes + pgstattuple extension

-- Quick check
SELECT pg_size_pretty(pg_relation_size('orders_idx'));
```

**Remediation**:
- **PostgreSQL**: `REINDEX INDEX CONCURRENTLY idx_name;` (PG 12+)
- **MySQL InnoDB**: `OPTIMIZE TABLE` (rebuilds clustered + secondary indexes online in MySQL 5.6+)

**Real-world example**: A heavily updated table had an index that grew from 2GB to 20GB over 6 months. Queries got slower. `REINDEX CONCURRENTLY` ran in 4 hours during off-peak — index back to 2GB, query latency dropped 80%.

---

### Q24. Join Algorithms — Nested Loop, Hash, Merge

**What**: Three core ways to join tables; optimizer picks based on table sizes and indexes.

**When each is chosen**:

| Algorithm | Best for | How it works | Memory |
|-----------|----------|--------------|--------|
| **Nested Loop** | Small outer + indexed inner | For each outer row, look up inner via index | Low |
| **Hash Join** | Medium/large unsorted tables | Build hash on smaller table, probe with larger | High (proportional to smaller table) |
| **Merge Join** | Both sides sorted on join key | Walk both in parallel | Low |

**How to influence**:
```sql
-- PostgreSQL session settings (rarely needed)
SET enable_nestloop = off;  -- force hash/merge
SET enable_hashjoin = off;

-- MySQL: optimizer hints
SELECT /*+ NO_HASH_JOIN(t1) */ ...
```

**Pitfall**: Nested Loop on large outer (>10K rows) is usually a disaster unless inner has covering index.

**Real-world example**: Query joined a 50M-row table to a 50M-row table. Optimizer chose Nested Loop because stats said outer was 100 rows (stale). Took 45 minutes. Manual `ANALYZE` → Hash Join → 12 seconds.

---

### Q25. Filter vs Join Condition

**What**:
- **Join condition**: How rows from two tables match (`ON a.id = b.a_id`)
- **Filter (WHERE) condition**: Restricts rows before/after join

**Why distinction matters**: Putting a filter in `ON` vs `WHERE` changes outer join semantics!

**How**:
```sql
-- Different results!
SELECT * FROM orders o
LEFT JOIN refunds r ON o.id = r.order_id AND r.amount > 100;
-- All orders kept; refunds shown only if amount > 100

SELECT * FROM orders o
LEFT JOIN refunds r ON o.id = r.order_id
WHERE r.amount > 100;
-- LEFT JOIN becomes effectively INNER (WHERE eliminates NULL r.amount rows)
```

**Performance**: The optimizer may push WHERE conditions down (predicate pushdown) so they're applied before joining, reducing rows processed.

**Real-world example**: A finance report showed wrong totals because someone moved `r.amount > 100` from `ON` to `WHERE`, converting a LEFT JOIN to an effective INNER. Excluded orders without refunds. Found via unit test comparing counts.

---

### Q26. Index-Only Scans & Visibility Map (PostgreSQL)

**What**: A scan that retrieves data entirely from the index, never touching the heap.

**Why critical**: Heap fetch is random I/O. Avoiding it can speed queries 10x.

**How PG ensures correctness**: The visibility map tracks pages where all tuples are visible to all transactions. If the page is "all-visible," PG knows the index entry is current and skips the heap.

**Requirements**:
1. All needed columns are in the index (use `INCLUDE`)
2. Pages are marked all-visible in the VM (set by VACUUM)

**How to verify**:
```sql
EXPLAIN ANALYZE SELECT email FROM users WHERE tenant_id = 5;
-- Look for: "Index Only Scan ... Heap Fetches: 0"
-- "Heap Fetches: N" > 0 means VM wasn't fully set; VACUUM the table
```

**Real-world example**: A read-heavy table had high "Heap Fetches" despite using index-only scan. Cause: low autovacuum frequency on a frequently-updated table left pages not marked all-visible. Tuning `autovacuum_vacuum_scale_factor` lower made heap fetches drop to 0.

---

### Q27. N+1 Query Problem

**What**: Querying once for a list of N items, then once more per item — totaling N+1 queries.

**Why bad**: Each round trip is ~1ms over LAN. 1000 items = 1+ second wasted on network alone.

**How to detect**:
- ORM debug logs showing repeated similar queries
- Query log shows `WHERE id = $1` repeated with different parameters
- DataDog/NewRelic span traces showing many small queries

**How to fix**:
```sql
-- N+1 (bad)
SELECT * FROM authors;        -- 1 query
SELECT * FROM books WHERE author_id = 1;  -- N queries
SELECT * FROM books WHERE author_id = 2;
...

-- Fix 1: JOIN
SELECT a.*, b.* FROM authors a LEFT JOIN books b ON b.author_id = a.id;

-- Fix 2: IN with single roundtrip
SELECT * FROM authors;
SELECT * FROM books WHERE author_id IN (1,2,3,...);

-- ORM: eager loading
-- SQLAlchemy: .options(joinedload(Author.books))
-- Rails: Author.includes(:books)
-- Hibernate: @Fetch(FetchMode.JOIN) or JOIN FETCH
```

**Real-world example**: GraphQL endpoint loading "users → posts → comments" did 1 + 100 + 10000 = 10101 queries per request. Switching to DataLoader (batches IDs per round) brought it to 3 queries. p99 latency: 12s → 80ms.

---

### Q28. Optimizing OR Conditions

**What**: `WHERE a = 1 OR b = 2` is harder to optimize than AND because it's hard to use a single index.

**How to optimize**:
```sql
-- Slow: full scan if no good index
SELECT * FROM users WHERE email = 'x@y.com' OR phone = '555-1234';

-- Fast: UNION ALL (each side can use its own index)
SELECT * FROM users WHERE email = 'x@y.com'
UNION ALL
SELECT * FROM users WHERE phone = '555-1234' AND email != 'x@y.com';
-- (deduplicate logic as needed)

-- PostgreSQL: bitmap index scan can combine indexes
-- Sometimes optimizer does this automatically with two indexes
```

**Pitfall**: `UNION` (not `UNION ALL`) adds an expensive distinct sort.

**Real-world example**: Login query checked email OR phone. Original: 2s seq scan. Rewrite as UNION ALL: 5ms (two index lookups merged in app).

---

### Q29. Why More Indexes ≠ Better

**What**: Each index speeds reads but slows every INSERT/UPDATE/DELETE and consumes memory.

**Why each extra index hurts**:
1. Write amplification: each insert updates N indexes
2. Buffer pool fragmentation: index pages compete for cache
3. Index choice paralysis: optimizer may pick wrong one
4. Maintenance overhead: VACUUM, ANALYZE, backups all scale with index count

**Rule of thumb**: 4-6 indexes per OLTP table is healthy; 10+ should be questioned.

**How to audit**:
```sql
-- PostgreSQL: find unused indexes
SELECT s.indexrelname, pg_size_pretty(pg_relation_size(s.indexrelid))
FROM pg_stat_user_indexes s
WHERE s.idx_scan < 50  -- arbitrary low threshold
ORDER BY pg_relation_size(s.indexrelid) DESC;

-- MySQL
SELECT * FROM sys.schema_unused_indexes;
```

**Real-world example**: An e-commerce DB had 20 indexes per table from years of "let's add an index" decisions. After audit: 6 unused, 4 redundant (covered by others). Dropping them reduced write latency 25% and table size by 15%.

---

### Q30. InnoDB Clustered vs Non-Clustered Scan

**What**: In InnoDB:
- **Clustered scan**: Reads PK B-tree leaves, which contain full rows
- **Secondary scan**: Walks secondary index, then for each entry does PK lookup (unless covering)

**Why**: All InnoDB tables are clustered by PK; secondary indexes are non-clustered.

**Performance implications**:
- Secondary index lookup = 2 B-tree traversals (vs 1 in PG heap)
- BUT secondary index leaf doesn't need updating when row physical location changes (because it references PK, not row ID)
- Therefore: choose narrow PKs (BIGINT > UUID) to keep all indexes small

**Real-world example**: Switching from VARCHAR(36) UUID PK to BIGINT auto-increment PK in MySQL reduced total index size by 60% across 8 secondary indexes. Read throughput up 40%.

---

### Q31. Optimizing Multiple DISTINCT Operations

**What**: `SELECT COUNT(DISTINCT a), COUNT(DISTINCT b) FROM t` is expensive because DB must hash both columns separately.

**How to optimize**:
```sql
-- Slow
SELECT COUNT(DISTINCT user_id), COUNT(DISTINCT product_id) FROM events;

-- Faster: subquery + grouping
SELECT
  COUNT(*) FILTER (WHERE rn_user = 1) AS distinct_users,
  COUNT(*) FILTER (WHERE rn_product = 1) AS distinct_products
FROM (
  SELECT
    ROW_NUMBER() OVER (PARTITION BY user_id) AS rn_user,
    ROW_NUMBER() OVER (PARTITION BY product_id) AS rn_product
  FROM events
) t;

-- Or use HyperLogLog approximations:
-- PostgreSQL: hll extension
-- ClickHouse: uniq() approximate function
```

**Trade-off**: Approximate counts (HLL) trade ~1% accuracy for 100x speedup at billions of rows.

**Real-world example**: Daily metrics job computed 12 distinct counts on a 10B-row table. Took 4 hours. Switched to HLL — 8 minutes, 0.5% error margin acceptable for dashboard.

---

### Q32. Functional vs Expression Indexes

**What**: An index on the result of an expression rather than a column directly.

**Why**: Queries with functions in WHERE bypass regular indexes.

**How**:
```sql
-- Bad: index on lower_email NOT used by this query
CREATE INDEX ON users (email);
SELECT * FROM users WHERE LOWER(email) = 'foo@bar.com';  -- seq scan!

-- Good: functional index
CREATE INDEX ON users (LOWER(email));
SELECT * FROM users WHERE LOWER(email) = 'foo@bar.com';  -- uses index

-- MySQL 8+ supports too
CREATE INDEX ON users ((LOWER(email)));  -- double parens required
```

**Real-world example**: Case-insensitive email lookups at sign-in. Without functional index: seq scan 500ms. With: 0.5ms. Common gotcha — many teams have `email` index but query with `LOWER()`.

---

### Q33. Deferred Index Build

**What**: Building an index AFTER bulk data load, not during.

**Why**: Building per-row during INSERT is dramatically slower than batch.

**How**:
```sql
-- Loading 100M rows
-- Step 1: Drop indexes
DROP INDEX idx_orders_user;
DROP INDEX idx_orders_status;

-- Step 2: Bulk load
COPY orders FROM '/tmp/orders.csv';

-- Step 3: Rebuild indexes (often 5-10x faster than incremental)
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Step 4: ANALYZE
ANALYZE orders;
```

**Trade-off**: Table queryable but slow during bulk load (no indexes).

**Real-world example**: Initial data migration of 200M rows. With indexes: 14 hours. Drop+load+rebuild: 90 minutes total.

---

### Q34. Optimizing LIKE Patterns

**What**: `LIKE 'foo%'` is index-able; `LIKE '%foo%'` and `LIKE '%foo'` are not (with B-tree).

**Why**: B-trees only support left-anchored prefix matching.

**How to handle**:
```sql
-- Index-friendly
WHERE email LIKE 'a%'     -- B-tree works

-- Not index-friendly with B-tree
WHERE email LIKE '%@gmail.com'

-- Solutions:
-- 1. Reverse index for suffix matching
CREATE INDEX ON users (REVERSE(email));
WHERE REVERSE(email) LIKE REVERSE('%@gmail.com')  -- becomes 'moc.liamg@%'

-- 2. PostgreSQL: trigram index for substring matching
CREATE EXTENSION pg_trgm;
CREATE INDEX ON users USING GIN (email gin_trgm_ops);
WHERE email LIKE '%foo%'  -- now uses GIN

-- 3. MySQL: full-text index
CREATE FULLTEXT INDEX ON users (email);
WHERE MATCH(email) AGAINST('foo');
```

**Real-world example**: Customer search by partial email/name. Trigram index on names (5GB) made `WHERE name ILIKE '%john%'` go from 8s to 30ms.

---

### Q35. Functions in WHERE — Performance Cost

**What**: `WHERE func(col) = X` typically prevents index use because the index stores `col`, not `func(col)`.

**Why**: B-tree is sorted on column value; the optimizer can't reason about arbitrary function output.

**Common offenders**:
```sql
WHERE DATE(created_at) = '2024-01-15'     -- bad: applies DATE() to every row
WHERE YEAR(created_at) = 2024              -- bad
WHERE LOWER(email) = 'x@y.com'             -- bad without functional index
WHERE CAST(amount AS INT) = 100            -- bad
```

**Fixes**:
```sql
-- Rewrite to use ranges
WHERE created_at >= '2024-01-15' AND created_at < '2024-01-16'

-- Store derived column with index
ALTER TABLE users ADD COLUMN email_lower TEXT GENERATED ALWAYS AS (LOWER(email)) STORED;
CREATE INDEX ON users (email_lower);
```

**Real-world example**: A finance audit report ran `WHERE DATE(created_at) BETWEEN ... AND ...` on a 500M-row table — 25 minutes. Rewriting to a timestamp range scan: 30 seconds.

---

## SECTION 3: CONCURRENCY & LOCKING

### Q36. PostgreSQL Row Lock Modes

**What**: PostgreSQL has multiple row-level lock strengths chosen via `SELECT ... FOR ...`.

| Lock | Use case | Blocks |
|------|----------|--------|
| FOR UPDATE | Will modify row | Any other lock |
| FOR NO KEY UPDATE | Modify non-key cols | FOR UPDATE, FOR NO KEY UPDATE |
| FOR SHARE | Need row not change | FOR UPDATE, FOR NO KEY UPDATE |
| FOR KEY SHARE | Check FK reference | FOR UPDATE only |

**Why granularity matters**: Higher granularity → less blocking → better concurrency.

**How**:
```sql
-- Reading and intending to update
BEGIN;
SELECT * FROM accounts WHERE id = 42 FOR UPDATE;
-- ... compute new balance ...
UPDATE accounts SET balance = ... WHERE id = 42;
COMMIT;

-- Non-blocking: skip locked rows (great for job queues)
SELECT * FROM jobs WHERE status='pending'
ORDER BY created_at LIMIT 1
FOR UPDATE SKIP LOCKED;
```

**Real-world example**: A job queue processed 10K jobs/sec. Original used pessimistic LOCK on a counter — workers serialized, hit 200 jobs/sec. Switched to `SELECT ... FOR UPDATE SKIP LOCKED` — workers never block each other, scaled to 50K/sec.

---

### Q37. Lock Escalation

**What**: Database upgrading many fine-grained locks (rows) to coarser ones (page, table) to save memory.

**Why some DBs do it**: SQL Server escalates row locks → table locks at thresholds. MySQL and PostgreSQL do NOT escalate by default — but PG can take table locks for DDL.

**How PG/MySQL differ**:
- **PostgreSQL**: No escalation; row locks stored in tuple headers (no memory cost per lock)
- **InnoDB (MySQL)**: No escalation; uses bitmap-based lock structures
- Both can still acquire intent locks at table level (LOCK TABLE)

**Pitfalls**:
- Long transactions hold many row locks → blocks vacuum, accumulates undo
- DDL takes implicit table locks: `ALTER TABLE` blocks everything

**Real-world example**: A migration ran `UPDATE users SET ... WHERE ...` touching 5M rows in a single transaction. Held 5M row locks for 20 min, blocked autovacuum, caused dead tuples to balloon. Lesson: chunk updates in batches of 10K.

```sql
-- Chunked update pattern
DO $$
DECLARE rows_updated INT;
BEGIN
  LOOP
    UPDATE users SET status='archived'
    WHERE id IN (SELECT id FROM users WHERE inactive AND status != 'archived' LIMIT 10000);
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    EXIT WHEN rows_updated = 0;
    COMMIT;
    PERFORM pg_sleep(0.1);  -- breathing room for vacuum
  END LOOP;
END $$;
```

---

### Q38. Deadlock Scenarios & Prevention

**What**: Two transactions each hold a lock the other needs → DB kills one (the "victim").

**Classic scenario**:
```
T1: UPDATE accounts SET balance = balance - 100 WHERE id = 1;
T2: UPDATE accounts SET balance = balance - 50  WHERE id = 2;
T1: UPDATE accounts SET balance = balance + 100 WHERE id = 2;  -- waits for T2
T2: UPDATE accounts SET balance = balance + 50  WHERE id = 1;  -- waits for T1
-- Deadlock!
```

**Why & How to prevent**:
1. **Consistent ordering**: Always lock IDs in ascending order
2. **Short transactions**: Less time = less chance of deadlock
3. **Application retry**: Catch deadlock error and retry (idempotent ops only)
4. **Use SKIP LOCKED for queues** — never blocks
5. **Use SELECT FOR UPDATE early** to acquire all locks upfront

**Detection**:
```sql
-- PostgreSQL
SHOW deadlock_timeout;  -- default 1s
-- Logs deadlocks at log_min_messages = WARNING

-- MySQL
SHOW ENGINE INNODB STATUS;  -- LATEST DETECTED DEADLOCK section
```

**Real-world example**: A payment service had 50 deadlocks/day. Cause: `transfer(from, to)` locked in argument order. Sorting `(min, max)` then locking eliminated all deadlocks.

```python
# Before: lock order varies
db.execute("UPDATE accounts SET ... WHERE id = ?", from_id)
db.execute("UPDATE accounts SET ... WHERE id = ?", to_id)

# After: deterministic order prevents deadlock
ids = sorted([from_id, to_id])
db.execute("UPDATE accounts SET ... WHERE id IN (?,?)", ids[0], ids[1])
```

---

### Q39. Blocking Queries — Identify & Resolve

**What**: A query waiting on a lock held by another transaction.

**How to find** (PostgreSQL):
```sql
SELECT pid, usename, query, wait_event_type, wait_event, state
FROM pg_stat_activity
WHERE wait_event_type = 'Lock' OR state != 'idle';

-- Who's blocking whom
SELECT
  blocked.pid AS blocked_pid, blocked.query AS blocked_query,
  blocking.pid AS blocking_pid, blocking.query AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(blocked.pid));
```

```sql
-- MySQL
SELECT * FROM performance_schema.data_lock_waits;
```

**Resolve**:
- Identify holder, kill if hung: `SELECT pg_terminate_backend(pid);`
- Common cause: idle-in-transaction connection
- Set `idle_in_transaction_session_timeout = '5min'` in PG

**Real-world example**: Nightly batch job blocked an autovacuum for 4 hours. Symptom: query latency creeping up, dead tuples accumulating. Found via pg_stat_activity. Fix: chunk batch, add timeout.

---

### Q40. Shared vs Exclusive Locks

**What**:
- **Shared (S)**: Multiple readers can hold. Blocks exclusive.
- **Exclusive (X)**: Only one holder. Blocks all.

**Why**: Allows many readers to coexist while serializing writers.

**Lock compatibility matrix**:
| Held / Requested | S | X |
|------------------|---|---|
| S | ✅ | ❌ |
| X | ❌ | ❌ |

**At which level**:
- Row level (`SELECT FOR SHARE` = S; `SELECT FOR UPDATE` = X)
- Table level (intent locks for DDL coordination)

**Real-world example**: `SELECT FOR SHARE` is rarely the right answer in OLTP. Most "I need to read and ensure it doesn't change" cases should be `SELECT FOR UPDATE` (you'll likely update anyway) or use optimistic locking.

---

### Q41. Sequences & Concurrency

**What**: Auto-incrementing counters for surrogate PKs.

**How they work**:
- PostgreSQL `SEQUENCE`: lockless cache (`CACHE 100`), backed by a relfile
- MySQL `AUTO_INCREMENT`: in-memory counter per table, persisted at intervals

**Pitfalls**:
1. **Gaps**: Rollback consumes a number — sequences are non-transactional
2. **Replication**: Replicas have separate sequences (PG); use logical replication carefully
3. **Restart on crash**: Both can advance after crash recovery
4. **`AUTO_INCREMENT` reset by ALTER**: Resets to MAX + 1

**Best practices**:
- Don't rely on contiguous IDs (gaps exist)
- For external IDs, use UUID/ULID instead
- For multi-master setups, use stepped sequences (master A: 1,3,5,...; master B: 2,4,6,...) or UUIDs

**Real-world example**: A reporting team complained about "missing order IDs." They expected contiguous integers. The team explained gaps were normal from rollbacks. Lesson: never expose internal IDs as user-visible "order numbers" — use a separate string.

---

### Q42. InnoDB Gap Locks

**What**: A lock on the "gap" between index records, preventing inserts into that range.

**Why they exist**: To prevent phantom reads at REPEATABLE READ isolation.

**How**:
```sql
-- T1: SELECT * FROM t WHERE id BETWEEN 10 AND 20 FOR UPDATE;
-- Now T2 cannot INSERT a row with id=15 — blocked by gap lock

-- Surprising case: gap locks on unique index can block inserts even on existing values
```

**Trade-offs**:
- ✅ Prevents phantoms at REPEATABLE READ
- ❌ Can cause unexpected deadlocks
- ❌ Limits concurrent inserts in same range

**Disabling**: `SET tx_isolation = 'READ-COMMITTED';` — disables gap locks (most production OLTP uses this).

**Real-world example**: A team reported sporadic deadlocks on inserts. Root cause: REPEATABLE READ + gap locks on a secondary index. Switching to READ COMMITTED eliminated the issue. (MySQL default is REPEATABLE READ; most teams should change to READ COMMITTED for higher throughput.)

---

### Q43. Page vs Row Locks

**What**:
- **Row lock**: Lock individual rows. Fine-grained, high concurrency.
- **Page lock**: Lock an entire page (8KB/16KB). Coarser, less metadata.

**When DBs use which**:
- **PostgreSQL**: Row locks via tuple headers (no separate lock table) + page-level for VACUUM
- **InnoDB**: Row locks via lock structures + gap/next-key locks
- **MyISAM (legacy)**: Table locks only — one writer at a time

**Real-world example**: Migration from MyISAM to InnoDB: write concurrency went from 50 → 5000 QPS purely from row-level locking.

---

### Q44. PostgreSQL MVCC Internals

**What**: Multi-Version Concurrency Control. Each row has version metadata; readers see a consistent snapshot.

**Why**: Readers don't block writers; writers don't block readers.

**How it works**:
- Each tuple has hidden `xmin` (created by) and `xmax` (deleted by) transaction IDs
- A snapshot = list of in-progress XIDs at transaction start
- A tuple is "visible" if `xmin` committed before snapshot AND (`xmax` is NULL OR `xmax` is after snapshot)

**Consequences**:
1. **No in-place updates**: UPDATE = delete + insert new version
2. **Dead tuples accumulate**: Need VACUUM to clean up
3. **XID wraparound**: 32-bit XID space — VACUUM must freeze old tuples before wraparound
4. **Index bloat**: Indexes point to dead heap tuples until VACUUMed

**Real-world example**: A team's table had 100M live rows but 800M dead tuples. Autovacuum couldn't keep up due to long-running transactions blocking it. Sequential scans got 10x slower. Fix: kill long transactions, run aggressive VACUUM.

---

### Q45. Transaction Isolation Levels — Trade-offs

**What**: Four standard levels controlling what anomalies are visible.

| Level | Throughput | Phenomena Prevented | Use case |
|-------|------------|---------------------|----------|
| READ UNCOMMITTED | Highest | None | Rarely used; PG treats as READ COMMITTED |
| READ COMMITTED | High | Dirty | OLTP default for most |
| REPEATABLE READ | Medium | Dirty, Non-repeat (and phantom in PG/InnoDB) | Reports needing consistency |
| SERIALIZABLE | Lowest | All | Financial settlement |

**PG vs MySQL defaults**:
- PostgreSQL default: READ COMMITTED
- MySQL/InnoDB default: REPEATABLE READ (uses snapshot isolation, prevents phantoms)

**Real-world example**: A balance check + transfer needs REPEATABLE READ or higher. READ COMMITTED would let two transfers each see the same starting balance and overdraft. SERIALIZABLE in PG uses SSI (Serializable Snapshot Isolation) — detects conflicts and aborts; app must retry.

---

### Q46. Lock Wait Timeout

**What**: How long a query waits for a lock before failing.

**How to configure**:
```sql
-- PostgreSQL: per-session
SET lock_timeout = '5s';

-- MySQL: per-session
SET innodb_lock_wait_timeout = 5;  -- default 50 seconds!
```

**Why important**: Default 50s in MySQL is way too long for OLTP. A blocking transaction can stall an entire app.

**Real-world example**: API requests timing out after 30s, but DB lock waits were 50s — connections piling up. Setting `innodb_lock_wait_timeout = 5` made failures explicit and fast.

---

### Q47. Optimistic vs Pessimistic — Picking with Examples

(See Q10 for general explanation.) Extended decision matrix:

**Use Optimistic when**:
- Read/write ratio > 10:1
- Contention low (most updates don't conflict)
- Distributed system (avoid coordinated locks)
- User-driven workflows (form edits, profile updates)

**Use Pessimistic when**:
- Contention high (everyone updating same row)
- Tight critical sections (account balance debits)
- Need to coordinate multiple resources

**Real-world example**: A wiki edits page — 100 editors, rarely on same page → optimistic with version. A flash sale on 1 SKU → pessimistic or atomic decrement (`UPDATE stock SET count = count - 1 WHERE count > 0 AND sku = ?` — let DB do the locking).

---

### Q48. Phantom Rows Across Isolation Levels

**What**: New rows appearing in a range query during a transaction.

**How each level handles**:
- READ COMMITTED: phantoms appear freely
- REPEATABLE READ (PG, InnoDB): snapshot prevents phantoms (uses MVCC)
- REPEATABLE READ (strict SQL standard): doesn't prevent phantoms (uses 2PL)
- SERIALIZABLE: prevents all anomalies

**Real-world example**: Standard SQL spec REPEATABLE READ allows phantoms; InnoDB and PG don't (because they use snapshot, not strict 2PL). Don't assume cross-DB consistency.

---

### Q49. Detecting & Monitoring Lock Contention

**How**:
```sql
-- PostgreSQL: wait events
SELECT wait_event_type, wait_event, count(*)
FROM pg_stat_activity
WHERE state != 'idle'
GROUP BY 1,2 ORDER BY count DESC;

-- pg_locks gives detail
SELECT * FROM pg_locks WHERE NOT granted;

-- MySQL
SELECT * FROM performance_schema.data_lock_waits;
SHOW ENGINE INNODB STATUS\G  -- TRANSACTIONS section
```

**Metrics to alert on**:
- Active connections > 80% of max_connections
- Lock wait time > 1s
- Number of "Lock" wait events sustained > 10
- Deadlock rate > 1/min

**Real-world example**: Added Datadog dashboard for `pg_stat_activity` wait events. Caught a slow nightly job blocking app queries before users complained.

---

### Q50. PostgreSQL Advisory Locks

**What**: Application-level locks identified by integer keys; database mediates them but doesn't enforce row/table semantics.

**Why**: Cross-session coordination for app logic — e.g., "only one worker process this batch."

**How**:
```sql
-- Session lock (held until session ends or explicit release)
SELECT pg_advisory_lock(12345);
-- ... critical section ...
SELECT pg_advisory_unlock(12345);

-- Transaction lock (released on COMMIT/ROLLBACK)
SELECT pg_advisory_xact_lock(12345);

-- Non-blocking try
SELECT pg_try_advisory_lock(12345);  -- true if acquired
```

**Real-world example**: Used `pg_advisory_xact_lock(hashtext('job_name'))` in a cron job to prevent two app instances from running the same nightly job simultaneously. Replaced ZooKeeper/etcd for this lightweight case — one less moving part.

---

## SECTION 4: TRANSACTIONS & ACID

### Q51. ACID Properties — Why Each Matters

**What**:
- **Atomicity**: All-or-nothing. Partial failures roll back.
- **Consistency**: DB moves from valid state to valid state (constraints, FKs, triggers preserved).
- **Isolation**: Concurrent transactions don't see each other's intermediate state.
- **Durability**: Once committed, survives crashes.

**Why ACID matters**: Without it, you write reconciliation systems.

**How DBs implement each**:
- A: WAL + rollback segments
- C: Constraint checks at commit, triggers
- I: MVCC + locking
- D: fsync of WAL before COMMIT returns

**Trade-offs senior engineers know**:
- True D requires `synchronous_commit = on` (PG) or `innodb_flush_log_at_trx_commit = 1` (MySQL) — slower
- Some workloads can accept "loose D" — accept losing last second of commits for 10x throughput
- BASE (eventually consistent) is alternative for global scale (DynamoDB, Cassandra)

**Real-world example**: A bank can't relax durability. A social media "likes" counter can. Configure per-database, not as a global policy.

---

### Q52. Anomalies & Isolation Levels (Recap)

(Covered in Q11 and Q45.) Key reference table:

| Phenomenon | Definition | Prevention level |
|-----------|-----------|------------------|
| Dirty Read | Read uncommitted | READ COMMITTED+ |
| Non-Repeatable Read | Same row read 2x differs | REPEATABLE READ+ |
| Phantom Read | Same range query, more rows | REPEATABLE READ (PG/InnoDB) or SERIALIZABLE (strict) |
| Write Skew | Two TX both check + write, breaking invariant | SERIALIZABLE |

**Write skew example** (subtle, often missed):
```sql
-- Invariant: at least one doctor on call
-- T1: SELECT count(*) FROM oncall WHERE on_duty=true;  -- 2
-- T2: SELECT count(*) FROM oncall WHERE on_duty=true;  -- 2
-- T1: UPDATE oncall SET on_duty=false WHERE name='A';  -- now 1
-- T2: UPDATE oncall SET on_duty=false WHERE name='B';  -- now 0!
-- REPEATABLE READ allows this. SERIALIZABLE catches it.
```

**Real-world example**: A scheduling system had a "must have at least 1 admin" rule violated occasionally. Cause: write skew. Fix: use SERIALIZABLE or take an explicit advisory lock during the check.

---

### Q53. The Four Standard Isolation Levels

(See Q11, Q45.)

**Important nuance — PostgreSQL specifics**:
- READ UNCOMMITTED in PG is internally treated as READ COMMITTED (PG never shows uncommitted data)
- REPEATABLE READ = Snapshot Isolation (prevents phantoms)
- SERIALIZABLE = Serializable Snapshot Isolation (SSI) — adds conflict detection

**MySQL specifics**:
- REPEATABLE READ uses MVCC for consistent reads + next-key locks for write-side phantom prevention
- Default level; recommended to change to READ COMMITTED for less locking

---

### Q54. Snapshot Isolation vs Serializable Snapshot Isolation

**What**:
- **SI**: All reads return a consistent snapshot at TX start
- **SSI** (PostgreSQL only at OLTP level): SI + detects serialization conflicts at commit

**Why SSI**: SI allows write skew; SSI doesn't.

**How SSI works**: Tracks "dangerous patterns" — rw-dependencies between concurrent transactions — and aborts the offending one.

**Trade-off**: SSI can cause spurious "serialization failure" — application MUST handle retry.

**Real-world example**: A multi-tenant SaaS used SERIALIZABLE for billing operations. Got "could not serialize access" errors 1% of the time. Wrapped in retry-on-serialization-failure helper — clean code, true correctness.

---

### Q55. Savepoints

**What**: Nested rollback points within a transaction.

**How**:
```sql
BEGIN;
INSERT INTO orders (...) VALUES (...);
SAVEPOINT sp1;
INSERT INTO order_items (...) VALUES (...);  -- might fail
-- if it fails:
ROLLBACK TO SAVEPOINT sp1;
-- order still inserted; can retry items
COMMIT;
```

**Why**: Allows partial rollback without losing entire transaction work.

**Pitfall**: Savepoints cost memory (track undo info). Heavy use in long transactions bloats undo logs.

**Real-world example**: A bulk import processed 10K rows per transaction. Each row had a savepoint to skip invalid records without aborting the batch. Worked but added 30% overhead. Better pattern: do validation first, then insert valid rows in one shot.

---

### Q56. Implicit vs Explicit Transactions

**What**:
- **Implicit (autocommit)**: Each statement is its own transaction
- **Explicit**: Wrapped in `BEGIN ... COMMIT`

**Default**: Both PG and MySQL default to autocommit ON.

**Pitfall**: Most ORMs disable autocommit and manage transactions. Mixing modes leads to "transaction not closed" issues.

**Real-world example**: A new engineer ran `UPDATE` in psql without BEGIN. With autocommit on, change persisted. Without autocommit, the session held an uncommitted transaction blocking VACUUM. Always know the autocommit state of your tool.

---

### Q57. ROLLBACK Implications

**What**: Undoes all transaction changes.

**Why important**:
- Rollback isn't free: PG keeps the dead tuples for VACUUM; InnoDB uses undo log
- Long-running rollback can take as long as the original work
- Sequences are NOT rolled back — IDs are consumed even if you ROLLBACK

**Real-world example**: A migration script crashed midway, triggering ROLLBACK of a 4-hour UPDATE. The rollback took another 3.5 hours. Lesson: chunk large changes — never one giant transaction.

---

### Q58. Long-Running Transactions — Hidden Costs

**Why bad**:
- **PostgreSQL**: Blocks VACUUM from cleaning dead tuples → bloat
- **MySQL**: Pins undo log → undo log grows → can fill disk
- Holds locks longer → blocks others
- Holds the snapshot → must keep old versions of changed rows

**How to detect**:
```sql
-- PostgreSQL: long transactions
SELECT pid, age(clock_timestamp(), xact_start), query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start;

-- Set safety net
SET idle_in_transaction_session_timeout = '5min';
```

**Real-world example**: A monitoring script kept a "report" transaction open for 2 hours. Dead tuples accumulated to 50GB. After killing the script and forcing VACUUM, performance returned. Added Datadog alert on "longest_xact_age > 10min".

---

### Q59. WAL — Why It's Critical

**What**: Write-Ahead Log. All changes written to a sequential log BEFORE updating data files.

**Why**:
1. **Durability**: WAL is fsync'd on COMMIT
2. **Crash recovery**: Replay WAL after crash
3. **Replication**: Stream WAL to replicas
4. **Point-in-time recovery**: Combine base backup + WAL

**How it works**:
- COMMIT → write WAL records → fsync → return to client
- Background process flushes data pages later (Checkpoint)
- Sequential writes are fast (vs random data page writes)

**Tuning**:
- `wal_compression = on` (PG) — saves disk space
- `max_wal_size` — controls checkpoint frequency
- `synchronous_commit` — durability vs latency trade-off

**Real-world example**: A team disabled `synchronous_commit` for a non-critical event log table — write throughput up 5x. Knowingly accepting potential loss of last 200ms of commits on crash.

---

### Q60. Consistency vs Isolation in ACID

**What**:
- **Isolation**: Transactions don't see each other's intermediate state
- **Consistency**: DB-level invariants are preserved (constraints, triggers)

**Why distinct**: You can have isolation without consistency if you don't define constraints. C in ACID is more about app-level + DB-level rules than concurrency.

**Real-world example**: A foreign key constraint enforces consistency: you can't insert an order with an invalid `user_id`. Isolation ensures another transaction can't delete that user concurrently. Both needed.

---

### Q61. Distributed Transactions

**What**: A transaction spanning multiple DBs/services.

**Why hard**: CAP theorem — can't have C, A, P simultaneously across network partitions.

**Protocols**:
- **2PC (Two-Phase Commit)**: Coordinator → "prepare?" → wait all → "commit"
  - Pitfall: coordinator failure leaves participants stuck
- **Saga pattern**: Sequence of local transactions + compensating actions
  - Use for long-running business flows (booking trip = flight + hotel + car)

**How**:
```python
# Saga pseudocode
try:
    reserve_flight()
    try:
        reserve_hotel()
        try:
            charge_card()
        except:
            cancel_hotel()  # compensate
            raise
    except:
        cancel_flight()
        raise
except:
    notify_failure()
```

**Real-world example**: A travel booking app moved from 2PC across 3 DBs (frequently stuck) to saga with idempotent compensations. Lower latency, no stuck transactions, manual reconciliation tools for edge cases.

---

### Q62. Autocommit Mode — Gotchas

**What**: Each statement auto-commits unless inside a transaction.

**Gotchas**:
1. **DDL implicit commit (MySQL)**: `CREATE TABLE` commits the open transaction
2. **No transaction safety in batch scripts**: A loop of INSERTs with autocommit means each row is its own COMMIT — 100x slower than batched
3. **psql `\copy` is autocommitted**: One COMMIT after the whole load — different from line-by-line INSERTs

**Real-world example**: A bulk insert script ran INSERT in autocommit, did 10K rows in 30 minutes. Wrapping in BEGIN/COMMIT: 30 seconds. 60x speedup.

```python
# Slow: autocommit per row
for row in data:
    cursor.execute("INSERT ...", row)

# Fast: one transaction
with conn:  # implicit transaction
    cursor.executemany("INSERT ...", data)
```

---

## SECTION 5: REPLICATION & HIGH AVAILABILITY

### Q63. Synchronous vs Asynchronous Replication

**What**:
- **Async**: Primary commits, then ships WAL/binlog to replicas (default)
- **Sync**: Primary waits for at least one replica to confirm before COMMIT returns

**Trade-offs**:
| | Async | Sync |
|---|---|---|
| Write latency | Low (local fsync) | Higher (network + replica fsync) |
| Data loss on failover | Yes (replication lag window) | None (if synchronous_standby up) |
| Availability | Higher (replica down doesn't block) | Lower (replica down can block commits) |

**How (PostgreSQL)**:
```sql
-- postgresql.conf
synchronous_standby_names = 'replica1, replica2'
synchronous_commit = on  -- wait for at least 1
-- or 'remote_apply' (replica must apply, not just receive)
```

**MySQL**: Semi-sync via `rpl_semi_sync_master_enabled`

**Real-world example**: A fintech ran sync replication for the primary write region — RPO=0 mandate. For analytics replicas, used async (10-second lag acceptable). Mixed-mode is common.

---

### Q64. Read Replicas — Use Cases

**What**: Replicas accepting only SELECT queries, served from replicated data.

**Use cases**:
1. **Read scaling**: Offload heavy reads (reports, search)
2. **HA**: Quick failover target
3. **Geographic distribution**: Local reads in multi-region apps
4. **Analytics isolation**: Heavy aggregations don't impact OLTP
5. **Disaster recovery**: Replica in another region

**Pitfalls**:
- **Replication lag**: Replica data is stale by Xms
- **Connection management**: App needs primary vs replica routing
- **Cascading lag**: Read replica catching up after a vacuum storm

**How to route**:
```python
# Application-level routing
if query.is_read_only():
    conn = read_replica_pool.connection()
else:
    conn = primary_pool.connection()

# Or use a proxy: PgBouncer, ProxySQL, AWS RDS Proxy
```

**Real-world example**: A SaaS app scaled to 10K QPS reads with 1 primary + 5 replicas. Replicas handled 95% of traffic. After-action: ensure replicas in same AZ as readers for low latency, but spread across AZs for HA.

---

### Q65. Replication Lag — Causes & Implications

**What**: Time delta between primary commit and replica apply.

**Causes**:
1. **Network bandwidth saturation** — replica WAL stream slow
2. **Single-threaded apply** — replicas often apply WAL on one thread; primary writes in parallel
3. **Long queries on replica** — block WAL apply (PG's `max_standby_streaming_delay`)
4. **Replica I/O bottleneck** — slower disk than primary
5. **Big transactions** — replica applies them as one unit

**How to measure**:
```sql
-- PostgreSQL: on replica
SELECT pg_wal_lsn_diff(pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn());

-- Or in seconds
SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()));

-- MySQL
SHOW REPLICA STATUS\G  -- Seconds_Behind_Source
```

**Mitigations**:
- Parallel replication (PG 10+: `recovery_min_apply_delay`, MySQL parallel replication threads)
- Smaller transactions
- Don't run heavy queries on replicas without `hot_standby_feedback`

**Real-world example**: Replica lag spiked to 30 minutes during a nightly migration. Cause: one massive UPDATE on primary. Fix: chunk into 10K-row batches. Lag never exceeded 10 seconds again.

---

### Q66. PostgreSQL Streaming Replication

**What**: Primary sends WAL records to replicas in real-time over TCP.

**How**:
1. Take base backup (`pg_basebackup`)
2. Configure replica with `primary_conninfo`
3. Replica connects, primary streams WAL
4. Replica applies WAL continuously

**Setup**:
```bash
# On primary
echo "host replication replicator 10.0.0.0/24 md5" >> pg_hba.conf
# postgresql.conf
wal_level = replica  # or 'logical' for logical too
max_wal_senders = 10

# On replica
pg_basebackup -h primary -D /var/lib/pgsql/data -R -P
# Creates standby.signal + primary_conninfo
systemctl start postgresql
```

**Slot vs no-slot**:
- **Without slot**: Primary can recycle WAL before replica reads it → replica falls behind permanently
- **With replication slot**: Primary retains WAL until replica consumes — safer but can fill disk if replica down

**Real-world example**: A team's replica went down for 3 days. Without a slot, primary purged WAL. Had to rebuild replica from scratch (4 hours). Lesson: use slots, BUT monitor `pg_replication_slots.confirmed_flush_lsn` lag to avoid filling disk.

---

### Q67. Logical vs Physical Replication

**What**:
- **Physical**: Replicates WAL byte-for-byte; replica is exact copy
- **Logical**: Replicates row-level changes (INSERT/UPDATE/DELETE); replica schema can differ

**Why use logical**:
1. **Different schemas** between primary/replica (e.g., add columns for analytics)
2. **Selective replication** (subset of tables)
3. **Cross-version upgrades** (replicate from PG 13 → PG 16, then cut over)
4. **Cross-engine** (PG → Kafka → anywhere via Debezium)

**Trade-offs**:
- Physical: faster, exact mirror, but inflexible
- Logical: flexible, but no DDL replication; some types unsupported

**How** (PG 10+):
```sql
-- On primary: create publication
CREATE PUBLICATION pub1 FOR TABLE orders, users;

-- On replica: subscribe
CREATE SUBSCRIPTION sub1
  CONNECTION 'host=primary dbname=mydb user=replicator'
  PUBLICATION pub1;
```

**Real-world example**: Major version upgrade PG 11 → 15 with 5TB database. Physical replication doesn't work across major versions. Used logical replication: set up new cluster, replicate, cut over with 10s downtime.

---

### Q68. Split Brain — Causes & Prevention

**What**: Two nodes both think they're primary, both accept writes → data divergence.

**Causes**:
- Network partition between primary and replica
- Promotion script too aggressive (promotes replica before old primary truly dead)
- Manual operator error during failover

**Prevention**:
1. **Quorum / consensus**: Need majority for promotion (Patroni + etcd, RAFT)
2. **STONITH (Shoot The Other Node In The Head)**: Kill old primary before promoting
3. **Fencing**: Network/IP fencing — block old primary from accepting writes
4. **Witness/Arbiter**: 3rd node breaks ties

**Real-world example**: A self-managed PG cluster experienced split-brain when primary's network blip caused replica promotion; primary came back. Two minutes of divergent writes. Resolution: 6 hours of manual reconciliation. Lesson: use proven HA stack (Patroni, RDS, Cloud SQL) — don't roll your own.

---

### Q69. Failover, Failback, Switchover

**What**:
- **Failover**: Unplanned promotion of a replica due to primary failure
- **Switchover**: Planned, controlled promotion (e.g., maintenance)
- **Failback**: Returning workload to original primary after recovery

**How to test**:
- Chaos engineering: regularly kill primary in staging
- Practice quarterly: documented runbooks decay without exercise

**Senior engineer principles**:
1. Automate failover but require human approval for failback (lower urgency, higher impact)
2. Always measure RTO (recovery time) and RPO (data loss) in drills
3. Have a rollback plan
4. Test app behavior during failover (connection drops, retries)

**Real-world example**: A team practiced failover every quarter. When primary actually died, recovery took 5 min — same as drills. Other team had never tested; their "failover" took 6 hours of debugging.

---

### Q70. Semi-Synchronous Replication

**What**: Primary waits for replica to receive (but not necessarily apply) WAL before COMMIT.

**Why**: Sweet spot — better durability than async, lower latency than full sync.

**MySQL**:
```sql
INSTALL PLUGIN rpl_semi_sync_master SONAME 'semisync_master.so';
SET GLOBAL rpl_semi_sync_master_enabled = 1;
SET GLOBAL rpl_semi_sync_master_timeout = 1000;  -- ms before falling back to async
```

**PostgreSQL**: `synchronous_commit = remote_write` (received but not flushed on replica)

**Real-world example**: E-commerce checkout used semi-sync — guaranteed replica had the row before client got "order confirmed." Loss window <1s vs minutes with async.

---

### Q71. Replication Conflicts & Resolution

**What**: When logical replication can't apply a change (FK violation, missing row, schema mismatch).

**Common conflicts**:
1. Replica's row missing for UPDATE/DELETE
2. PK conflict on INSERT
3. Schema mismatch (column types diverged)

**How PG 16+ handles**:
```sql
-- Subscriber side: skip the conflict
ALTER SUBSCRIPTION sub1 SKIP (lsn = '0/14C0378');

-- Detection
SELECT * FROM pg_stat_subscription_stats;
```

**Real-world example**: A team added a column to a replica before primary, then logical replication tried to INSERT with that column null-violated. Fix: schema changes always primary-first, then replica. Use schema migration tools (Flyway, Liquibase).

---

### Q72. WAL Archiving for Backup/PITR

**What**: Continuously archiving WAL files to durable storage (S3, NFS).

**Why**: Base backup + archived WAL = restore to ANY point in time.

**How (PG)**:
```bash
# postgresql.conf
archive_mode = on
archive_command = 'aws s3 cp %p s3://bucket/wal/%f'

# To restore to a specific time:
restore_command = 'aws s3 cp s3://bucket/wal/%f %p'
recovery_target_time = '2024-01-15 14:30:00'
```

**Tools**: pgBackRest, WAL-G, Barman.

**Real-world example**: Engineer accidentally `DELETE FROM orders;`. PITR restored to 1 second before delete. 14M orders recovered. Lesson: practice PITR drills; commands have nuances.

---

### Q73. MySQL Binary Log Formats

**What**: How MySQL records changes for replication.

**Formats**:
1. **STATEMENT**: Logs SQL statements. Compact but non-deterministic (NOW(), RAND() can diverge)
2. **ROW**: Logs row before+after images. Larger but always deterministic. Default in 5.7+.
3. **MIXED**: Statement unless non-deterministic, then ROW.

**Recommendation**: ROW for safety; MIXED as backward-compat.

**Trade-off**: ROW logs can be huge — a single `UPDATE WHERE 1=1` logs every row. Use binlog_row_image=MINIMAL to reduce size.

**Real-world example**: A statement-based replica diverged because `INSERT ... NOW()` differed by microseconds. Switched to ROW — diverged once, never again.

---

### Q74. GTID-Based Replication

**What**: Global Transaction IDs uniquely identify every transaction across the topology.

**Why**:
1. **Easy failover**: Replica knows exactly which TX it has applied
2. **Topology changes**: Re-pointing replicas is trivial (`MASTER_AUTO_POSITION = 1`)
3. **No "find the correct binlog position" pain**

**How (MySQL)**:
```sql
-- my.cnf
gtid_mode = ON
enforce_gtid_consistency = ON
log_replica_updates = ON

-- After failover, on new replica:
CHANGE REPLICATION SOURCE TO SOURCE_HOST='new-primary', SOURCE_AUTO_POSITION=1;
```

**Real-world example**: Pre-GTID, failover required noting the binlog position on the old primary and configuring replicas with that exact position. Took 20 minutes and was error-prone. Post-GTID: 2 commands, 30 seconds.

---

## SECTION 6: MAINTENANCE & ADMINISTRATION

### Q75. PostgreSQL VACUUM — Why & How

**What**: Reclaims space from dead tuples; updates visibility map; prevents XID wraparound.

**Why critical** (consequence of MVCC):
- UPDATE leaves dead tuples (old row versions)
- Without VACUUM, dead tuples accumulate → table bloat
- XID wraparound (~2B transactions) → DB shuts down to prevent corruption

**Types**:
1. **VACUUM**: Marks dead tuples reusable; doesn't return space to OS
2. **VACUUM FULL**: Rewrites table — returns space but takes AccessExclusiveLock (downtime!)
3. **VACUUM FREEZE**: Aggressively freezes old XIDs to prevent wraparound

**How**:
```sql
-- Standard vacuum (non-blocking)
VACUUM ANALYZE orders;

-- Wraparound prevention
VACUUM FREEZE orders;

-- For bloat reclamation: prefer pg_repack (no exclusive lock)
-- VACUUM FULL only for emergency
```

**Real-world example**: An engineer ran `VACUUM FULL` on a 200GB table during business hours. Locked all reads/writes for 45 minutes. Should have used `pg_repack`.

---

### Q76. Autovacuum Tuning

**What**: Background daemon that runs VACUUM automatically based on thresholds.

**Key parameters**:
```ini
autovacuum_vacuum_scale_factor = 0.2     # 20% dead tuples triggers vacuum
autovacuum_vacuum_threshold = 50         # min dead tuples
autovacuum_analyze_scale_factor = 0.1
autovacuum_naptime = 1min
autovacuum_max_workers = 3
autovacuum_vacuum_cost_limit = 200       # throttle to avoid I/O spike
```

**For hot tables, override per-table**:
```sql
ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);
```

**Symptoms of autovacuum issues**:
- Bloat growing
- "wraparound" warnings in logs
- Long-running autovacuum holding back others (`autovacuum_max_workers` too low)

**Real-world example**: A 1TB orders table updated 1M rows/day. Default scale factor required 200M dead tuples before vacuuming — too late. Lowered to 0.02 per-table → vacuum runs every few hours, no bloat.

---

### Q77. Online Schema Migrations — Large Tables

**What**: Adding/altering columns on multi-billion-row tables without downtime.

**Why hard**: Naive `ALTER TABLE` takes AccessExclusiveLock — blocks all reads/writes.

**Techniques**:

**1. PostgreSQL: Many ALTER are now fast (>=11)**
- Adding nullable column with default: instant (PG 11+)
- Adding NOT NULL with constant default: instant (PG 11+)
- Type changes that don't require rewrite: instant

```sql
-- Old way (slow): rewrites table
ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';

-- PG 11+: instant (stores default in catalog, fills lazily)
```

**2. Tools that do it online**:
- **pg_repack**: rebuilds table with minimal locking
- **pt-online-schema-change** (MySQL): trigger-based copy
- **gh-ost** (MySQL): binlog-based copy
- **Postgres squitch/sqitch + careful CONCURRENTLY** for indexes

**3. Manual safe pattern**:
```sql
-- Step 1: Add nullable column (instant)
ALTER TABLE orders ADD COLUMN status TEXT;

-- Step 2: Backfill in batches
UPDATE orders SET status = 'pending' WHERE id BETWEEN 1 AND 10000;

-- Step 3: Add NOT NULL constraint as CHECK (no full scan)
ALTER TABLE orders ADD CONSTRAINT status_not_null CHECK (status IS NOT NULL) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT status_not_null;  -- only takes ShareUpdateExclusive

-- Step 4 (optional): convert to true NOT NULL when convenient
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;  -- can now skip full scan in PG 12+
```

**Real-world example**: GitHub's gh-ost was created exactly for this — they couldn't afford 30-minute table locks on `pull_requests` table. Use proven tools.

---

### Q78. Table Reorganization

**What**: Rewriting a table to reclaim space, change order, or change storage parameters.

**Why**:
- Bloat reclamation
- Cluster table by an index for range scan performance
- Change fillfactor or storage params

**How**:
```sql
-- PG: pg_repack (online, no long lock)
pg_repack -t orders mydb

-- MySQL: OPTIMIZE TABLE (online in 5.6+ for InnoDB)
OPTIMIZE TABLE orders;
```

**Trade-off**: Doubles disk space temporarily.

**Real-world example**: A heavily updated 500GB table had 60% bloat. `pg_repack` took 6 hours, reclaimed 300GB, no service impact.

---

### Q79. Detecting & Reducing Bloat

**Detect**:
```sql
-- PostgreSQL
CREATE EXTENSION pgstattuple;
SELECT * FROM pgstattuple_approx('orders');

-- Or use the bloat estimation queries from pgexperts/check_postgres

-- MySQL
SELECT table_name, data_free
FROM information_schema.tables
WHERE table_schema = 'mydb' AND data_free > 1024*1024*100;
```

**Reduce**:
- PG: VACUUM (mark reusable) → if not enough, pg_repack
- MySQL: OPTIMIZE TABLE

**Prevention**:
- Tune autovacuum
- Avoid long transactions
- Use HOT updates (don't modify indexed columns when possible)

**Real-world example**: 30% bloat is normal; >50% is a red flag. Set Datadog alert on bloat ratio.

---

### Q80. Safely Dropping a Column

**What**: Removing a column from a large table.

**The fast way (PG)**:
```sql
-- PostgreSQL: ALTER TABLE DROP COLUMN is instant (metadata only)
-- Old column data stays in heap until next rewrite (VACUUM FULL or pg_repack)
ALTER TABLE orders DROP COLUMN old_status;
```

**The careful way (MySQL)**:
```sql
-- INSTANT in MySQL 8.0.29+ for some types
ALTER TABLE orders DROP COLUMN old_status, ALGORITHM=INSTANT;

-- Otherwise INPLACE rebuilds the table
ALTER TABLE orders DROP COLUMN old_status, ALGORITHM=INPLACE, LOCK=NONE;

-- Best: use gh-ost or pt-online-schema-change
```

**Senior engineer pattern — staged removal**:
1. Stop reading the column in app (deploy)
2. Stop writing the column (deploy)
3. After confidence period (1 week), DROP COLUMN
4. (Optional) Rewrite table to reclaim space

**Real-world example**: Direct DROP COLUMN on PG took 50ms (just catalog change). The actual data wasn't reclaimed until pg_repack 6 months later when bloat became an issue.

---

### Q81. Backup Types

**What**:
- **Full**: Entire DB copy
- **Incremental**: Only blocks/files changed since last (any) backup
- **Differential**: Only changes since last FULL

**Trade-offs**:
| | Full | Incremental | Differential |
|---|---|---|---|
| Backup time | Long | Short | Medium |
| Restore time | Single restore | Full + all incrementals | Full + 1 differential |
| Storage | Largest | Smallest | Medium |
| Risk | Low | High (any incremental missing = broken chain) | Medium |

**Real-world strategy** (3-2-1 rule):
- 3 copies of data
- 2 different media
- 1 offsite

**Tools**:
- pgBackRest, Barman, WAL-G (PG)
- Percona XtraBackup, mysqldump, MyDumper (MySQL)

**Real-world example**: A team did full backups nightly + WAL archiving. Disk filled → backup failed silently for 2 weeks. Always alert on backup success, not just failure. Test restores monthly.

---

### Q82. Point-in-Time Recovery (PITR)

**What**: Restore database to any specific timestamp.

**How (PG)**:
1. Full backup taken (`pg_basebackup`)
2. WAL archived continuously
3. Restore: copy backup + apply WAL up to target time

```bash
# Restore
pg_basebackup -D /restore/data
# postgresql.conf
restore_command = 'cp /wal-archive/%f %p'
recovery_target_time = '2024-01-15 14:30:00'
# Start server → recovers to target → promotes
```

**RPO**: How much data you're willing to lose. RPO=0 requires sync replication, not just PITR.

**Real-world example**: Dev `TRUNCATE`d production users table. PITR restored to 30 seconds before. Saved $5M business. The team had practiced this drill; restore took 2 hours.

---

### Q83. Health Monitoring & Alerts

**Senior-engineer baseline metrics**:

**Connections**:
- Active connections / max_connections > 80% → alert
- Idle in transaction > 5min → kill

**Replication**:
- Replication lag > 10s (warn), > 60s (page)
- WAL backlog size

**Performance**:
- p99 query latency
- Slow query count
- Cache hit ratio (target >99% for OLTP)
- Deadlocks per minute

**Storage**:
- Disk usage > 80% → warn
- Bloat ratio > 50% → investigate
- WAL/binlog growth rate

**Tools**: Datadog, Prometheus + Grafana, pganalyze, pg_stat_statements, percona-monitoring.

**Real-world example**: Alert fired on "disk 85%". On inspection: WAL not being archived due to S3 IAM change. Fixed quickly. Without monitoring, would have hit 100% in 3 hours and DB would have stopped.

---

### Q84. Slow Query Logs

**What**: Log of queries exceeding a duration threshold.

**Configure (PG)**:
```ini
# postgresql.conf
log_min_duration_statement = 100ms  # log anything slower
log_statement = 'mod'  # log all DDL/DML
log_temp_files = 0  # log temp file creation
log_lock_waits = on
```

**Configure (MySQL)**:
```ini
slow_query_log = ON
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 0.1
log_queries_not_using_indexes = ON  # warning: noisy
```

**Even better — pg_stat_statements** (PG):
```sql
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 20;
```

**Real-world example**: pg_stat_statements showed a `SELECT count(*) FROM events` running 10K times/day at 5s each — never noticed because each was "fast enough." Total: 14 hours of CPU/day. Added a counter cache.

---

### Q85. Major vs Minor Version Upgrades

**Minor (e.g., 15.3 → 15.4)**:
- Bug fixes, security patches
- No data format changes
- Restart enough; should be done quarterly

**Major (15 → 16)**:
- New features, possible format changes
- Strategies:
  1. **pg_upgrade**: In-place, fast, but downtime
  2. **Logical replication**: Set up new cluster, replicate, cut over (minimal downtime)
  3. **Dump/restore**: Slowest, simplest

**For MySQL**:
- `mysql_upgrade` between minors
- Major version: similar — use replication for low-downtime upgrades

**Real-world example**: Pre-PG 10, upgrades were painful (no native logical rep). Post-PG 10, did 12→14 with 2 minutes of downtime using logical replication.

---

### Q86. Estimating Table/Index Sizes

**How**:
```sql
-- PG: sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS heap,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Growth tracking: snapshot daily
```

**Unexpected growth — common causes**:
1. Bloat (dead tuples not vacuumed)
2. Index growth (unused/redundant indexes)
3. TOAST tables (large values in BYTEA/TEXT)
4. Replication slot retention (`SELECT * FROM pg_replication_slots`)
5. WAL accumulating because archive_command failing

**Real-world example**: A team's DB grew 50GB/week unexplained. Cause: orphaned replication slot from a deleted replica retaining 200GB of WAL. Dropped slot, space reclaimed.

---

### Q87. Statistics Analysis & Rebuilding

**What**: Stats tell the optimizer about data distribution. Stale stats → bad plans.

**When stats go stale**:
- After bulk insert/delete
- After major data shift (e.g., new tenant onboarded)
- After table truncate + reload

**How**:
```sql
-- PG
ANALYZE orders;  -- collects stats
ANALYZE orders (status);  -- one column only

-- View
SELECT * FROM pg_stats WHERE tablename='orders';

-- MySQL
ANALYZE TABLE orders;
```

**Tune sampling**:
```sql
-- More accurate stats for skewed columns (more histogram buckets)
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 5000;
ANALYZE orders;
```

**Real-world example**: After importing 100M rows, queries were 50x slower. `ANALYZE` not run because autovacuum threshold hadn't triggered (only fires when X% changes). Manual `ANALYZE` fixed in seconds.

---

### Q88. MySQL Table Fragmentation

**What**: Pages partially empty, rows scattered across pages.

**Why it happens**: DELETEs leave gaps; UPDATEs that grow rows cause page splits.

**Detect**:
```sql
SELECT table_name, data_length, data_free, data_free / data_length AS fragmentation_pct
FROM information_schema.tables
WHERE table_schema = 'mydb';
```

**Address**:
- `OPTIMIZE TABLE orders` — rebuilds (online for InnoDB)
- For heavy delete workloads, partition by time and DROP old partitions instead

**Real-world example**: A logs table accumulated 40% fragmentation after a cleanup job. OPTIMIZE TABLE reclaimed 200GB. Better approach: partition by month, drop oldest partition each month — no fragmentation, no maintenance.

---

### Q89. Comprehensive Backup Strategy

**Senior engineer's backup checklist**:

1. **Multiple types**: Daily full + continuous WAL/binlog
2. **Multiple locations**: Local + S3 + cross-region
3. **Encryption**: At-rest with KMS-managed keys
4. **Retention policy**: e.g., 7 daily + 4 weekly + 12 monthly + 7 yearly
5. **Test restores**: Quarterly drill — practice the RUNBOOK
6. **Monitoring**: Alert on backup failure, missing WAL files, age
7. **Recovery objectives**: Know your RTO (recovery time) and RPO (data loss)
8. **Logical backups too**: pg_dump for granular restore of single tables

**Real-world example**: A SaaS lost 6 hours of data because daily backup completed at 2 AM, then a corruption at 8 AM required restore — losing 6 hours. They switched to continuous WAL archiving — RPO=5 seconds.

---

## SECTION 7: PERFORMANCE TUNING

### Q90. Key PostgreSQL Tuning Parameters

**Memory**:
- `shared_buffers` = 25% of RAM (max ~8GB benefit; OS cache helps beyond)
- `effective_cache_size` = 50-75% of RAM (just a hint to planner)
- `work_mem` = total_RAM / (max_connections * 4) — per sort/hash operation
- `maintenance_work_mem` = 1-2GB for VACUUM, CREATE INDEX

**Checkpoints**:
- `max_wal_size` = 4-16GB (bigger = less frequent checkpoint, less I/O storm)
- `checkpoint_completion_target` = 0.9 (spread I/O over checkpoint window)

**Connections**:
- `max_connections` = 100-500 (use PgBouncer beyond)

**Storage**:
- `random_page_cost` = 1.1 for SSD (default 4 assumes HDD)
- `effective_io_concurrency` = 200 for SSD, 1-2 for HDD

**Logging**:
- `log_min_duration_statement` = 100ms
- `log_lock_waits` = on

**Real-world example**: An app on default PG config (shared_buffers=128MB) on a 64GB-RAM machine. Cache hit ratio was 65%. After tuning shared_buffers=16GB and random_page_cost=1.1, hit ratio rose to 99.8%, p99 latency dropped 80%.

---

### Q91. shared_buffers, effective_cache_size, work_mem (PG)

**shared_buffers**: Memory PostgreSQL itself reserves for caching data pages.
- Set to 25% of RAM
- Don't set above 40% — PG relies on OS cache too
- Larger doesn't always help (diminishing returns past 8GB on Linux)

**effective_cache_size**: Hint to planner about total memory available (PG + OS cache).
- Set to 50-75% of RAM
- Doesn't actually allocate memory; just changes planner cost estimates
- Higher = planner more likely to use index scans

**work_mem**: Memory per operation (sort, hash, etc.)
- If set too low: operations spill to disk → slow
- If set too high: many concurrent queries can exhaust RAM
- Formula: `RAM * 0.25 / max_connections`
- Override per session for big reports: `SET work_mem = '256MB';`

**maintenance_work_mem**: For maintenance ops.
- Set 1-2GB for fast index creation, VACUUM

**Real-world example**: Setting work_mem=2GB globally caused OOM crashes (100 connections × multiple ops × 2GB > RAM). Lesson: tune globally low, raise per-session for heavy queries.

---

### Q92. MySQL Buffer Pool, Key Cache, Query Cache

**InnoDB Buffer Pool**: Single most important parameter.
- `innodb_buffer_pool_size` = 70-80% of RAM on dedicated DB server
- `innodb_buffer_pool_instances` = 8-16 for large pools (reduces contention)
- Caches data + indexes + adaptive hash + insert buffer

**Key Cache** (MyISAM only):
- Largely obsolete — InnoDB is default since 5.5

**Query Cache** (DEPRECATED, removed in 8.0):
- Cached query results
- Removed because cache invalidation = global mutex → killed concurrency
- Replacement: app-level cache (Redis, Memcached)

**Real-world example**: Migration from MyISAM + 2GB key_buffer to InnoDB + 32GB buffer pool: writes 5x faster, no more table locks. Tuning buffer pool is highest-ROI MySQL change.

---

### Q93. Database Performance & Disk I/O Patterns

**Sequential vs random I/O**:
- HDD: sequential 100MB/s, random ~100 IOPS (5400 RPM)
- SSD: sequential 500MB/s, random ~10K IOPS
- NVMe: sequential 3GB/s, random ~500K IOPS

**Database I/O patterns**:
- WAL/binlog writes = sequential (best on cheap storage)
- Heap/data writes = random (need fast IOPS)
- Index reads = random (depends on cache)
- Full table scans = sequential

**Tuning**:
- Separate WAL and data on different disks (HDD log + SSD data acceptable)
- For SSD: lower random_page_cost, higher effective_io_concurrency
- Monitor IOPS budget on cloud (gp3 has separate IOPS provisioning)

**Real-world example**: An RDS instance hit IOPS limits during peak (gp2 burst exhausted). Switching to gp3 with provisioned IOPS = stable p99 latency.

---

### Q94. CPU/Memory/I/O Bottleneck Diagnosis

**Senior engineer's checklist**:

```bash
# CPU bound: 100% CPU + waiting on CPU
top, htop  # %CPU usage
sar -u 1   # user/system CPU

# Memory bound: swap activity, low cache hit
free -h
vmstat 1  # si/so columns (swap in/out)

# I/O bound: high iowait, disk busy
iostat -x 1  # %util, await columns
iotop        # per-process I/O

# DB-level
SELECT wait_event_type, wait_event, count(*)
FROM pg_stat_activity GROUP BY 1,2;
-- IO: disk bottleneck
-- LWLock: contention
-- Lock: row-level lock waits
```

**Indicators**:
- High CPU + many active queries → query optimization needed
- High iowait + low cache hit → more RAM or better indexes
- Low CPU + queries slow → likely lock contention

**Real-world example**: Diagnosed "slow DB" complaint by running `pg_stat_activity` — 200 queries waiting on a lock held by a hung migration. Killed migration, instant recovery. Without diagnostic skill, would have wasted hours.

---

### Q95. Data Type Performance Implications

**VARCHAR vs CHAR**:
- VARCHAR: variable length, 1-4 byte length prefix
- CHAR: fixed length, padded with spaces
- Use VARCHAR unless data truly fixed-width (e.g., country codes, ISO codes)

**INT vs BIGINT**:
- INT: 4 bytes, ±2B range — sufficient most cases
- BIGINT: 8 bytes, ±9 quintillion
- BIGINT for IDs that may grow (use it for time-series IDs)
- Storage matters in PKs (smaller PK = smaller secondary indexes in InnoDB)

**TIMESTAMP vs TIMESTAMPTZ (PG)**:
- TIMESTAMPTZ stores UTC, converts on display
- Always use TIMESTAMPTZ unless storing wall-clock without TZ context

**TEXT vs VARCHAR (PG)**:
- Identical performance; TEXT has no limit
- Use TEXT unless you genuinely need length limit

**Real-world example**: Switched users.id from BIGINT to INT (no need for >2B users) — secondary indexes shrank 30%, cache hit ratio improved.

---

### Q96. Checkpoint Frequency & Performance

**What**: A checkpoint flushes dirty pages from memory to disk.

**Why frequency matters**:
- Frequent checkpoints → small WAL, fast recovery, but high I/O overhead
- Infrequent checkpoints → I/O bursts, longer recovery

**Tuning (PG)**:
```ini
max_wal_size = 16GB                  # checkpoint when WAL hits this
checkpoint_timeout = 30min            # or after this time
checkpoint_completion_target = 0.9    # spread I/O over 90% of interval
```

**Symptoms of bad tuning**:
- Look for "checkpoints occurring too frequently" in PG logs
- I/O spikes every minute or two

**Real-world example**: Default max_wal_size=1GB caused checkpoints every minute on a write-heavy DB. Increased to 16GB → checkpoints every 5-10 min, p99 latency dropped 40% during checkpoints.

---

### Q97. Tuning for SSD vs HDD

**SSD-specific**:
- `random_page_cost = 1.1` (vs default 4) — encourages index use
- `effective_io_concurrency = 200` — parallel I/O capability
- Higher `shared_buffers` (SSDs have lower seek penalty)
- Use UUIDv7 / time-ordered PKs (less B-tree page churn matters less, but still good)

**HDD-specific**:
- Keep `random_page_cost = 4`
- `effective_io_concurrency = 1` (no real parallelism)
- Separate WAL onto its own spindles
- Sequential scans preferred over many index lookups

**Real-world example**: A team moved from RAID-10 HDD to SSD without retuning. Performance improved 5x but EXPLAIN plans still avoided index scans for medium ranges because cost model assumed random I/O expensive. After setting random_page_cost=1.1, got 10x improvement.

---

### Q98. Foreign Keys — Performance Impact

**What**: FK constraint enforces referential integrity.

**Performance cost**:
- Each INSERT/UPDATE on child table: lookup in parent
- Each DELETE on parent: search children (need index on FK column!)
- Locking implications (FOR KEY SHARE locks)

**Trade-offs**:
| Approach | Pros | Cons |
|---|---|---|
| FK with index on child | Integrity guaranteed | Some write overhead |
| FK without index on child | DELETE on parent scans child table | Catastrophic perf |
| No FK (app enforces) | Faster writes | Data integrity bugs |

**Rule**: ALWAYS index FK columns. PostgreSQL doesn't auto-create them; MySQL does for InnoDB.

**Real-world example**: Microservices teams sometimes drop FKs at service boundaries (each service owns its data). Internal to a service, keep FKs.

```sql
-- Wrong: FK without index
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id)
);
-- DELETE FROM users WHERE id = 5 → full scan of orders!

-- Right
CREATE INDEX ON orders (user_id);
```

---

### Q99. Query Result Caching

**Where to cache**:
1. **App-level (Redis, Memcached)**: Most flexible, programmatic invalidation
2. **CDN/HTTP cache**: For idempotent GET endpoints
3. **DB result cache**: MySQL had query cache (removed); PG doesn't have one
4. **Materialized views (PG)**: Pre-computed query results

**Trade-offs**:
- ✅ Reduces DB load 10-100x
- ❌ Cache invalidation hard (one of two hardest problems in CS)
- ❌ Stale reads
- ❌ Cache stampede during expiry

**Patterns**:
- Read-through cache with TTL
- Write-through cache (cache updated on write)
- Cache-aside (app reads cache, falls back to DB, populates cache)
- Tag-based invalidation

**Real-world example**: An e-commerce caching product details (1M rows) in Redis with 5-min TTL. Cut DB QPS from 5K → 100. Used cache stampede protection (single-flight pattern) to prevent thundering herds on cache miss.

---

### Q100. Optimizing Aggregations on Billions of Rows

**Approaches**:

1. **Pre-aggregation / Materialized views**:
```sql
CREATE MATERIALIZED VIEW daily_sales AS
SELECT date_trunc('day', created_at) AS day, sum(amount) AS total
FROM orders GROUP BY 1;
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales;
```

2. **Incremental aggregation**: Update aggregates on each insert via trigger or stream

3. **Approximate algorithms**: HLL for distinct counts, t-digest for quantiles

4. **Columnar storage**: ClickHouse, BigQuery — 10-100x faster for analytics

5. **Partitioning**: Partition by time, query only relevant partitions

6. **Sampling**: For dashboards, sample 1% and extrapolate

**Real-world example**: A "user lifetime value" query joining 10B events and 100M users took 4 hours. Strategy:
- Pre-aggregate daily LTV per user via incremental Spark job
- Result table: 100M rows
- Query: 5 seconds
- Trade-off: dashboard data is 24h stale

---

## SECTION 8: EDGE CASES & GOTCHAS

### Q101. COUNT(*) vs COUNT(column)

**What**:
- `COUNT(*)` counts ALL rows
- `COUNT(column)` counts rows where column IS NOT NULL
- `COUNT(DISTINCT column)` counts distinct non-NULL values

**Why it matters**: Silent bugs.

**Example**:
```sql
-- Table: 100 users, 30 have no email
SELECT COUNT(*) FROM users;       -- 100
SELECT COUNT(email) FROM users;   -- 70
SELECT COUNT(1) FROM users;       -- 100 (1 is always non-null)
```

**Performance**:
- PG: `COUNT(*)` and `COUNT(1)` are equivalent; both can use index-only scan
- MySQL InnoDB: same; the "COUNT(1) faster than COUNT(*)" myth is from MyISAM era

**Real-world example**: Engineer wrote `SELECT COUNT(email) FROM users` for a metrics dashboard, then wondered why count dropped 30% — it was always wrong; nulls weren't counted. Code review caught it before production.

---

### Q102. Cascading Foreign Keys

**What**: `ON DELETE CASCADE` / `ON UPDATE CASCADE` propagates changes to child rows.

**Why dangerous**:
- One DELETE can trigger millions of cascading deletes
- Long-held locks during cascade
- Hidden chain of side effects

**How to manage**:
```sql
-- Explicit cascade (use sparingly)
CREATE TABLE comments (
  ...
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE
);

-- Safer: ON DELETE RESTRICT (default) + app-level cleanup
-- Or ON DELETE SET NULL for soft-orphaning
```

**Best practices**:
- Avoid cascade for chains > 2 levels deep
- For "delete user and all their data" — handle in application with proper auditing
- Soft delete (set deleted_at) often better

**Real-world example**: A user-deletion request cascaded through 12 tables, taking 45 min and locking auth_tokens table (blocking all logins). Fix: async job that soft-deletes in batches.

---

### Q103. OFFSET Pagination on Large Result Sets

**What**: `SELECT * FROM events ORDER BY id LIMIT 20 OFFSET 1000000` requires DB to fetch and discard 1M rows.

**Why bad**: O(N) cost per page; pages 5000+ are very slow.

**Better — keyset pagination**:
```sql
-- Page 1
SELECT * FROM events ORDER BY id DESC LIMIT 20;
-- Remember last_id = the smallest id from result

-- Page 2
SELECT * FROM events WHERE id < ? ORDER BY id DESC LIMIT 20;
-- Always O(log N) — uses index seek
```

**Trade-offs**:
- ✅ Keyset is O(log N), uniform speed across pages
- ❌ Can't jump to "page 5000" directly
- ❌ Sorting must be by indexed unique field (or compound)

**Real-world example**: An admin panel hung on "go to page 100K of users." Switched to keyset — instant. Side benefit: no "page count" displayed → don't expose total rows.

---

### Q104. "Off By One" Problems

**Common**:
- BETWEEN is INCLUSIVE on both ends — easy to overlap
- Date ranges: `created_at BETWEEN '2024-01-01' AND '2024-01-31'` misses the last day's data!

**Pitfall**:
```sql
-- Wrong: misses data on Jan 31 after midnight
WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31'

-- Right: half-open range
WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01'
```

**Real-world example**: A monthly revenue report ran "BETWEEN first and last day of month" — missed transactions occurring on last day after midnight. Customers complained, root cause took weeks to find.

---

### Q105. DISTINCT Hiding Bugs

**What**: DISTINCT often used as bandaid for duplicate rows from incorrect joins.

**Why bad**:
- Hides the real bug (improper join)
- Expensive sort
- May hide data inconsistency

**Example**:
```sql
-- "Why am I getting duplicate users?"
SELECT DISTINCT u.* FROM users u
JOIN user_roles ur ON ur.user_id = u.id;
-- DISTINCT papers over: a user has multiple roles → duplicate rows
-- The "fix" hides that you actually want EXISTS or a GROUP BY
```

**Better**:
```sql
SELECT u.* FROM users u
WHERE EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id);
```

**Real-world example**: A finance dashboard used `DISTINCT` to deduplicate orders. Turned out it was masking a missing WHERE clause. Fixing that revealed the report was double-counting revenue for the past 6 months.

---

### Q106. UNIQUE Constraint with Nullable Columns

**What**: NULL is "unknown" in SQL — NULLs are NOT considered equal in unique constraints (by default).

**Behavior**:
```sql
CREATE TABLE t (email TEXT UNIQUE);
INSERT INTO t VALUES (NULL);  -- OK
INSERT INTO t VALUES (NULL);  -- OK (in PG, MySQL — NULL ≠ NULL)
INSERT INTO t VALUES ('a');   -- OK
INSERT INTO t VALUES ('a');   -- ERROR
```

**Pitfall**: Soft-delete pattern often breaks unique constraints:
```sql
-- Want unique email among active users
CREATE TABLE users (email TEXT, deleted_at TIMESTAMP);
-- "Active user A deleted → can same email re-register?"
-- With UNIQUE(email): no
-- With UNIQUE(email) NULLS NOT DISTINCT (PG 15+): different behavior
```

**Solution — partial unique index (PG)**:
```sql
CREATE UNIQUE INDEX ON users (email) WHERE deleted_at IS NULL;
```

**Real-world example**: SaaS allowed users to "delete account" but emails stayed unique. Re-registration failed. Fix: partial unique index — emails unique only among active users.

---

### Q107. IN vs EXISTS

**What**:
- `IN`: row's column matches any value in a set/subquery
- `EXISTS`: at least one row exists in subquery

**When each wins**:
| Case | Use |
|------|-----|
| Subquery returns NULLs | EXISTS (IN with NULL is tricky) |
| Subquery is small literal list | IN |
| Subquery is large | EXISTS (often) |
| Need correlation to outer | EXISTS |
| `NOT IN` with possible NULLs | NEVER — use NOT EXISTS |

**The NULL gotcha**:
```sql
-- BUG: if any row in subquery has NULL user_id, the entire NOT IN returns 0 rows!
SELECT * FROM orders WHERE user_id NOT IN (SELECT user_id FROM banned_users);

-- Safe
SELECT * FROM orders o WHERE NOT EXISTS (
  SELECT 1 FROM banned_users b WHERE b.user_id = o.user_id
);
```

**Real-world example**: A "send marketing email" job suddenly stopped sending to anyone. Root cause: `WHERE user_id NOT IN (subq)` and a single NULL appeared in subq. Cost 2 days of revenue. Always use NOT EXISTS.

---

### Q108. The Halloween Problem

**What**: A query updates rows that then get re-matched by its own WHERE clause, creating infinite/incorrect updates.

**Example** (1976 case at IBM):
```sql
-- Give everyone earning < $25K a $5K raise
UPDATE employees SET salary = salary + 5000 WHERE salary < 25000;
-- Naive execution: scan via index on salary
-- After update, row at $24K becomes $29K
-- If using index scan, employee at $24K may appear AGAIN at $29K → another raise!
```

**How DBs prevent it**: Modern DBs materialize the row set before updating (halloween protection).

**Pitfall**: Doesn't apply much in modern PG/MySQL, but cursor-based updates in code can recreate it.

**Real-world example**: Mostly historical, but useful to know — explains why some updates with self-referencing subqueries materialize aggressively (and use more memory).

---

## SECTION 9: POSTGRESQL-SPECIFIC

### Q109. TOAST (The Oversized-Attribute Storage Technique)

**What**: Mechanism for storing large field values out-of-line.

**Why**: PG page is 8KB; row must fit in a page. Large TEXT/BYTEA values stored separately.

**How it works**:
- Values >2KB by default trigger TOASTing
- Compressed first (PGLZ or LZ4)
- If still large, sliced into chunks, stored in TOAST table
- Original row stores a pointer

**Performance implications**:
- TOASTed values cost extra I/O (separate table read)
- Updates to TOAST fields are expensive
- TOAST tables have their own bloat profile

**Tuning**:
```sql
ALTER TABLE documents ALTER COLUMN content SET STORAGE EXTERNAL;
-- Storage options:
-- PLAIN: never compress/TOAST (small fixed)
-- EXTENDED: compress + TOAST as needed (default for variable)
-- EXTERNAL: TOAST but no compression
-- MAIN: try to keep inline, compress if needed
```

**Real-world example**: A documents table had a 100MB-per-row HTML content column. Queries scanning metadata (no content needed) were slow because TOAST pointers fragmented heap. Moved content to separate table — metadata queries 20x faster.

---

### Q110. PostgreSQL Extensions

**What**: Loadable modules adding functionality.

**Critical extensions**:
| Extension | Purpose |
|-----------|---------|
| `pg_stat_statements` | Query performance tracking |
| `pgvector` | Vector similarity (for AI/embeddings) |
| `pg_trgm` | Trigram fuzzy matching |
| `postgis` | Geospatial |
| `uuid-ossp` | UUID generation |
| `hstore` | Key-value store |
| `pgcrypto` | Encryption functions |
| `tablefunc` | Crosstab, etc. |
| `pgstattuple` | Bloat analysis |
| `pg_repack` | Online table rebuild |
| `timescaledb` | Time-series (3rd party) |

**How**:
```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- Some need shared_preload_libraries in postgresql.conf + restart
```

**Real-world example**: pg_stat_statements alone saved more debugging time than any other tool. ALWAYS enable on production from day one.

---

### Q111. DELETE vs TRUNCATE (PG)

**What**:
- DELETE: row-by-row removal, generates dead tuples, can be filtered
- TRUNCATE: file-level deletion, instant, all-or-nothing

**Differences**:
| | DELETE | TRUNCATE |
|---|---|---|
| Speed | O(N) | O(1) |
| WAL | Logs each row | Logs the truncate |
| Triggers | Fires per row | Fires once (or not) |
| Sequence reset | No | Optional (`RESTART IDENTITY`) |
| Cascades | Per row | Per table (`CASCADE`) |
| Bloat | Yes | No |
| Inside transaction | Fully | Yes (PG; not MySQL!) |
| FK enforcement | Always | Can be deferred |

**Real-world example**: Deleting 100M rows from a logs table: DELETE took 4 hours and left 100M dead tuples; TRUNCATE took 100ms with zero bloat. Use TRUNCATE for "delete all" or "delete entire partition."

---

### Q112. Tablespaces (PG)

**What**: Named locations on the filesystem where DB objects are stored.

**Why use**:
- Move hot tables to faster storage (NVMe)
- Move cold tables to cheaper storage
- Distribute I/O across multiple disks

**How**:
```sql
CREATE TABLESPACE fast_ssd LOCATION '/mnt/nvme/pgdata';
CREATE TABLE hot_data (...) TABLESPACE fast_ssd;
-- Or move existing
ALTER TABLE orders SET TABLESPACE fast_ssd;
```

**Caveats**:
- Backups must include tablespace paths
- Replication requires same paths on replicas (or symlinks)

**Real-world example**: A team put indexes on local NVMe and heap on cheaper EBS. Read latency on hot index dropped 70%. Operational complexity higher.

---

### Q113. Window Functions

**What**: Functions that operate over a "window" of rows related to current row, without grouping.

**Why use**: Aggregates without losing row detail.

**Examples**:
```sql
-- Running total
SELECT
  order_id, amount,
  SUM(amount) OVER (ORDER BY created_at) AS running_total
FROM orders;

-- Rank within partition
SELECT
  user_id, order_id, amount,
  RANK() OVER (PARTITION BY user_id ORDER BY amount DESC) AS user_order_rank
FROM orders;

-- Compare to previous row
SELECT
  date, revenue,
  revenue - LAG(revenue) OVER (ORDER BY date) AS daily_change
FROM daily_revenue;
```

**Real-world example**: Computed "top 3 products per category" — without window functions, requires self-join or correlated subquery. With `ROW_NUMBER() OVER (PARTITION BY category ORDER BY sales DESC)`, single-pass solution; 100x faster.

---

### Q114. CTEs (Common Table Expressions)

**What**: Named subquery in WITH clause.

**Why use**:
- Readability (break complex query into named steps)
- Recursion (hierarchical data, graph traversal)
- Avoid repeating the same subquery

**Pitfall (pre-PG 12)**: CTEs were optimization fences — DB couldn't push predicates into them. Now `MATERIALIZED` / `NOT MATERIALIZED` keywords control this.

**Examples**:
```sql
-- Readable refactor
WITH active_users AS (
  SELECT id FROM users WHERE deleted_at IS NULL
),
recent_orders AS (
  SELECT * FROM orders WHERE created_at > now() - interval '7 days'
)
SELECT * FROM active_users a JOIN recent_orders o ON o.user_id = a.id;

-- Recursive: org hierarchy
WITH RECURSIVE org AS (
  SELECT id, name, manager_id, 1 AS level FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, e.manager_id, o.level + 1
  FROM employees e JOIN org o ON e.manager_id = o.id
)
SELECT * FROM org;
```

**Real-world example**: Migrated 100-line subquery monolith to CTE form — same performance, half the LOC, junior engineers could finally maintain it.

---

### Q115. Transaction ID & XID Wraparound

**What**: Every TX gets a 32-bit XID. After ~2B TXs, IDs would wrap and ancient tuples appear "in the future."

**Why critical**: If unhandled, PG forcibly shuts down to prevent corruption.

**How VACUUM prevents**: Freezes old tuples (marks them as visible to all future TXs), allowing XID reuse.

**Detection**:
```sql
SELECT
  datname,
  age(datfrozenxid) AS age,
  2000000000 - age(datfrozenxid) AS xids_until_disaster
FROM pg_database
ORDER BY age DESC;
```

**Symptoms of trouble**:
- Logs: "must be vacuumed within X transactions"
- Autovacuum doing "antiwraparound" vacuum (high priority, can't be interrupted)

**Real-world example**: Sentry's famous 2015 incident — their PG hit wraparound, was offline for hours. Standard alert: page when `age > 1B`.

---

### Q116. pg_stat_statements

**What**: Tracks aggregate stats per normalized query.

**How**:
```sql
CREATE EXTENSION pg_stat_statements;

-- Top time consumers
SELECT
  queryid, substring(query, 1, 80) AS q,
  calls,
  round(total_exec_time::numeric, 0) AS total_ms,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  round((100*total_exec_time / sum(total_exec_time) OVER ())::numeric, 1) AS pct
FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 20;
```

**Common patterns to find**:
- Hidden N+1 (millions of calls of same template)
- Slow tail queries (mean_exec_time high)
- High variance queries (max vs mean)

**Real-world example**: pg_stat_statements revealed a "harmless" query running 100K times/hour averaging 50ms. Total = 5000s/hour = a full CPU. Added index — query down to 1ms. Reclaimed 99% of CPU on that query.

---

### Q117. Native JSON Support (PG)

**What**: `JSON` (text storage) vs `JSONB` (binary).

**Use JSONB always** — faster queries, indexable, compressed.

**Operators**:
```sql
SELECT data->>'name'         -- extract as text
SELECT data->'address'->>'city'  -- nested
WHERE data @> '{"active": true}'  -- containment

-- Indexes
CREATE INDEX ON users USING GIN (data);  -- index all keys
CREATE INDEX ON users ((data->>'email'));  -- specific field
```

**When to use**:
- Schema-flexible attributes (custom fields per tenant)
- Semi-structured data (logs, events)
- Avoid for primary entities — design proper columns

**Pitfalls**:
- TOASTed if large → slow to update
- No FK constraints
- Statistics on JSONB fields are limited

**Real-world example**: A CRM had 200+ "custom fields" per customer. Storing as JSONB instead of EAV (entity-attribute-value) tables: simpler, faster, GIN-indexed for search.

---

### Q118. Prepared Statements

**What**: Pre-parsed, pre-planned query templates.

**Why**:
1. Prevent SQL injection (parameters are not concatenated)
2. Plan caching (reuse plan across executions)
3. Better performance for repeated queries

**How**:
```sql
PREPARE find_user(BIGINT) AS SELECT * FROM users WHERE id = $1;
EXECUTE find_user(42);
```

**Most apps use prepared via driver**:
```python
# psycopg2 — automatic prepared statements
cursor.execute("SELECT * FROM users WHERE id = %s", (42,))
```

**Caveats**:
- Generic plan vs custom plan: PG tries first 5 executions custom, then generic if cost similar
- For parameterized queries where data is skewed (some params have very different selectivity), generic plan may be poor — use `plan_cache_mode = force_custom_plan`

**Real-world example**: A user search query was fast for some IDs (selective), slow for others. Cause: cached generic plan was avg of both. Forced custom plan per execution → consistent performance.

---

## SECTION 10: MYSQL-SPECIFIC

### Q119. InnoDB vs MyISAM

**What**:
- **InnoDB**: ACID, row-level locking, MVCC, FK support. Default since 5.5.
- **MyISAM**: No ACID, table-level locking, no FKs. Legacy.

**Why never use MyISAM today**:
- Crash unsafe
- Table locks → no concurrent writes
- No transaction support
- No FK enforcement

**The only remaining MyISAM excuse**: Read-only data with COUNT(*) optimization — and even that's better in InnoDB 8.0 with parallel scan.

**Real-world example**: A team in 2020 still ran on MyISAM. Every crash = hours of repair. Migration to InnoDB resolved all "crash recovery" tickets.

---

### Q120. Why MySQL Query Cache Was Removed

**What** (pre-8.0): Cache of query → result mapping.

**Why removed**:
1. **Global mutex** for invalidation — killed concurrency at scale
2. Any write to a cached table invalidated all its cache entries
3. Helped only specific workloads (read-heavy, slow-changing)
4. Better solved at app layer (Redis)

**Replacement**: Application-level caching, materialized views (not native in MySQL — use triggers or app), or move to PostgreSQL with materialized views.

**Real-world example**: Many teams' "query cache hit ratio" plummeted to 10% on write-heavy workloads — was actively hurting performance. Removed in 8.0.

---

### Q121. InnoDB Redo & Undo Logs

**What**:
- **Redo log** (`ib_logfile*`): Write-ahead log for crash recovery (like PG's WAL)
- **Undo log**: Stores old versions of rows for MVCC + rollback

**How they cooperate**:
- COMMIT: write to redo, return success
- Background: flush dirty pages to disk
- Crash: replay redo from last checkpoint
- Rollback: apply undo
- Read in MVCC: read row, then use undo to find correct version for snapshot

**Tuning**:
```ini
innodb_log_file_size = 2G        # bigger = less frequent flushes, slower recovery
innodb_log_files_in_group = 2     # typically 2
innodb_flush_log_at_trx_commit = 1  # 1=safe, 2=fast (1s data loss risk)
innodb_undo_log_truncate = ON     # let undo shrink
```

**Real-world example**: A 100MB redo log on a write-heavy workload caused constant flushing → I/O spikes. Increased to 4GB → 80% reduction in I/O overhead.

---

### Q122. InnoDB Change Buffer

**What**: Buffer for changes to secondary index pages not in buffer pool.

**Why**: Avoids reading secondary index pages on every write — defers and batches.

**When it helps**:
- Tables larger than buffer pool
- Many secondary indexes
- Random-ish inserts/updates

**Tuning**:
```ini
innodb_change_buffering = all      # changes for all types
innodb_change_buffer_max_size = 25 # % of buffer pool
```

**Real-world example**: A 500GB table with 10 secondary indexes on a 64GB buffer pool. Change buffer absorbed updates without thrashing — 50% reduction in random I/O.

---

### Q123. Doublewrite Buffer

**What**: InnoDB writes pages first to a "doublewrite buffer" then to actual location.

**Why**: Protects against torn writes (partial page writes during power loss).

**Cost**: 2x write amplification, but sequential write so cheaper than expected.

**Tuning**:
```ini
innodb_doublewrite = ON  # default; turn off only with atomic-write storage
```

**Real-world example**: On NVMe with atomic write support, disabling doublewrite saved 20% on writes. Most storage doesn't support atomic page writes — leave enabled.

---

### Q124. Adaptive Hash Indexing (AHI)

**What**: InnoDB auto-creates in-memory hash indexes for frequently accessed B-tree paths.

**Why**: Hash lookups are O(1) vs B-tree O(log n).

**When it helps**: Hot equality lookups; doesn't help range scans.

**Pitfall**:
- Contention on the AHI mutex at very high concurrency
- Some workloads benefit from disabling: `innodb_adaptive_hash_index = OFF`

**Real-world example**: A workload spiked at 50K QPS — AHI mutex became a bottleneck. Disabling AHI: QPS went to 80K. Counterintuitive but real at high scale.

---

### Q125. NATURAL JOIN vs Explicit JOIN

**NATURAL JOIN**: Joins on all columns with same name. Implicit, fragile.

**Why avoid**:
- Schema change (add a column with matching name to both tables) silently breaks queries
- Hard to read — what columns is it joining on?
- Standard not consistent across DBs

**Always use explicit**:
```sql
-- Bad
SELECT * FROM orders NATURAL JOIN customers;

-- Good
SELECT * FROM orders o INNER JOIN customers c ON o.customer_id = c.id;
```

**Real-world example**: NATURAL JOIN production query worked for a year. Someone added an `audit_id` column to both tables — query started returning 0 rows because the new column didn't match. Painful debugging.

---

### Q126. Generated Columns

**What**: Columns whose value is derived from other columns.

**Types**:
- **VIRTUAL**: Computed on read (no storage)
- **STORED**: Computed on write (takes space, can be indexed)

**Why use**:
- Index on expression (without functional index)
- Computed columns visible to ORMs
- Type-converted views of a column

**Example**:
```sql
CREATE TABLE users (
  email TEXT,
  email_lower TEXT GENERATED ALWAYS AS (LOWER(email)) STORED
);
CREATE INDEX ON users (email_lower);
```

**Limitations**:
- Can't reference other tables
- Can't use non-deterministic functions (NOW(), RAND())
- VIRTUAL can't have UNIQUE constraint in some cases

**Real-world example**: Stored full_name = first_name || ' ' || last_name for searching — better than functional index because ORMs see it as a real column.

---

### Q127. Binlog Role in Replication & Recovery

**What**: Binary log of all data changes.

**Roles**:
1. **Replication**: Replicas read binlog from primary
2. **Recovery**: Point-in-time recovery after backup
3. **CDC**: Tools like Debezium consume binlog → Kafka → downstream

**Configuration**:
```ini
log_bin = mysql-bin
binlog_format = ROW             # safest
binlog_expire_logs_seconds = 604800  # 7 days
sync_binlog = 1                 # fsync after each TX (durable)
```

**Real-world example**: A team had `sync_binlog = 0` for performance. Crash lost 5 min of binlog. Replica diverged. Lesson: 1 is the safe value; modern fsync is fast enough for OLTP.

---

### Q128. MySQL Optimizer Hints

**What**: Per-query instructions to optimizer.

**Why use (sparingly)**: Override optimizer when you know better.

**Examples**:
```sql
-- Force index
SELECT /*+ INDEX(orders idx_user_id) */ * FROM orders WHERE user_id = 5;

-- Force join order
SELECT /*+ JOIN_ORDER(t1, t2) */ * FROM t1 JOIN t2 ON ...;

-- Set max execution time
SELECT /*+ MAX_EXECUTION_TIME(1000) */ * FROM big_table;

-- Read from replica
SELECT /*+ SET_VAR(read_only=ON) */ ...;
```

**Pitfalls**:
- Hints become wrong as data grows
- Maintenance burden
- Better fix: improve stats, indexes, rewrite query

**Real-world example**: A team relied on FORCE INDEX everywhere. After major data growth, hints picked wrong indexes — queries 10x slower than letting optimizer decide. Removed hints, ran ANALYZE — better.

---

## SECTION 11: DATA TYPES & STORAGE

### Q129. VARCHAR(max) Implications

**What**: Choosing too-large VARCHAR has surprising implications.

**Pitfalls**:
1. **Memory allocation for sorts**: Some DBs allocate based on declared length (MySQL with utf8mb4 = 4 bytes/char × length)
2. **Max key length**: Indexes on VARCHAR(255) with utf8mb4 = 1020 bytes — close to InnoDB 3072 byte limit
3. **Replication payload size**: Wider columns = bigger binlog rows

**Recommendation**:
- VARCHAR(50) for emails (RFC says 254, but practical is < 50)
- VARCHAR(255) for short text — common idiom
- TEXT for unbounded
- Don't go VARCHAR(MAX) — be intentional

**Real-world example**: A team used VARCHAR(8000) for "notes" everywhere. Sort operations allocated huge buffers. Switching to TEXT (which uses TOAST/external storage) freed 60% of work_mem usage.

---

### Q130. DATE vs DATETIME vs TIMESTAMP

**MySQL**:
- DATE: just date, 3 bytes
- DATETIME: date+time, 8 bytes, no TZ
- TIMESTAMP: date+time, 4 bytes (until 2038!), converts to UTC

**PostgreSQL**:
- DATE
- TIME (rarely used alone)
- TIMESTAMP (without TZ — assumes server local)
- TIMESTAMPTZ (with TZ, stored as UTC, displayed in session TZ)

**Rule for PG**: Always TIMESTAMPTZ for events. Never TIMESTAMP without TZ for moments in time.

**Real-world example**: A global app used MySQL TIMESTAMP. Hit 2038 problem timing during testing. Migrated to BIGINT (epoch ms) — also avoids TZ ambiguity.

---

### Q131. DECIMAL vs FLOAT/DOUBLE

**Use DECIMAL for**:
- Money
- Anywhere precision matters

**Use FLOAT/DOUBLE for**:
- Scientific data
- Approximations where speed matters
- Aggregates

**Why DECIMAL for money**:
```sql
-- FLOAT errors compound
SELECT 0.1 + 0.2;  -- 0.30000000000000004

-- DECIMAL is exact
SELECT 0.1::DECIMAL(10,2) + 0.2::DECIMAL(10,2);  -- 0.30
```

**Real-world example**: An e-commerce shipping system used FLOAT for prices. Total order rounding errors compounded into $0.01 discrepancies. Audit caught it; cost = months of dev time to migrate to DECIMAL.

---

### Q132. ENUM Trade-offs

**What**: Column type with predefined values.

**Pros**:
- Self-documenting
- Smaller storage than VARCHAR
- Validation built-in

**Cons**:
- Schema change required to add values (ALTER TABLE in MySQL; ALTER TYPE in PG)
- Ordering can be confusing
- Hard to migrate between DBs
- ORMs don't always handle well

**Alternative**: Lookup table with FK + CHECK constraint.

**Real-world example**: A team used ENUM('pending','active','cancelled','refunded'). When business added 'refunded_partial', migration locked the table for 30 min. Switched to TEXT + CHECK constraint — flexible.

```sql
-- Better
status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'cancelled', 'refunded'))
```

---

### Q133. JSON Performance Considerations

**Pros**:
- Schema flexibility
- Reduces schema migrations
- GIN-indexable (PG)

**Cons**:
- Slower than typed columns
- Full row rewrite on update (no in-place)
- TOASTed values are expensive to update
- No proper constraints / FKs
- Statistics limited

**When to use**:
- Truly variable/tenant-specific fields
- Logs/events with unpredictable schema
- Configurations

**When NOT to use**:
- Primary entities
- Foreign key targets
- Frequently filtered/joined columns

**Real-world example**: A team stored everything as JSON "for flexibility." When usage patterns stabilized, top 20 fields were promoted to columns. Queries 50x faster, validation via constraints.

---

### Q134. TEXT vs VARCHAR Storage

**PostgreSQL**: TEXT and VARCHAR are equivalent in storage (no length difference in performance). TEXT preferred unless you need length validation.

**MySQL**:
- VARCHAR stored inline up to row limit
- TEXT stored externally (off-page) when row size exceeds 8KB
- TEXT can't have full-length index (only prefix)

**Real-world example**: MySQL team kept hitting "row size too large" errors as they added VARCHAR columns. Switching some to TEXT moved them off-page, fixed the issue.

---

### Q135. UUID vs Auto-Incrementing INT as PK

**Comparison**:
| | UUID | BIGINT/INT auto-inc |
|---|---|---|
| Size | 16 bytes | 4-8 bytes |
| Generation | Anywhere (client, DB) | DB-only |
| Random ordering | Yes (v4) — bad for InnoDB | No — clustered insert |
| Multi-region merge | Easy (no collisions) | Hard (need ranges) |
| Predictability | Unpredictable (good for security) | Sequential (bad for security) |
| Index bloat | High with v4 | Low |

**Best of both — UUIDv7 (2024+)**: Time-ordered UUIDs — clustered-insert friendly + globally unique.

**Real-world example**: A team used UUID v4 PKs in InnoDB. Write throughput hit a wall — random PK = page splits everywhere. Migrated to UUIDv7 (or ULID) — same uniqueness benefits, monotonic insertions, write throughput 3x.

```sql
-- PostgreSQL 18+ supports UUIDv7
INSERT INTO orders (id) VALUES (uuidv7());
```

---

### Q136. Nullable vs Non-Nullable Storage

**MySQL**:
- Each nullable column adds 1 bit to a null bitmap
- Saving 1 byte per null can matter on billions of rows

**PostgreSQL**:
- Null bitmap only created if at least one NULL exists in row
- Adds 1 byte per 8 columns approximately
- NULLs themselves take 0 bytes (don't store the value)

**Practical**: Use NOT NULL where the data dictates. Stricter schemas catch bugs.

**Real-world example**: Made a "should be required" column NOT NULL → caught 1000 corrupt rows in app code that were silently inserting NULLs. The constraint exposed an entire class of bugs.

---

### Q137. SIGNED vs UNSIGNED Integers

**What** (MySQL):
- SIGNED INT: -2.1B to +2.1B
- UNSIGNED INT: 0 to 4.2B

**PostgreSQL**: No unsigned types — use BIGINT or CHECK constraint.

**Why UNSIGNED matters**:
- 2x range for same storage when negatives don't apply (counters, IDs)
- Catches "negative" bugs at DB level

**Pitfalls**:
- Mixed SIGNED/UNSIGNED arithmetic gives surprising results
- Most app frameworks default to SIGNED

**Real-world example**: A "user count" column overflowed past 2.1B. Quick fix: ALTER to UNSIGNED INT — bought 2x time before BIGINT migration.

---

### Q138. Bit Flags Efficiently

**Options**:

1. **BIT or SMALLINT bitmap**:
```sql
-- features bit field: 1=premium, 2=verified, 4=admin
WHERE features & 1 = 1  -- has premium
```
Pros: compact. Cons: not indexable, hard to read.

2. **Separate boolean columns**:
```sql
is_premium BOOLEAN, is_verified BOOLEAN, is_admin BOOLEAN
```
Pros: readable, indexable, individually update-able. Cons: schema migration for new flags.

3. **JSON / Array**:
```sql
features JSONB DEFAULT '{}'::jsonb
```
Pros: flexible. Cons: slower queries.

**Recommendation**: Separate booleans unless you genuinely have 30+ flags.

**Real-world example**: An auth system stored permissions as bitmask INT. Adding a 32nd permission overflowed. Migrated to roles table — slower per query but no overflow.

---

## SECTION 12: SECURITY

### Q139. SQL Injection & Parameterized Queries

**What**: Untrusted input concatenated into SQL → attacker controls query.

**Classic example**:
```python
# DANGER
query = f"SELECT * FROM users WHERE id = {user_input}"
# user_input = "1 OR 1=1" → returns all users
# user_input = "1; DROP TABLE users; --" → catastrophic
```

**Fix — parameterized queries**:
```python
# Safe — DB receives query template + parameter separately
cursor.execute("SELECT * FROM users WHERE id = %s", (user_input,))
```

**Why parameterization works**: The DB parses query structure first, then binds parameters as VALUES — never as code.

**Pitfalls**:
- String interpolation in ORMs (still possible if used wrongly)
- Dynamic column/table names — can't parameterize, must whitelist

**Real-world example**: A 2020 breach at a major retailer traced to one missed parameterization in legacy code. SQLi remains in OWASP Top 10. Treat ALL user input as toxic.

---

### Q140. Principle of Least Privilege

**What**: Grant each role exactly the permissions it needs — no more.

**How**:
```sql
-- Application reader role
CREATE ROLE app_reader;
GRANT CONNECT ON DATABASE mydb TO app_reader;
GRANT USAGE ON SCHEMA public TO app_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_reader;
-- Application writer role: also INSERT/UPDATE/DELETE

-- App connects as app_writer; never as superuser
```

**Per-table grants** for sensitive tables:
- Salaries: only HR app
- PII: only specific service

**Real-world example**: An SQL injection bug let attackers run `SELECT pg_read_file('/etc/passwd')`. Cause: app connected as superuser. With least privilege, the SQLi exposure is bounded to that role's data.

---

### Q141. Encryption At Rest vs In Transit

**At rest**:
- Disk encryption (LUKS, AWS EBS encryption, gp3 transparent encryption)
- Per-DB: PostgreSQL has pg_crypto for column-level; MySQL has Transparent Data Encryption (TDE)
- Backup encryption (KMS-encrypted S3)

**In transit**:
- TLS for DB connections (`sslmode=require` in PG; `--ssl` in MySQL)
- Replication encryption (set `ssl=on` on standby connections)

**Why both**:
- At rest: stolen disk/backup
- In transit: man-in-the-middle on network

**Real-world example**: An RDS backup was leaked from a misconfigured S3 bucket. Because it was KMS-encrypted, attackers got useless ciphertext. Defense in depth saved the company.

---

### Q142. Row-Level Security (RLS, PostgreSQL)

**What**: Database-enforced rules deciding which rows a session sees.

**Why**:
- Multi-tenant safety — even if app has bug, DB enforces tenant isolation
- Compliance (HIPAA, GDPR)

**How**:
```sql
CREATE TABLE orders (id BIGINT, tenant_id BIGINT, ...);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON orders
USING (tenant_id = current_setting('app.tenant_id')::bigint);

-- App sets tenant per session
SET app.tenant_id = '42';
SELECT * FROM orders;  -- only tenant 42's rows
```

**Trade-offs**:
- ✅ Defense in depth
- ❌ Some performance cost
- ❌ Complicates testing
- ❌ Indexes might not help if policy isn't sargable

**Real-world example**: A multi-tenant SaaS had a bug where app forgot WHERE tenant_id=X for one endpoint, leaking customer data. Adding RLS would have prevented this entirely. Big lesson — RLS as belt-and-suspenders.

---

### Q143. Insecure Default Configurations

**Default risks**:
- Postgres: superuser `postgres` accessible from localhost without password
- MySQL: pre-8.0 had empty root password by default
- Both: `trust` auth in pg_hba.conf allows any local user

**Senior engineer baseline hardening**:
1. Strong passwords (or, better, certificate auth, IAM)
2. `pg_hba.conf` uses `scram-sha-256` (PG) — never `trust` or `md5`
3. Listen only on required interfaces — bind to private subnet
4. Disable unused features (`fsync = off` only in test envs!)
5. Apply security patches promptly
6. Audit logs (pgaudit, MySQL audit plugin)

**Real-world example**: Shodan scans regularly find tens of thousands of internet-exposed Postgres/MySQL instances. Many use default passwords. Always assume the network is hostile.

---

## SECTION 13: PRACTICAL SCENARIOS

### Q144. 2-Second Query → 200ms Optimization

**Senior engineer's playbook**:

1. **Measure**: `EXPLAIN (ANALYZE, BUFFERS)` — find the real bottleneck
2. **Identify slow node**:
   - Seq scan on big table? → Index
   - Estimated vs actual rows off? → ANALYZE / stats
   - Sort method "external"? → Increase work_mem
   - Nested loop with large outer? → Force hash join or fix join order
   - Many Heap Fetches? → Add covering index INCLUDE
3. **Common wins**:
   - Add missing index (90% of cases)
   - Rewrite to avoid function in WHERE
   - Reduce columns returned
   - Push filters earlier (CTE materialization, subquery rewrites)
4. **Verify**: Re-run EXPLAIN ANALYZE; ensure plan changed
5. **Test at scale**: Dev data ≠ prod

**Real-world example**: A "user dashboard" query took 2s. EXPLAIN showed a seq scan on a 50M-row events table. Added `(user_id, created_at DESC)` index → 50ms. Total time: 30 minutes including testing.

---

### Q145. Redesigning a 500GB Table

**Diagnose first**:
1. Profile access patterns: which queries, which columns, how stale data can be
2. Check bloat: real data size vs stored size
3. Identify hot vs cold data (often: last 90 days = 99% of reads)

**Strategies**:

1. **Partition by time** (most common win):
```sql
CREATE TABLE events (
  id BIGINT,
  created_at TIMESTAMP,
  ...
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2024_01 PARTITION OF events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```
- DROP old partitions instead of DELETE (instant, no bloat)
- Each partition smaller → faster queries with partition pruning

2. **Vertical split**: Hot columns vs cold blobs to separate tables

3. **Archive cold data**: Move to S3/cheaper storage, keep last N months in DB

4. **Compression**: TimescaleDB compression, PG 14+ column compression LZ4

**Real-world example**: A logs table at 800GB partitioned by day. Query times for "last 7 days" dropped 95% (partition pruning). Old partitions dropped weekly — instant 7GB freed each time.

---

### Q146. Replication Lag Spike — Diagnostic Steps

**Step 1: Confirm magnitude**
```sql
SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()));
```

**Step 2: Identify cause** — usually one of:
1. **Big transaction on primary** (DDL, big UPDATE)
   - Check: `SELECT * FROM pg_stat_activity WHERE xact_start IS NOT NULL ORDER BY xact_start;`
2. **Long query on replica blocking apply**
   - Check: `SELECT * FROM pg_stat_activity ON REPLICA WHERE state = 'active';`
3. **Network bottleneck**
   - Check: `pg_stat_replication.sent_lsn vs flush_lsn`
4. **Disk I/O on replica**
   - Check: iostat, dirty buffer ratio
5. **Single-threaded WAL apply**
   - Inherent to PG; mitigate by smaller transactions

**Step 3: Mitigate**
- Kill the offending query/transaction
- Throttle the source operation
- For systemic: tune `max_wal_senders`, parallel apply (MySQL)

**Real-world example**: Replica lag jumped to 45 min Sunday 2 AM. Cause: a weekly `REINDEX` job on primary. Switched to `REINDEX CONCURRENTLY` — incremental, no replica blocking.

---

### Q147. Adding NOT NULL Column to 100M-Row Table

**Bad approach**:
```sql
-- LOCKS table for HOURS
ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
```

**Senior approach** (PG 11+, instant default):
```sql
-- Step 1: Add nullable column with default (instant in PG 11+)
ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending';

-- Step 2: Backfill in batches (no locking)
UPDATE orders SET status = 'pending' WHERE status IS NULL AND id BETWEEN 1 AND 10000;
-- ...repeat in batches

-- Step 3: Add NOT NULL (PG 12+ skips full scan if constraint exists)
ALTER TABLE orders ADD CONSTRAINT status_not_null CHECK (status IS NOT NULL) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT status_not_null;  -- non-blocking
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;
ALTER TABLE orders DROP CONSTRAINT status_not_null;
```

**For MySQL**: Use `pt-online-schema-change` or `gh-ost`.

**Real-world example**: GitHub used gh-ost to add columns to billions-row tables without downtime. Open source — use these tools, don't reinvent.

---

### Q148. Cross-Database Migrations

**Approach depends on size & downtime tolerance**:

**Small (< 50GB), can have downtime**:
- pg_dump/mysqldump + restore

**Large + minimal downtime**:
1. Continuous replication (logical or via CDC tool like Debezium)
2. Initial snapshot copy
3. Replicate ongoing changes
4. Cutover during low-traffic window

**Cross-engine (PG ↔ MySQL)**:
- AWS DMS, Debezium + Kafka, custom ETL
- Watch for type mismatches (PG arrays, ENUMs, etc.)

**Real-world example**: Migrated 2TB MySQL → PG with Debezium streaming changes for 2 weeks while we validated. Cutover: 30 seconds (DNS flip). Zero data loss.

---

### Q149. 10B Row Aggregation in 30 Minutes → Optimize

**Strategies**:

1. **Pre-aggregate**: Daily rollups via scheduled job
2. **Materialized view** + incremental refresh
3. **Move to columnar warehouse** (ClickHouse, BigQuery)
4. **Partition + parallel scan** (PG 11+ parallel aggregation)
5. **Approximate methods** (HLL, t-digest)
6. **Sampling** for dashboards

**Decision tree**:
- Real-time? → Streaming aggregation (Kafka Streams, Flink)
- Daily? → Batch ETL + materialized view
- Ad-hoc analytics? → Columnar DB

**Real-world example**: A "monthly revenue per region" query went from 4 hours on PG to 2 seconds on ClickHouse with same 10B rows. Lesson: right tool for the job — don't fight OLTP DBs into OLAP workloads.

---

### Q150. Real-Time Analytics Without OLTP Impact

**Architecture**:
```
[OLTP DB] → [CDC: Debezium] → [Kafka] → [Analytics DB: ClickHouse/Pinot]
                                       ↗ [Real-time Aggregator: Flink]
```

**Why this pattern**:
- OLTP DB unaware of analytics (no extra load)
- Sub-second lag possible
- Analytics queries scale independently

**Cheaper alternative — read replica with delayed apply**:
- Spin up read replica
- Use `recovery_min_apply_delay = '5min'`
- Run analytics there

**Real-world example**: Reduced analytics queries from impacting prod p99 (sometimes by 10x) by moving to ClickHouse with CDC. Engineering time to set up: 2 weeks. Latency improvement: permanent.

---

### Q151. Load Testing Database Migrations

**Approach**:
1. **Capture production traffic** (pgbadger, pg_stat_statements, slow query log)
2. **Replay against staging** (pgreplay-go, sysbench custom workload)
3. **Compare metrics**:
   - p50/p95/p99 latency before/after
   - QPS capacity
   - Lock contention
4. **Chaos test**: kill primary mid-migration

**Tools**:
- `pgbench`: synthetic OLTP benchmark
- `sysbench`: customizable
- `pgreplay-go`: replay actual query log

**Real-world example**: Caught a 50% performance regression in a "harmless" minor version upgrade by replaying production queries. Investigated → identified plan regression → fixed with planner setting.

---

### Q152. Bitemporal Data (Valid Time + Transaction Time)

**What**:
- **Valid time**: When fact is true in real world (e.g., contract effective Jan 1 - Dec 31)
- **Transaction time**: When fact was recorded in DB (e.g., Jan 5 entered, Mar 1 corrected)

**Why**: Auditing, "as-of" queries, retroactive corrections.

**How**:
```sql
CREATE TABLE policies (
  id BIGINT,
  policy_holder TEXT,
  coverage_amount NUMERIC,
  valid_from DATE, valid_to DATE,    -- valid time
  tx_from TIMESTAMPTZ, tx_to TIMESTAMPTZ,  -- transaction time
  PRIMARY KEY (id, tx_from)
);

-- "As of March 1, what was the policy that covers Feb 15?"
SELECT * FROM policies
WHERE valid_from <= '2024-02-15' AND valid_to > '2024-02-15'
  AND tx_from <= '2024-03-01' AND tx_to > '2024-03-01';
```

**Real-world example**: Insurance / banking systems must answer "What did we think was true on X date about coverage on Y date?" Bitemporal model handles both retroactive corrections and historical reporting.

---

### Q153. Caching Strategy for Read-Heavy App

**Layer hierarchy** (top to bottom = closer to user):

1. **CDN cache** (CloudFront, Fastly): static + API responses with TTL
2. **App-server local cache** (in-memory): hot keys, low TTL
3. **Distributed cache** (Redis, Memcached): primary read cache
4. **DB read replicas**: scale reads
5. **Materialized views**: pre-computed aggregates
6. **Primary DB**: source of truth

**Patterns**:
- **Cache-aside**: app checks cache → miss → DB → populate cache
- **Read-through**: cache library does the DB fetch
- **Write-through**: writes go through cache to DB
- **Write-behind**: async DB writes
- **Refresh-ahead**: pre-fetch before expiry

**Invalidation strategies**:
- TTL-based (simplest, accept staleness)
- Event-driven (CDC → invalidate keys)
- Tag-based (group related entries, invalidate by tag)

**Real-world example**: A news site:
- CDN: 1-min cache for article HTML
- Redis: 5-min for "trending articles" list
- Materialized view: hourly refresh for "most read this week"
- PG: source of truth, < 5% of queries hit it
- Result: 50M daily users, single PG primary handles all writes; reads scale on caches

---

## CLOSING NOTES — Senior Engineer Mindset

### The Principles Across All Answers

1. **Measure before optimizing**: Every recommendation must be validated with metrics
2. **Understand trade-offs**: Every choice costs something — know what
3. **Defense in depth**: One layer of safety isn't enough (RLS + app checks + audit logs)
4. **Plan for failure**: Network partitions, disk fills, vacuum lag — they all happen
5. **Operational simplicity > Elegance**: A "boring" solution running for 5 years beats a clever one debugged at 3 AM
6. **Test recovery, not just backups**: Untested backups don't exist
7. **Document the why**: Future-you and your team need context for decisions
8. **Stay current selectively**: Know what's new (UUIDv7, PG 18 features), but don't chase every shiny thing
9. **Right tool for the job**: PG/MySQL aren't analytics DBs — use ClickHouse, BigQuery, etc. when appropriate
10. **Senior engineers say "it depends" — but then explain what it depends on**

### Final Reading List

- "Database Internals" by Alex Petrov (concepts)
- "Designing Data-Intensive Applications" by Martin Kleppmann (essential)
- "PostgreSQL 16 Internals" by Egor Rogov (free online, deep dive)
- "High Performance MySQL" 4th ed by Schwartz, Zaitsev, et al.
- PostgreSQL & MySQL release notes (every major version)
- depesz.com, planet.postgresql.org, percona.com/blog (ongoing)

### Skills That Compound

- **Read EXPLAIN ANALYZE fluently** — single biggest force multiplier
- **Know your stats** — pg_stat_statements, pg_stat_activity, performance_schema
- **Practice incidents** — replicate failures in staging
- **Read source code** — at senior level, the docs sometimes lie; code doesn't

---

*This guide is meant for active use. Mark it up, add your own examples from production incidents, and revisit periodically. The answers are starting points — the real learning happens when you face these situations and refine your judgment.*

*Last updated: May 2026 — Reflects PostgreSQL 17, MySQL 8.4*

