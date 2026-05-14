# Prisma & Kysely

> Personal learnings from working with Prisma and Kysely — gotchas, patterns, when to reach for each, and things I wish I knew earlier.

---

## What They Are

```
Prisma   →  ORM — schema-first, auto-generates a type-safe client from your data model
Kysely   →  Query builder — write SQL directly, fully type-safe, no magic
```

```
The spectrum of database tools:

  Raw SQL          Kysely            Prisma          ActiveRecord-style ORMs
  ────────────────────────────────────────────────────────────────────────────
  Max control      Type-safe SQL     Schema-driven   Most abstracted
  No types         Close to metal    Auto-generated  Furthest from SQL
  Most flexible    Explicit queries  Less control    Convention over config
```

---

## Prisma

### Core Concepts

```
schema.prisma  →  single source of truth for your data model
Prisma Client  →  auto-generated, fully typed query API
Prisma Migrate →  generates SQL migrations from schema changes
```

**Schema example:**

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
}
```

**Generated client usage:**

```typescript
// Create
const user = await prisma.user.create({
  data: { email: 'madhu@example.com', name: 'Madhu' }
})

// Read with relation
const userWithPosts = await prisma.user.findUnique({
  where: { id: userId },
  include: { posts: true }
})

// Filtered query
const publishedPosts = await prisma.post.findMany({
  where: { published: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0
})

// Update
await prisma.user.update({
  where: { id: userId },
  data: { name: 'New Name' }
})

// Delete
await prisma.user.delete({ where: { id: userId } })
```

### Learnings & Gotchas

<!-- Add your personal notes here -->

---

## Kysely

### Core Concepts

```
Kysely is a query builder, not an ORM.
You write SQL, Kysely just makes it type-safe.
No schema file. Types come from a TypeScript interface you define.
```

**Type definition:**

```typescript
import { Generated, Selectable, Insertable, Updateable } from 'kysely'

interface UserTable {
  id: Generated<string>
  email: string
  name: string | null
  created_at: Generated<Date>
}

interface Database {
  user: UserTable
  post: PostTable
}

const db = new Kysely<Database>({ dialect })
```

**Query examples:**

```typescript
// Select
const users = await db
  .selectFrom('user')
  .selectAll()
  .where('email', '=', 'madhu@example.com')
  .executeTakeFirst()

// Insert
await db
  .insertInto('user')
  .values({ email: 'madhu@example.com', name: 'Madhu' })
  .execute()

// Update
await db
  .updateTable('user')
  .set({ name: 'New Name' })
  .where('id', '=', userId)
  .execute()

// Join
const postsWithAuthors = await db
  .selectFrom('post')
  .innerJoin('user', 'user.id', 'post.author_id')
  .select(['post.title', 'user.name as author_name'])
  .execute()
```

### Learnings & Gotchas

<!-- Add your personal notes here -->

---

## Prisma vs Kysely: When to Use Which

```
┌────────────────────────────┬──────────────────────┬──────────────────────┐
│                            │ Prisma               │ Kysely               │
├────────────────────────────┼──────────────────────┼──────────────────────┤
│ Type safety                │ ✅ Auto-generated     │ ✅ Manually typed    │
│ Schema management          │ ✅ schema.prisma      │ ❌ Bring your own    │
│ Migrations                 │ ✅ Built-in           │ ❌ Bring your own    │
│ Relation queries           │ ✅ include / select   │ Manual joins         │
│ Raw SQL control            │ Limited              │ ✅ Full control       │
│ Complex queries            │ Can get awkward      │ ✅ Natural            │
│ Bundle size                │ Larger               │ Smaller              │
│ Learning curve             │ Low (schema-driven)  │ Medium (SQL needed)  │
│ Generated client           │ ✅                   │ ❌                   │
│ Multi-schema / legacy DB   │ Difficult            │ ✅ Straightforward   │
└────────────────────────────┴──────────────────────┴──────────────────────┘
```

```
Reach for Prisma when:
  → Greenfield project with full schema control
  → Want schema-as-source-of-truth with auto-generated migrations
  → Team is less comfortable with raw SQL
  → CRUD-heavy app, relations are simple

Reach for Kysely when:
  → Working with a legacy or existing database schema
  → Need fine-grained SQL control (CTEs, window functions, complex joins)
  → Want minimal abstraction, close-to-metal queries
  → Performance-critical paths where Prisma's query generation is too opaque
  → Already have a migration tool (Flyway, db-migrate, Drizzle)
```

---

## Notes

<!-- Free-form space for additional learnings, links, and references -->
