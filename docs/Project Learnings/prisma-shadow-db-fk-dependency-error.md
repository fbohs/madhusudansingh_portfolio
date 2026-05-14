# Prisma Shadow Database & FK Dependency Errors

## How `prisma migrate dev` Works

When you run `prisma migrate dev`, Prisma does **two things** before touching your real database:

1. **Creates a shadow database** — a temporary, clean copy of your DB with no data.
2. **Replays every migration from scratch** against that shadow DB — from the very first migration to the latest.

Only if all migrations apply cleanly to the shadow DB will Prisma proceed to apply any pending migrations to your real DB.

This guarantees your migration history is **reproducible** — a fresh environment can always reach the same final schema by running all migrations in order.

```
Shadow DB (clean slate)
  └── migration_001  ✓
  └── migration_002  ✓
  └── migration_003  ✗  ← fails here → Prisma aborts everything
```

If any migration in the chain fails on the shadow DB, Prisma throws `P3006` and refuses to apply anything new — even if your real DB is perfectly fine.

---

## What Causes a Migration to Fail on the Shadow DB

A migration SQL file can work on your real DB once (because the state was already right at that moment) but **fail on a clean replay** if it depended on something implicit — like an order of operations that was already satisfied in production.

The most common cause: **dropping a primary key that another table's foreign key depends on**, without dropping the FK first.

PostgreSQL enforces this: you cannot drop a primary key (or unique) constraint if any foreign key references it. The FK must be dropped first.

```sql
-- This will FAIL if Order_addressId_fkey still exists:
ALTER TABLE "Address" DROP CONSTRAINT "Address_pkey";

-- ERROR: cannot drop constraint Address_pkey on table "Address"
-- because other objects depend on it
-- DETAIL: constraint Order_addressId_fkey on table "Order"
-- depends on index "Address_pkey"
```

---

## This Project's Case: `20260511063953_bigint_pk_publicid_uuidv7`

This migration converted all primary keys from `INT` to `BIGINT` and added `publicId` UUIDs. To do that, it had to drop and recreate every table's primary key.

The migration correctly tries to drop all FKs first, then alter the PKs:

```sql
-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT IF EXISTS "\1_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "\1_fkey";

-- ... (all other FKs)

-- AlterTable (drop + recreate PK)
ALTER TABLE "Address" DROP CONSTRAINT "Address_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "Address_pkey" PRIMARY KEY ("id");
```

**The bug**: every `DROP CONSTRAINT` uses `"\1_fkey"` as the constraint name — a regex back-reference (`\1`) that was never substituted with the actual name. Since the clause includes `IF EXISTS`, PostgreSQL silently no-ops each drop instead of erroring.

Result: all FK constraints remain in place. When the migration then tries to `DROP CONSTRAINT "Address_pkey"`, PostgreSQL blocks it because `Order_addressId_fkey` still depends on `Address_pkey`'s underlying index.

**Why it worked on the real DB once**: the migration likely ran during a period where those FK constraints happened to not exist yet (the schema was still being built), or the real DB had a different state. On a clean shadow DB the full constraint graph is present, so the dependency is enforced.

---

## The Golden Rule

**Never modify a migration file that has already been applied — in any environment.**

Prisma stores a SHA-256 checksum of every applied migration in the `_prisma_migrations` table. When the file on disk no longer matches that checksum, both `migrate dev` and `migrate deploy` detect drift and refuse to proceed.

```
_prisma_migrations table
  └── migration_name: 20260511063953_bigint_pk_publicid_uuidv7
      checksum:       abc123...   ← computed when migration first ran

File on disk now has different content → checksum = def456...
                                                      ↑ mismatch → Prisma refuses
```

Editing an applied migration to "fix" it is the wrong tool — it creates a new problem (checksum mismatch) on top of the original one.

---

## `migrate dev` vs `migrate deploy`

These two commands have different behaviours and are used in different environments:

| | `migrate dev` | `migrate deploy` |
|---|---|---|
| **Used in** | Local development | Production / CI |
| **Shadow DB** | Yes — replays full history | No |
| **Checksum check** | Yes | Yes |
| **On mismatch** | Offers to reset the database | Errors and aborts |
| **Generates files** | Yes | No (only applies existing files) |

