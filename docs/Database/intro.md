# Database

Notes, interview prep, and deep dives on relational database fundamentals — built from real-world troubleshooting and study.

**PostgreSQL is the subject throughout.** Other engines appear only where the contrast explains something about Postgres — InnoDB's clustered-index layout against Postgres's heap, or gap locks against predicate locks — and are labelled as such.

## In This Section

- **Indexing** — pages and full table scans, B-trees, hash indexes, geospatial indexes (geohash, quad tree, R-tree), inverted indexes, and how to pick one.
- **Sequence** — how sequences generate unique values, the `IDENTITY` vs `BIGSERIAL` choice, and why gaps are normal.
- **Interview Questions** — 141 questions, numbered one-to-one with the answers guide.
- **Senior Engineer Database Answers** — worked answers to all 141, each following a What/Why/How/Trade-offs/Real-world pattern.
- **Bigint vs Uuidv7 Id Strategy** — choosing a primary key strategy and the trade-offs involved.
