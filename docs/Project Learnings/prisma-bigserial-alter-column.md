# IMPORTANT — Prisma emits invalid SQL when widening SERIAL → BIGSERIAL

**Status:** known Prisma quirk. Manual fix required in the generated migration.

## The problem

When you change a Prisma model from:

```prisma
id Int @id @default(autoincrement())
```

to:

```prisma
id BigInt @id @default(autoincrement())
```

…and generate the migration SQL via `prisma migrate diff`, Prisma emits:

```sql
ALTER TABLE "Foo"
  ALTER COLUMN "id" SET DATA TYPE BIGSERIAL;
```

This **fails** at apply time:

```
ERROR: type "bigserial" does not exist
```

## Why it fails

`BIGSERIAL` is **not a real Postgres data type**. It's a shorthand only valid in
`CREATE TABLE` column definitions, where it expands into three things:

1. A `BIGINT` column.
2. A new `CREATE SEQUENCE` object.
3. A `DEFAULT nextval(...)` pointing at that sequence.

Once the column exists, its actual catalog type is plain `BIGINT`. The
"SERIAL-ness" lives in the sequence + default, not in the column's type.

`ALTER COLUMN SET DATA TYPE X` requires `X` to be a real type. Since
`BIGSERIAL` is a macro and not a type, Postgres rejects it.

## The correct SQL

When widening a column that's already `SERIAL` (i.e., already has a sequence
and a `DEFAULT nextval(...)` attached), you only need to change the storage
type:

```sql
ALTER TABLE "Foo"
  ALTER COLUMN "id" SET DATA TYPE BIGINT;
```

- The existing sequence stays attached.
- The existing `DEFAULT nextval(...)` stays in place.
- Postgres sequences are internally `bigint` anyway, so no sequence migration
  is needed.
- Auto-increment behavior continues to work, now producing values that fit in
  a 64-bit column.

## The fix when this happens

After running `prisma migrate diff` and getting `SET DATA TYPE BIGSERIAL`
lines, do a find-and-replace in the generated migration file:

```bash
sed -i.bak 's/SET DATA TYPE BIGSERIAL/SET DATA TYPE BIGINT/g' \
  prisma/migrations/<TIMESTAMP>_<name>/migration.sql
```

Then apply with `prisma migrate deploy`.

## Reference

This bit us on `2026-05-11` when migrating PKs from `Int` to `BigInt` across
the full schema. Ten `SET DATA TYPE BIGSERIAL` lines had to be rewritten to
`SET DATA TYPE BIGINT`.
