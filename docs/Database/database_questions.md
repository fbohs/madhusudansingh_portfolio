# Top 100+ Database Questions for Senior Engineers
## PostgreSQL & MySQL Focus

---

## 1. FUNDAMENTAL CONCEPTS (15 questions)

1. **What is the difference between a clustered and non-clustered index, and how are they handled differently in PostgreSQL vs MySQL (InnoDB)?**

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

## 2. INDEXING & QUERY OPTIMIZATION (20 questions)

16. **What is a composite (multi-column) index and what is the significance of column order?**

17. **Explain the concept of index selectivity and how it affects whether an index will be used.**

18. **What is an index skip scan (PostgreSQL) and when does it occur?**

19. **Describe the difference between an inclusive index and a covering index.**

20. **What is a partial index and provide a real-world use case.**

21. **How do you identify and fix slow queries? Walk through your diagnostic approach.**

22. **Explain what EXPLAIN and EXPLAIN ANALYZE show you, and how to read their output.**

23. **What is index bloat and how do you detect and remediate it in PostgreSQL vs MySQL?**

24. **Describe the different join algorithms (Nested Loop, Hash Join, Merge Join) and when each is used.**

25. **What is a filter condition vs a join condition, and why does this distinction matter for performance?**

26. **Explain the concept of "index-only scans" (PostgreSQL) and the visibility map.**

27. **What is the N+1 query problem and how do you identify and prevent it?**

28. **How do you optimize queries with OR conditions?**

29. **Explain why adding more indexes doesn't always improve performance.**

30. **What is a clustered scan vs non-clustered scan in the context of InnoDB?**

31. **How would you optimize a query with multiple DISTINCT operations?**

32. **Explain the difference between functional indexes and expression indexes.**

33. **What is a deferred index build and why might you use it?**

34. **How do you handle query optimization for very large LIKE patterns?**

35. **Describe the performance implications of using functions in WHERE clauses.**

---

## 3. CONCURRENCY & LOCKING (15 questions)

36. **Explain the different row lock modes in PostgreSQL (FOR UPDATE, FOR SHARE, etc.).**

37. **What is lock escalation and how is it handled in PostgreSQL vs MySQL?**

38. **Describe deadlock scenarios and how to prevent them.**

39. **What is a blocking query and how do you identify and resolve it?**

40. **Explain the differences between shared locks and exclusive locks.**

41. **What is the purpose of sequence numbers and how are they handled concurrently?**

42. **Describe the concept of "gap locks" in MySQL InnoDB and why they exist.**

43. **What is a page lock vs row lock, and when would each occur?**

44. **How does PostgreSQL's MVCC (Multi-Version Concurrency Control) work?**

45. **Explain the concept of transaction isolation levels and their trade-offs.**

46. **What is a lock wait timeout and how do you configure it?**

47. **Describe the difference between optimistic and pessimistic locking with examples.**

48. **What are "phantom rows" and how do different isolation levels handle them?**

49. **How do you detect and monitor lock contention?**

50. **Explain the purpose of advisory locks in PostgreSQL.**

---

## 4. TRANSACTIONS & ACID (12 questions)

51. **Explain the ACID properties and why they matter.**

52. **What is a dirty read, non-repeatable read, and phantom read? How do isolation levels prevent each?**

53. **Describe the four SQL isolation levels (READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE).**

54. **What is the difference between snapshot isolation and serializable snapshot isolation?**

55. **Explain savepoints and how you would use them in a transaction.**

56. **What is an implicit transaction vs explicit transaction?**

57. **Describe what happens when a transaction is rolled back. What are the implications?**

58. **How do long-running transactions impact database performance?**

59. **What is transaction log (WAL in PostgreSQL) and why is it critical?**

60. **Explain the concept of "consistency" in ACID. Why is it different from isolation?**

61. **What is a distributed transaction and what challenges does it present?**

62. **Describe the purpose and gotchas of autocommit mode.**

---

## 5. REPLICATION & HIGH AVAILABILITY (12 questions)

63. **Explain the difference between synchronous and asynchronous replication.**

64. **What is a read replica and what are the use cases?**

65. **Describe the causes and implications of replication lag.**

