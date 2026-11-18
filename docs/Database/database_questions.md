# Top 100+ Database Questions for Senior Engineers
## PostgreSQL Focus

> Answers live in [Senior Engineer Database Answers](senior_engineer_database_answers.md) —
> question numbers match one-to-one.

---

## 1. FUNDAMENTAL CONCEPTS (15 questions)

1. **PostgreSQL stores tables as heaps and every index is non-clustered. What follows from that, and how does it differ from a clustered-index engine like InnoDB?**

2. **Explain the difference between a primary key and a unique constraint. When would you use one over the other?**

3. **What is the B-tree data structure and why is it the most common index structure in databases?**

4. **Describe the differences between OLTP and OLAP workloads and how database design differs for each.**

5. **What is normalization and what are the first three normal forms? Why might you denormalize intentionally?**

6. **Explain the concept of query cardinality and how it affects query optimization.**

7. **What is the difference between vertical and horizontal partitioning/sharding?**

8. **How does a query optimizer work? What information does it use to make decisions?**

9. **What is a histogram in database statistics and why is it important for query optimization?**

10. **Explain the difference between optimistic and pessimistic locking strategies.**

11. **What is a phantom read and how does it differ from a dirty read and non-repeatable read?**

12. **Describe the purpose and trade-offs of connection pooling.**

13. **What is write amplification and how is it relevant to database performance?**

14. **Explain the concept of "working set" in the context of database performance.**

15. **What is the difference between a full scan and an index scan, and when would each be preferred?**

---

## 2. INDEXING & QUERY OPTIMIZATION (19 questions)

16. **What is a composite (multi-column) index and what is the significance of column order?**

17. **Explain the concept of index selectivity and how it affects whether an index will be used.**

18. **What is an index skip scan (PostgreSQL) and when does it occur?**

19. **Describe the difference between an inclusive index and a covering index.**

20. **What is a partial index and provide a real-world use case.**

21. **How do you identify and fix slow queries? Walk through your diagnostic approach.**

22. **Explain what EXPLAIN and EXPLAIN ANALYZE show you, and how to read their output.**

23. **What is index bloat in PostgreSQL, and how do you detect and remediate it?**

24. **Describe the different join algorithms (Nested Loop, Hash Join, Merge Join) and when each is used.**

25. **What is a filter condition vs a join condition, and why does this distinction matter for performance?**

26. **Explain the concept of "index-only scans" (PostgreSQL) and the visibility map.**

27. **What is the N+1 query problem and how do you identify and prevent it?**

28. **How do you optimize queries with OR conditions?**

29. **Explain why adding more indexes doesn't always improve performance.**

30. **How would you optimize a query with multiple DISTINCT operations?**

31. **Explain the difference between functional indexes and expression indexes.**

32. **What is a deferred index build and why might you use it?**

33. **How do you handle query optimization for very large LIKE patterns?**

34. **Describe the performance implications of using functions in WHERE clauses.**

---

## 3. CONCURRENCY & LOCKING (15 questions)

35. **Explain the different row lock modes in PostgreSQL (FOR UPDATE, FOR SHARE, etc.).**

36. **What is lock escalation, why does PostgreSQL never do it, and what does it take at table level instead?**

37. **Describe deadlock scenarios and how to prevent them.**

38. **What is a blocking query and how do you identify and resolve it?**

39. **Explain the differences between shared locks and exclusive locks.**

40. **What is the purpose of sequence numbers and how are they handled concurrently?**

41. **PostgreSQL has no gap locks. How does it prevent write-side phantoms, and what does that require of your application?**

42. **How does PostgreSQL store row locks, and why does locking millions of rows still cost you something?**

43. **How does PostgreSQL's MVCC (Multi-Version Concurrency Control) work?**

44. **Explain the concept of transaction isolation levels and their trade-offs.**

45. **What is a lock wait timeout and how do you configure it?**

46. **Describe the difference between optimistic and pessimistic locking with examples.**

47. **What are "phantom rows" and how do different isolation levels handle them?**

48. **How do you detect and monitor lock contention?**

49. **Explain the purpose of advisory locks in PostgreSQL.**

---

## 4. TRANSACTIONS & ACID (12 questions)

50. **Explain the ACID properties and why they matter.**

51. **What is a dirty read, non-repeatable read, and phantom read? How do isolation levels prevent each?**

