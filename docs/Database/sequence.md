A **sequence** in SQL is a database object that generates a series of unique, sequential numbers. It's commonly used to automatically generate primary key values for database records.

## Key Characteristics

**Auto-incrementing values**: Sequences produce incremental numbers, typically starting from a specified value and incrementing by a fixed amount (usually 1).

**Unique across calls**: Each time you request the next value from a sequence, you get a new, unique number that hasn't been issued before.

**Independent object**: Sequences exist as standalone database objects separate from tables.

## Common Uses

- **Primary key generation**: Automatically generating unique IDs for table rows
- **Unique identifiers**: Creating unique numbers for invoice numbers, order IDs, etc.

## Basic Syntax

Different SQL databases have slightly different syntax:

**PostgreSQL:**
```sql
CREATE SEQUENCE seq_name START 1 INCREMENT BY 1;

-- Using the sequence
INSERT INTO users (id, name) VALUES (nextval('seq_name'), 'John');
```

**Oracle:**
```sql
CREATE SEQUENCE seq_name START WITH 1 INCREMENT BY 1;

-- Using the sequence
INSERT INTO users (id, name) VALUES (seq_name.nextval, 'John');
```

**MySQL:**
```sql
-- MySQL uses AUTO_INCREMENT instead of sequences
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100)
);
```

**SQL Server:**
```sql
CREATE SEQUENCE seq_name START WITH 1 INCREMENT BY 1;

-- Using the sequence
INSERT INTO users (id, name) VALUES (NEXT VALUE FOR seq_name, 'John');
```

## Key Advantages

- Ensures unique values without relying on application logic
- Better performance than application-level ID generation
- Can be shared across multiple tables
- Supports custom start values and increment amounts