66. **How does PostgreSQL's streaming replication work?**

67. **What is logical replication and how does it differ from physical replication?**

68. **Explain the concept of "split brain" in a replication setup and how to prevent it.**

69. **What is a failover, failback, and switchover?**

70. **Describe the architecture of a semi-synchronous replication setup.**

71. **How do you identify and resolve replication conflicts?**

72. **What is WAL archiving and how is it used for backup and recovery?**

73. **Explain the differences between MySQL's binary log formats (ROW, STATEMENT, MIXED).**

74. **What is GTID-based replication and what advantages does it provide?**

---

## 6. MAINTENANCE & ADMINISTRATION (15 questions)

75. **Explain the importance of VACUUM in PostgreSQL and how it works.**

76. **What is autovacuum and how do you tune it for different workloads?**

77. **How do you perform an online schema migration on a large table without downtime?**

78. **Describe the process and trade-offs of reorganizing a table.**

79. **What is bloat in PostgreSQL and how do you detect/reduce it?**

80. **How do you safely drop a column in a large table?**

81. **Explain the difference between a full backup, incremental backup, and differential backup.**

82. **What is point-in-time recovery (PITR) and how do you implement it?**

83. **How do you monitor database health and set up appropriate alerts?**

84. **Describe the purpose and configuration of slow query logs.**

85. **What is an upgrade path for major/minor version changes?**

86. **How do you estimate table and index sizes, and what do you do if they're growing unexpectedly?**

87. **Explain the process of analyzing table statistics and rebuilding statistics.**

88. **What is table fragmentation in MySQL and how do you address it?**

89. **Describe the process of creating and maintaining a comprehensive backup strategy.**

---

## 7. PERFORMANCE TUNING (15 questions)

90. **What are the key PostgreSQL configuration parameters and how do you tune them for different hardware?**

91. **Explain shared_buffers, effective_cache_size, work_mem, and maintenance_work_mem in PostgreSQL.**

92. **How do you tune MySQL's buffer pool, key cache, and query cache?**

93. **What is the relationship between database performance and disk I/O patterns?**

94. **How do you identify whether a performance issue is CPU-bound, memory-bound, or I/O-bound?**

95. **Describe the performance implications of different data types (VARCHAR vs CHAR, INT vs BIGINT).**

96. **What is checkpoint frequency and how does it impact performance?**

97. **How do you optimize for SSD vs HDD storage?**

98. **Explain the performance impact of foreign keys and when to use them.**

99. **What is query result caching and what are the trade-offs?**

100. **How do you approach performance optimization for queries aggregating billions of rows?**

---

## 8. EDGE CASES & GOTCHAS (8 questions)

101. **Describe the difference between COUNT(*) and COUNT(column) when column can be NULL.**

102. **What happens with data consistency when you have cascading foreign keys and deletes?**

103. **Explain the gotchas of using OFFSET for pagination on large result sets.**

104. **What is the "off by one" problem in database design and how do you avoid it?**

105. **Describe scenarios where DISTINCT can silently hide data issues.**

106. **What are the implications of using UNIQUE constraints on nullable columns?**

107. **Explain the behavior of IN vs EXISTS in different scenarios.**

108. **What is the "Halloween Problem" in databases and how is it addressed?**

---

## 9. POSTGRESQL-SPECIFIC (10 questions)

109. **Explain the TOAST (The Oversized-Attribute Storage Technique) mechanism in PostgreSQL.**

110. **What are extensions in PostgreSQL and give examples of critical ones (e.g., pg_stat_statements, pgvector).**

111. **Describe the differences between DELETE and TRUNCATE in PostgreSQL.**

112. **What is tablespace in PostgreSQL and why would you use it?**

113. **Explain Window Functions and provide a use case where they outperform alternatives.**

114. **What is a CTE (Common Table Expression) and when is it better than a subquery?**

115. **Describe the role of the transaction ID (XID) in PostgreSQL and XID wraparound.**

116. **What is the pg_stat_statements extension and how do you use it for performance analysis?**

117. **Explain native JSON support in PostgreSQL and its performance implications.**

118. **What is prepared statements and how do they prevent SQL injection?**

---

## 10. MYSQL-SPECIFIC (10 questions)

