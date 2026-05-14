# BigInt vs UUIDv7 — ID Strategy for API Backends

## The Core Question

When you have two ID types on the same row (internal BigInt + public UUIDv7), the question is:
> **Which one goes where?**

One-line answer: **BigInt stays inside the database. UUIDv7 is the only ID that ever crosses the API boundary.**

---

## Why You Need Both

Neither type alone is sufficient for a production backend.

| Property | BigInt | UUIDv7 |
|---|---|---|
| Storage | 8 bytes | 16 bytes |
| Index / join performance | Excellent (sequential) | Good (time-ordered, better than v4) |
| Safe to expose publicly | No — sequential = enumerable | Yes — opaque, reveals nothing |
| Globally unique | No — conflicts across DBs | Yes |
| Generated client-side / offline | No | Yes |
| Reveals row count / growth rate | Yes | No |

**BigInt** is a DB performance tool — small, fast, perfect for joins and foreign keys.

**UUIDv7** is an external identity — globally unique, time-ordered, safe to hand to any client or third-party system.

---

## The One Rule

```
Does this ID ever leave the server?
        │
        ├── Yes → UUIDv7 (publicId, aliased as "id" in responses)
        │
        └── No  → BigInt (foreign keys, internal joins, logs)
```

The boundary is the **API surface** — not the type of caller. Whether the caller is a retail customer, an ERP portal user, or an admin dashboard, they all sit outside the server. They all get UUIDv7.

---

## This Project's Context: Unified ERP + Retail Backend

This backend is both the ERP system and the retail e-commerce server. There is no separate external ERP to integrate with — it is the ERP.

```
                    ┌─────────────────────────────────┐
                    │         This Backend             │
                    │                                  │
Retail customers ───┤  API boundary                   │
                    │  UUIDv7 in, UUIDv7 out           │
Merchant ERP users ─┤  (same rule for all callers)    ├─── PostgreSQL
                    │                                  │    BigInt for all
Admin ERP users ────┤  Internal: BigInt for all       │    internal work
                    │  joins, queries, logs            │
                    │                                  │
Third-party ────────┤  Stripe, shipping, accounting   │
integrations        │  → UUIDv7 only                  │
                    └─────────────────────────────────┘
```

Since it's one unified system with one database, there is no cross-DB ID conflict problem. The BigInt vs UUIDv7 split is purely about the internal vs external boundary.

---

## Entity Classification

| Entity | BigInt PK | UUIDv7 publicId | Reason |
|---|---|---|---|
| `User` | ✓ | ✓ | External identity for all caller types |
| `Product` | ✓ | ✓ | Referenced by frontend, ERP, payment gateways |
| `Order` | ✓ | ✓ | Referenced by shipping, payment, ERP workflows |
| `Address` | ✓ | ✓ | Referenced by orders across API calls |
| `Category` | ✓ | ✓ | Synced via ERP/merchant portal |
| `Review` | ✓ | ✓ | Externally visible, potentially referenced by CRM |
| `OrderItem` | ✓ | Not needed | Always accessed through its parent Order |
| `CartItem` | ✓ | Not needed | Ephemeral; scoped to a session; never cross-system |
| `Inventory` | ✓ | Not needed | Accessed via Product; ERP references the product |

---

## The Request Flow

Every inbound request with a public ID goes through a one-step translation:

```
Client sends UUID
      │
      │  WHERE "publicId" = $uuid   ← one indexed lookup (publicId is @unique)
      ▼
Handler gets internal BigInt
      │
      │  All joins, subqueries, FK lookups use BigInt
      ▼
Response builder
      │
      │  SELECT publicId as id      ← BigInt never included in output
      ▼
Client receives UUID as "id"
```

The `@unique` constraint on every `publicId` column automatically creates a B-tree index, so the lookup is fast and does not require a sequential scan.

---

## Response Key Naming

Never return a key named `publicId` in an API response. The word itself reveals that you have two ID systems — an internal one and a public one. Always alias it:

```typescript
// Wrong — leaks internal architecture
.returning(['publicId', 'email', 'name'])
// → { publicId: "019612ab-...", email: "...", name: "..." }

// Correct — opaque to the caller
.returning(['publicId as id', 'email', 'name'])
// → { id: "019612ab-...", email: "...", name: "..." }
```

Similarly, never return the raw internal BigInt `id` column in a response for any entity that has a `publicId`.

---

## Logging

| Log destination | Use |
|---|---|
| Internal DB / slow query logs | BigInt — fast correlation back to the row |
| Application logs (request traces) | Log both — BigInt for DB correlation, UUID for cross-request tracing |
| Logs shipped externally (SIEM, compliance, accounting) | UUID only — external systems have no concept of your internal BigInt |

Ideal application log line:
```
orderId=84729 orderPublicId=019612ab-... userId=312 action=cancel
```

---

## Key Takeaways

| Concept | Rule |
|---|---|
| BigInt | Internal only — joins, FKs, queries |
| UUIDv7 | External only — API responses, webhooks, third-party integrations |
| API boundary | The dividing line — applies equally to retail, ERP, and admin callers |
| Response key | Always alias `publicId` as `id` — never expose the word `publicId` |
| Unified backend | No cross-DB sync concern — one DB means BigInt conflicts are impossible |
| Ephemeral entities | CartItem, OrderItem, Inventory — BigInt only, accessed via parent |