52. **Describe the four SQL isolation levels (READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE).**

53. **What is the difference between snapshot isolation and serializable snapshot isolation?**

54. **Explain savepoints and how you would use them in a transaction.**

55. **What is an implicit transaction vs explicit transaction?**

56. **Describe what happens when a transaction is rolled back. What are the implications?**

57. **How do long-running transactions impact database performance?**

58. **What is transaction log (WAL in PostgreSQL) and why is it critical?**

59. **Explain the concept of "consistency" in ACID. Why is it different from isolation?**

60. **What is a distributed transaction and what challenges does it present?**

61. **Describe the purpose and gotchas of autocommit mode.**

---

## 5. REPLICATION & HIGH AVAILABILITY (11 questions)

62. **Explain the difference between synchronous and asynchronous replication.**

63. **What is a read replica and what are the use cases?**

64. **Describe the causes and implications of replication lag.**

65. **How does PostgreSQL's streaming replication work?**

66. **What is logical replication and how does it differ from physical replication?**

67. **Explain the concept of "split brain" in a replication setup and how to prevent it.**

68. **What is a failover, failback, and switchover?**

69. **Describe the architecture of a semi-synchronous replication setup.**

70. **How do you identify and resolve replication conflicts?**

71. **What is WAL archiving and how is it used for backup and recovery?**

72. **How does PostgreSQL track a replica's position (LSN, timelines), and what does `pg_rewind` require to reattach a diverged primary?**

---

## 6. MAINTENANCE & ADMINISTRATION (14 questions)

73. **Explain the importance of VACUUM in PostgreSQL and how it works.**

74. **What is autovacuum and how do you tune it for different workloads?**

75. **How do you perform an online schema migration on a large table without downtime?**

76. **Describe the process and trade-offs of reorganizing a table.**

77. **What is bloat in PostgreSQL and how do you detect/reduce it?**

78. **How do you safely drop a column in a large table?**

79. **Explain the difference between a full backup, incremental backup, and differential backup.**

80. **What is point-in-time recovery (PITR) and how do you implement it?**

81. **How do you monitor database health and set up appropriate alerts?**

82. **Describe the purpose and configuration of slow query logs.**

83. **What is an upgrade path for major/minor version changes?**

84. **How do you estimate table and index sizes, and what do you do if they're growing unexpectedly?**

85. **Explain the process of analyzing table statistics and rebuilding statistics.**

86. **Describe the process of creating and maintaining a comprehensive backup strategy.**

---

## 7. PERFORMANCE TUNING (10 questions)

87. **What are the key PostgreSQL configuration parameters and how do you tune them for different hardware?**

88. **Explain shared_buffers, effective_cache_size, work_mem, and maintenance_work_mem.**

89. **What is the relationship between database performance and disk I/O patterns?**

90. **How do you identify whether a performance issue is CPU-bound, memory-bound, or I/O-bound?**

91. **Describe the performance implications of different data types (VARCHAR vs CHAR, INT vs BIGINT).**

92. **What is checkpoint frequency and how does it impact performance?**

93. **How do you optimize for SSD vs HDD storage?**

94. **Explain the performance impact of foreign keys and when to use them.**

95. **What is query result caching and what are the trade-offs?**

96. **How do you approach performance optimization for queries aggregating billions of rows?**

---

## 8. EDGE CASES & GOTCHAS (9 questions)

97. **Describe the difference between COUNT(*) and COUNT(column) when column can be NULL.**

98. **What happens with data consistency when you have cascading foreign keys and deletes?**

99. **Explain the gotchas of using OFFSET for pagination on large result sets.**

100. **What is the "off by one" problem in database design and how do you avoid it?**

101. **Describe scenarios where DISTINCT can silently hide data issues.**

102. **What are the implications of using UNIQUE constraints on nullable columns?**

103. **Explain the behavior of IN vs EXISTS in different scenarios.**

104. **What is the "Halloween Problem" in databases and how is it addressed?**

105. **Describe the differences between NATURAL JOIN and explicit INNER JOIN.**

---

## 9. POSTGRESQL-SPECIFIC (11 questions)

106. **Explain the TOAST (The Oversized-Attribute Storage Technique) mechanism in PostgreSQL.**

