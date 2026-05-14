# Prisma + Kysely: updatedAt NULL Constraint Error

## The Problem

```
DatabaseError: null value in column "updatedAt" of relation "User" violates not-null constraint
```

When using Kysely for database operations with a Prisma-defined schema, inserting new records fails because the `updatedAt` column receives a `null` value, violating the NOT NULL constraint.

## Root Cause

**Prisma and Kysely operate at different levels:**

- **Prisma Schema**: Defines the structure with special directives like `@updatedAt`
- **Database Schema**: The actual PostgreSQL table constraints
- **Kysely**: A query builder that interacts directly with the database, not through Prisma

When you use `@updatedAt` in Prisma, it only works when using **Prisma Client**. Kyrsey has no knowledge of this directive and assumes all `Generated<Timestamp>` columns will be handled by the database.

**The disconnect:** Your Prisma schema says `updatedAt` should have a default, but your actual PostgreSQL table might not have the `DEFAULT CURRENT_TIMESTAMP` constraint.

## Why It Happens

Your migration files were created before the `@updatedAt` directive was added to the Prisma schema, or the migration didn't properly include the `DEFAULT CURRENT_TIMESTAMP` clause in the SQL.

Result: The column is NOT NULL but has no default value → database rejects NULL inserts.

## Solutions

### ⭐ Best Solution: Helper Function (Recommended)

Create a utility function to consistently set timestamps in all Kysely inserts:

```typescript
// utils/db-helpers.ts
export const getTimestamps = () => ({
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const getUserInsertData = (data: Partial<User>) => ({
  ...data,
  ...getTimestamps(),
});
```

Then use it in your auth route:

```typescript
// src/routes/auth.ts
const newUser = await db
  .insertInto('User')
  .values(getUserInsertData({
    email: registerData.email,
    password: hashedPassword,
    // ... other fields
  }))
  .executeTakeFirst();
```

**Why this is best:**
- ✅ Works with future migrations (no conflicts)
- ✅ DRY principle - reusable across all inserts
- ✅ Consistent timestamp handling
- ✅ No manual SQL or Prisma migrations needed
- ✅ Explicit and maintainable

---

### Why Other Solutions Don't Work

**Database Defaults:** Will be overwritten when new Prisma migrations are applied
```sql
-- ❌ This gets overwritten by next migration
ALTER TABLE "User" 
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
```

**Prisma Migrations:** `@updatedAt` only works with Prisma Client, not Kysely
```prisma
updatedAt  DateTime   @updatedAt  // ❌ Kysely ignores this
```


### Database Level Solution (not recommended)

Add a Postgres trigger that auto-updates updatedAt on row update. That's a DB-level guarantee independent of which client writes. But it's outside Prisma's schema — you'd manage it as a raw SQL migration. Up to you whether that's worth it; the helper approach is simpler.


## Prevention Tips

1. **Use Helper Functions for Timestamps**
   - Create utility functions for all timestamp-related operations
   - Never manually set timestamps in individual queries
   ```typescript
   export const getTimestamps = () => ({
     createdAt: new Date(),
     updatedAt: new Date(),
   });
   ```

2. **When Mixing ORMs (Prisma + Kysely)**
   - Recognize that Prisma directives (`@updatedAt`) don't apply to Kysely queries
   - Handle all required fields explicitly in code, not the database
   - Keep helper functions as the single source of truth

3. **Avoid Database-Level Solutions**
   - Don't add constraints directly via SQL—they get overwritten by migrations
   - Don't rely on Prisma directives for Kysely operations

4. **Consistent Pattern for All Inserts**
   - Apply timestamp helpers to all insert operations
   - Update, delete operations may also need similar helpers

## Relevant Code Locations

- **Prisma Schema**: `prisma/schema.prisma`
- **Migrations**: `prisma/migrations/`
- **Kysely Types**: Generated types file (e.g., `db/types.ts`)
- **Error Location**: `src/routes/auth.ts` (line 69 in this case)

## Checklist for Similar Issues

- [ ] Check if using multiple query builders (Prisma + Kysely, etc.)
- [ ] Verify migrations are applied: `prisma migrate status`
- [ ] Inspect migration SQL files for proper constraints
- [ ] Check Kysely type definitions for `Generated<>` markers
- [ ] Add `DEFAULT CURRENT_TIMESTAMP` or manually set values in inserts