`migrate deploy` never uses a shadow database, so it won't fail because a historical migration can't be replayed from scratch. But it still enforces checksums — a modified file blocks it just as hard.

---

## What "Modified After Applied" Actually Means

When you change the content of an applied migration file (even to fix a real bug in it), Prisma's next run sees:

```
Expected checksum (from _prisma_migrations): abc123...
Actual file checksum:                        def456...

migrate dev  → "We need to reset the database. All data will be lost."
migrate deploy → Error: P3006 — migration was modified after it was applied
```

In production you cannot reset. In dev you can, but it destroys all data.

---

## The Correct Production Flow for a Broken Migration

### Step 1 — Leave the broken migration file untouched

Keep its content exactly as production applied it. The checksum in `_prisma_migrations` must stay consistent with the file on disk.

### Step 2 — Write a forward-fix migration

Create a **new** migration that brings the schema to the correct state, regardless of what the broken one left behind. Use `IF EXISTS` / `IF NOT EXISTS` guards to make it idempotent:

```sql
-- Forward-fix: ensure FKs that \1_fkey silently skipped are in the correct state
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_addressId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey"
  FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Repeat for every FK the broken migration failed to handle
```

Generate the file without running it:
```bash
npx prisma migrate dev --create-only --name fix_fk_constraints
```

Review the generated SQL, then deploy:
```bash
npx prisma migrate deploy
```

### Step 3 — Deploy normally

`migrate deploy` applies only unapplied migrations in order, skipping the shadow DB entirely. As long as no file was modified, it proceeds cleanly.

---

## This Project's Specific Situation

We broke the golden rule: we fixed the `\1_fkey` placeholders directly inside the already-applied migration `20260511063953`. The fix is correct SQL but the wrong approach — now the file's checksum doesn't match `_prisma_migrations`.

**Without data loss, the path forward is:**

```sql
-- 1. Compute the SHA-256 of the fixed file
-- 2. Patch _prisma_migrations directly so Prisma accepts the modified file
UPDATE "_prisma_migrations"
SET checksum = '<sha256-of-fixed-file>'
WHERE migration_name = '20260511063953_bigint_pk_publicid_uuidv7';
```

After patching the checksum, Prisma sees the file and table as consistent. The shadow DB can now replay the fixed SQL cleanly (real constraint names instead of `\1_fkey`), and `migrate dev` can apply the new Session table migration on top.

This "checksum surgery" is acceptable in dev. In production, the correct answer is always: revert the file, write a forward-fix migration.

---

## Why `prisma db push` Only Defers the Problem

It is tempting to think: "I'll just use `db push` now to get the Session table in, and deal with the broken migration later." Here is exactly what happens:

```
TODAY — prisma db push
─────────────────────────────────────────────────────────
  Real DB:              Session table created ✓
  _prisma_migrations:   unchanged — still has old checksum (abc123)
  File on disk:         still has new content (def456)
  Checksum mismatch:    still there, just not checked by db push

DAYS LATER — prisma migrate dev --name new_feature
─────────────────────────────────────────────────────────
  Step 1 — Checksum scan:
    _prisma_migrations: abc123
    File on disk:       def456
    → MISMATCH → "migration was modified after applied"
    → Prisma offers reset. Same wall. Nothing changed.
```

`db push` bypasses the shadow DB and the checksum check entirely — it only asks "what is different between `schema.prisma` and the real DB right now?" and applies that diff. It does not record anything in `_prisma_migrations`. So the underlying mismatch is completely untouched and hits you again the moment you run `migrate dev`.

**`db push` does not fix the problem. It kicks it down the road.**

---

## Why Revert + Forward-Fix Does Not Work in Dev

Another tempting approach: revert the file to its original `\1_fkey` content (restoring the checksum match), then write a forward-fix migration on top. In production this works — `migrate deploy` skips the shadow DB. In dev it does not, because `migrate dev` always replays the full history:

```
prisma migrate dev (after reverting file + adding forward-fix)
─────────────────────────────────────────────────────────────
Shadow DB replay — strictly in order:

  └── 20251205_init                          ✓
  └── 20260507_expand_schema                 ✓
  └── 20260511_add_updatedat_default         ✓
  └── 20260511_bigint_pk  (\1_fkey reverted) ✗  ← P3006, aborts here
  └── forward_fix_migration                      ← never reached
  └── add_session_table                          ← never reached
```