107. **What are extensions in PostgreSQL and give examples of critical ones (e.g., pg_stat_statements, pgvector).**

108. **Describe the differences between DELETE and TRUNCATE in PostgreSQL.**

109. **What is tablespace in PostgreSQL and why would you use it?**

110. **Explain Window Functions and provide a use case where they outperform alternatives.**

111. **What is a CTE (Common Table Expression) and when is it better than a subquery?**

112. **Describe the role of the transaction ID (XID) in PostgreSQL and XID wraparound.**

113. **What is the pg_stat_statements extension and how do you use it for performance analysis?**

114. **Explain native JSON support in PostgreSQL and its performance implications.**

115. **What is prepared statements and how do they prevent SQL injection?**

116. **What are generated columns in PostgreSQL (12+), and what are their limitations?**

---

## 10. DATA TYPES & STORAGE (10 questions)

117. **What are the storage and performance implications of VARCHAR(max) columns?**

118. **Explain the differences between DATE, DATETIME, and TIMESTAMP data types.**

119. **What is the difference between DECIMAL and FLOAT/DOUBLE in databases?**

120. **Describe the implications of using ENUM data types.**

121. **What are JSON data types and what are their performance considerations?**

122. **Explain the difference between TEXT and VARCHAR storage.**

123. **What are implications of using UUID as a primary key vs auto-incrementing INT?**

124. **Describe the storage implications of nullable vs non-nullable columns.**

125. **PostgreSQL has no unsigned integer types. What are your options when a counter approaches the INTEGER ceiling?**

126. **How do you handle bit flags efficiently in a database?**

---

## 11. SECURITY (5 questions)

127. **Explain SQL injection and how parameterized queries prevent it.**

128. **What is the principle of least privilege and how do you apply it to database users?**

129. **Describe encryption at rest vs encryption in transit for databases.**

130. **What is row-level security and how do you implement it in PostgreSQL?**

131. **Explain the security implications of default database configurations.**

---

## 12. PRACTICAL SCENARIOS (10 questions)

132. **You have a query that runs in 2 seconds but needs to run in 200ms. Walk through your optimization approach.**

133. **How would you redesign a table that has grown to 500GB and is slowing down?**

134. **A production database is experiencing high replication lag. What are your diagnostic steps?**

135. **You need to add a NOT NULL column to a table with 100M rows without downtime. How?**

136. **Describe how you would handle data migration between two different database systems.**

137. **A reporting query aggregates 10 billion rows and takes 30 minutes. How do you optimize it?**

138. **How would you implement real-time data analytics on top of a transactional database without impacting OLTP performance?**

139. **Describe your approach to load testing a database migration.**

140. **How do you handle bitemporal data (valid time and transaction time)?**

141. **Design a caching strategy for a high-traffic read-heavy application with a large dataset.**

---

## STUDY TIPS FOR SENIOR ENGINEERS

1. **Go deep, not wide**: For each question, understand not just the answer but the "why" and the trade-offs.

2. **Hands-on practice**: Run a local PostgreSQL. Use `EXPLAIN (ANALYZE, BUFFERS)`, create indexes, watch plans change.

3. **Read documentation**: The official docs are often better than blogs. Understand the nuances.

4. **Follow a scenario approach**: Don't just memorize answers. Think about real-world situations where these concepts apply.

5. **Understand trade-offs**: Every database decision involves trade-offs. Senior engineers make informed choices, not dogmatic ones.

6. **Learn from incidents**: Study post-mortems and failure scenarios to understand edge cases.

7. **Keep current**: Follow database blogs, GitHub issues, and research papers to stay updated with best practices.

8. **Teaching is learning**: Try explaining these concepts to others or writing about them. It exposes gaps in your understanding.

---

## FURTHER READING RECOMMENDATIONS

- **PostgreSQL Official Documentation**: https://www.postgresql.org/docs/
- **"PostgreSQL 16 Internals" by Egor Rogov** — free online, the deepest free resource on PG internals
- **"PostgreSQL Query Performance Insights" by Gülnihan Çalış**
- **Depesz's PostgreSQL Blog**: https://www.depesz.com/
- **PlanetPostgreSQL**: https://planet.postgresql.org/
- **pgMustard's EXPLAIN glossary**: https://www.pgmustard.com/docs/explain

---

*Last Updated: May 2026*