119. **Explain InnoDB vs MyISAM storage engines and when each is appropriate.**

120. **What is the MySQL query cache (deprecated in 8.0) and why was it removed?**

121. **Describe the role of the redo log and undo log in InnoDB.**

122. **What is the change buffer in InnoDB and how does it improve write performance?**

123. **Explain double-write buffering in InnoDB and why it's important.**

124. **What is adaptive hash indexing in InnoDB?**

125. **Describe the differences between NATURAL JOIN and explicit INNER JOIN.**

126. **What are generated columns and what are their limitations in MySQL?**

127. **Explain the role of the binlog and its importance in replication and recovery.**

128. **What is the MySQL Query Optimizer Hint syntax and when would you use it?**

---

## 11. DATA TYPES & STORAGE (10 questions)

129. **What are the storage and performance implications of VARCHAR(max) columns?**

130. **Explain the differences between DATE, DATETIME, and TIMESTAMP data types.**

131. **What is the difference between DECIMAL and FLOAT/DOUBLE in databases?**

132. **Describe the implications of using ENUM data types.**

133. **What are JSON data types and what are their performance considerations?**

134. **Explain the difference between TEXT and VARCHAR storage.**

135. **What are implications of using UUID as a primary key vs auto-incrementing INT?**

136. **Describe the storage implications of nullable vs non-nullable columns.**

137. **What is the difference between SIGNED and UNSIGNED integers?**

138. **How do you handle bit flags efficiently in a database?**

---

## 12. SECURITY (5 questions)

139. **Explain SQL injection and how parameterized queries prevent it.**

140. **What is the principle of least privilege and how do you apply it to database users?**

141. **Describe encryption at rest vs encryption in transit for databases.**

142. **What is row-level security and how do you implement it in PostgreSQL?**

143. **Explain the security implications of default database configurations.**

---

## BONUS: PRACTICAL SCENARIOS (10 questions)

144. **You have a query that runs in 2 seconds but needs to run in 200ms. Walk through your optimization approach.**

145. **How would you redesign a table that has grown to 500GB and is slowing down?**

146. **A production database is experiencing high replication lag. What are your diagnostic steps?**

147. **You need to add a NOT NULL column to a table with 100M rows without downtime. How?**

148. **Describe how you would handle data migration between two different database systems.**

149. **A reporting query aggregates 10 billion rows and takes 30 minutes. How do you optimize it?**

150. **How would you implement real-time data analytics on top of a transactional database without impacting OLTP performance?**

151. **Describe your approach to load testing a database migration.**

152. **How do you handle bitemporal data (valid time and transaction time)?**

153. **Design a caching strategy for a high-traffic read-heavy application with a large dataset.**

---

## STUDY TIPS FOR SENIOR ENGINEERS

1. **Go deep, not wide**: For each question, understand not just the answer but the "why" and the trade-offs.

2. **Hands-on practice**: Set up PostgreSQL and MySQL locally. Run EXPLAIN ANALYZE, create indexes, observe query plans.

3. **Read documentation**: The official docs are often better than blogs. Understand the nuances.

4. **Follow a scenario approach**: Don't just memorize answers. Think about real-world situations where these concepts apply.

5. **Understand trade-offs**: Every database decision involves trade-offs. Senior engineers make informed choices, not dogmatic ones.

6. **Learn from incidents**: Study post-mortems and failure scenarios to understand edge cases.

7. **Keep current**: Follow database blogs, GitHub issues, and research papers to stay updated with best practices.

8. **Teaching is learning**: Try explaining these concepts to others or writing about them. It exposes gaps in your understanding.

---

## FURTHER READING RECOMMENDATIONS

- **PostgreSQL Official Documentation**: https://www.postgresql.org/docs/
- **MySQL Official Documentation**: https://dev.mysql.com/doc/
- **"PostgreSQL Query Performance Insights" by Gülnihan Çalış**
- **"High Performance MySQL" by Baron Schwartz et al.**
- **Depesz's PostgreSQL Blog**: https://www.depesz.com/
- **PlanetPostgreSQL**: https://planet.postgresql.org/
- **MySQL Performance Blog**: https://www.percona.com/blog/

---

*Last Updated: May 2026*