The forward-fix migration is sequenced after the broken one. The shadow DB hits the broken migration first and aborts — it never gets to the fix. The chain is blocked.

This approach only works when `migrate deploy` is the runner (no shadow DB). In dev, the shadow DB makes it impossible.

```
Where each approach works:
─────────────────────────────────────────────────────────────
                        migrate dev   migrate deploy
                        (dev, shadow) (prod, no shadow)
─────────────────────────────────────────────────────────────
Revert + forward-fix        ✗               ✓
Fixed file + checksum       ✓               ✓
  surgery
db push                     ✓ (now)         N/A (defers problem)
─────────────────────────────────────────────────────────────
```

**The only approach that works in both dev and production without data loss is: fix the file + patch the checksum.**

---

## Fix Options Summary

| Option | How | Works in dev? | Works in prod? | Notes |
|---|---|---|---|---|
| Fixed file + checksum surgery | Fix SQL, patch `_prisma_migrations.checksum` | ✓ | ✓ | Only option that works everywhere without data loss |
| Forward-fix migration | Leave broken file, write new corrective migration on top | ✗ | ✓ | Blocked by shadow DB in dev; safe in prod via `migrate deploy` |
| Revert file + forward-fix | Restore original file, add corrective migration | ✗ | ✓ | Same shadow DB problem — forward-fix never reached in dev |
| `prisma db push` | Push schema diff, skip migration history | ✓ (now) | N/A | Defers the problem — next `migrate dev` hits the same wall |
| `migrate resolve --applied` | Mark a migration as applied without running it | ✓ | ✓ | Only for migrations not yet in `_prisma_migrations`; won't fix checksum mismatch |
| `migrate reset` | Drop DB, replay all migrations from scratch | ✓ | ✗ | Destroys all data; only viable in dev throwaway environments |

---

## Key Takeaways

| Concept | Detail |
|---|---|
| Shadow DB | Used by `migrate dev` only — full replay of history from scratch |
| `P3006` error | A past migration fails on the shadow DB — blocks all new migrations |
| FK → PK dependency | PostgreSQL won't drop a PK if any FK references it; drop the FK first |
| `IF EXISTS` silence | A failed DROP with `IF EXISTS` emits no error — bugs hide silently |
| Checksum enforcement | Both `migrate dev` and `migrate deploy` reject modified applied migrations |
| Golden rule | Never edit an applied migration — always write a new forward-fix migration |
| `migrate dev` vs `deploy` | dev has shadow DB + reset option; deploy has neither, safe for production |




### Prompt which was suggested by CodeRabbit
```
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

Inline comments:
In `@prisma/migrations/20260511063953_bigint_pk_publicid_uuidv7/migration.sql`:
- Around line 1-38: The DROP CONSTRAINT lines in migration.sql use the
placeholder name "\1_fkey" which won't remove the real foreign keys; replace
each DROP CONSTRAINT IF EXISTS "\1_fkey" with the actual constraint names used
elsewhere in the migration (e.g. Address_userId_fkey, CartItem_userId_fkey,
Category_parentId_fkey, Inventory_productId_fkey, Order_userId_fkey,
OrderItem_orderId_fkey, OrderItem_productId_fkey, Payment_orderId_fkey,
Product_categoryId_fkey, Review_productId_fkey, Review_userId_fkey, etc.),
ensuring each name exactly matches the constraint names you re-add later so the
subsequent ALTER COLUMN ... SET DATA TYPE BIGINT steps can run without dependent
constraints.

---

Outside diff comments:
In `@src/routes/addresses.ts`:
- Around line 89-106: The handlers query the database with
request.params.publicId without validating it's a UUID, which can cause DB
errors for invalid path segments; add param validation to both routes (the PUT
handler around fastify.put(...) and the other handler that also calls
where('publicId', '=', publicId)) by adding a schema.params with
properties.publicId: { type: 'string', format: 'uuid' } and required:
['publicId'] so Fastify returns 400 for invalid UUIDs before hitting the DB, or
alternatively perform an explicit check (e.g.,
validator.isUUID(request.params.publicId)) and reply.code(400) if invalid.
```