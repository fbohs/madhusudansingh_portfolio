# Authentication: Basic Auth, Bearer Tokens & JWTs

> **Authentication answers "Who are you?"** — not to be confused with Authorization ("What can you do?"). This covers the three foundational HTTP auth mechanisms and exactly when to reach for each.

---

## The Core Problem: HTTP is Stateless

```
HTTP is like a drive-thru window.

  You order → they hand you food → window closes.
  Next car? Clean slate. They don't remember you. By design.

  This means you must prove who you are on EVERY request.
  Authentication mechanisms are how you solve this.
```

---

## The Three Mechanisms at a Glance

```mermaid
mindmap
  root((HTTP Auth))
    Basic Auth
      Username + Password
      Base64 encoded
      Sent every request
      NOT encryption
      HTTPS mandatory
      Internal tools only
    Bearer Token Opaque
      Credentials sent once
      Server returns random token
      Token stored in DB
      DB lookup every request
      Easy to revoke
      Needs shared session store to scale
    JWT
      Self-contained token
      Header + Payload + Signature
      No DB lookup on verify
      Stateless scales horizontally
      Hard to revoke
      Payload is readable by anyone
      Short-lived + refresh token pattern
```

---

## Basic Authentication

> The simplest scheme — username and password encoded and sent with every request.

### How It Works

```
Step 1 — Client encodes credentials:
  username = "madhu"
  password = "secret123"
  combined = "madhu:secret123"
  base64   = "bWFkaHU6c2VjcmV0MTIz"

Step 2 — Sent with every request:
  GET /api/profile HTTP/1.1
  Authorization: Basic bWFkaHU6c2VjcmV0MTIz

Step 3 — Server decodes and validates:
  base64_decode("bWFkaHU6c2VjcmV0MTIz") → "madhu:secret123"
  Check against user store → ✅ or ❌
```

### Base64 is NOT Encryption

!!! warning "Critical Misunderstanding"
    Base64 is **encoding**, not encryption. It's reversible by anyone in milliseconds.
    It exists only to make binary-safe characters for HTTP headers — not for security.

```
"madhu:secret123"  ──Base64──▶  "bWFkaHU6c2VjcmV0MTIz"
                   ◀──Decode──  (trivially reversible)

Sending Basic Auth over plain HTTP = broadcasting your password in cleartext.
Sending Basic Auth over HTTPS = fine (TLS encrypts the whole request including headers).
```

### Pros & Cons

| ✅ Pros | ❌ Cons |
|---------|---------|
| Dead simple to implement | Credentials sent on every single request |
| Every HTTP client supports it | Many opportunities to be intercepted or logged |
| No token management needed | Credentials may end up in server logs, proxy logs, cache |
| | No granular revocation — must change password |
| | Useless without HTTPS |

### When to Use Basic Auth

```
✅ Internal tools — only your team, you control the network
✅ Local development
✅ Simple machine-to-machine communication (you own both ends)
✅ Quick scripts hitting an internal API

❌ Public-facing APIs
❌ Anything where the client is a browser with public access
❌ When you need token revocation
```

---

## Bearer Tokens (Opaque)

> The client sends credentials once, receives a random token, and uses that token for all future requests. The server stores the token and looks it up on every request.

### How It Works

```
Step 1 — Login (once):
  Client ──── POST /auth/login ────────────────────────────▶ Server
              { "email": "madhu@x.com", "password": "..." }
  Client ◀─── 200 OK { "token": "a3f8c2d9e1b7..." } ────── Server
              (server stores token → user mapping in DB)

Step 2 — Every subsequent request:
  Client ──── GET /api/profile ────────────────────────────▶ Server
              Authorization: Bearer a3f8c2d9e1b7...
              (server queries DB: "who owns this token?")
  Client ◀─── 200 OK { ... } ─────────────────────────────── Server
```

### What "Opaque" Means

```
Opaque token:  "a3f8c2d9e1b7f4a2..."
               Just a random string. Contains zero information.
               The server must hit the database to know who it belongs to.

               Client holds the key.
               Database holds the lock.
```

### The Scalability Problem

```
Single server — easy:
  Server ──── checks ────▶ DB (token store)

Multiple servers — problem:
  Server A ──── checks ────▶ ??? (doesn't know about Server B's tokens)
  Server B ──── checks ────▶ ??? (doesn't know about Server A's tokens)

Solution: Shared token store
  All servers ──── check ────▶ Redis / shared DB
                               (centralized session storage)
  Works, but adds infrastructure complexity.
```

### Pros & Cons

| ✅ Pros | ❌ Cons |
|---------|---------|
| Password not sent repeatedly | DB lookup on **every** request |
| Tokens can be revoked instantly (delete from DB) | Needs shared session store for horizontal scaling |
| Can set expiration times | Adds infrastructure (Redis, shared DB) |
| Easier to audit (log token usage) | |

---

## JWT — JSON Web Tokens

> **A JWT is a self-contained token — the server verifies it mathematically without touching a database.** The user's identity lives inside the token itself, signed by the server.

### Structure: Three Parts, Separated by Dots

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJzdWIiOiJ1c2VyXzQyIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzA0MDY3MjAwfQ
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

 ──────────────────────────────  ──────────────────────────────────────────  ──────────────────────────────────────
            Header                              Payload                                  Signature
```

**Part 1 — Header**

```json
{
  "alg": "HS256",   ← signing algorithm
  "typ": "JWT"
}
```

**Part 2 — Payload (Claims)**

```json
{
  "sub":  "user_42",         ← subject (user ID)
  "name": "Madhu",
  "role": "admin",
  "exp":  1704067200,        ← expiration (Unix timestamp)
  "iat":  1704063600         ← issued at
}
```

> Registered claims: `sub`, `exp`, `iat`, `iss` (issuer), `aud` (audience)
> Custom claims: anything you need — `role`, `org_id`, `permissions`, etc.

**Part 3 — Signature**

```
HMAC_SHA256(
  base64url(header) + "." + base64url(payload),
  secret_key
)
→ SflKxwRJSMeKKF2QT4...
```

### Tamperproof ≠ Private

!!! warning "The Most Important JWT Distinction"
    - **The payload is only Base64-encoded — anyone can decode and read it.** Go to [jwt.io](https://jwt.io), paste any JWT, and you'll see the payload immediately.
    - **The signature prevents tampering** — change even one character in the payload and the signature won't match.

```
✅ Tamperproof:   You cannot modify claims without invalidating the signature.
❌ NOT private:   You can read all claims. Never store passwords, SSNs, credit cards.

Safe in JWT payload:   user_id, role, email, permissions
NEVER in JWT payload:  passwords, secrets, PII, credit card numbers
```

### How Verification Works (No DB Hit)

```
Request arrives with JWT:
  Authorization: Bearer eyJ...

Server:
  1. Split into header + payload + signature
  2. Recompute: HMAC_SHA256(header + "." + payload, secret_key)
  3. Does recomputed signature == received signature?
     Yes → token is valid and unmodified ✅
     No  → reject (tampered or wrong key) ❌
  4. Check exp → is it expired?

No database query. Pure math. ~5–10× faster than opaque token lookup.
```

### The Revocation Problem

```
Opaque token revocation: easy
  DELETE token FROM session_store WHERE token = "a3f8c2d9..."
  Done. Instantly invalid. ✅

JWT revocation: hard
  JWT is stateless — server doesn't track it.
  If a JWT is stolen, it remains valid until it expires.
  
  Options (each with trade-offs):
  ┌────────────────────────────┬────────────────────────────────────────────┐
  │ Token blacklist            │ Store revoked JWTs in DB/Redis             │
  │                            │ Defeats the stateless advantage ❌         │
  ├────────────────────────────┼────────────────────────────────────────────┤
  │ Short expiry               │ Access token valid for 15 min              │
  │ + refresh token rotation   │ Limits window of exposure ✅               │
  ├────────────────────────────┼────────────────────────────────────────────┤
  │ Token versioning           │ Store version on user record               │
  │                            │ JWT valid only if version matches ✅        │
  │                            │ Requires one DB read per request ❌         │
  └────────────────────────────┴────────────────────────────────────────────┘
```

### Access Token + Refresh Token Pattern (The Standard Solution)

```
Access Token:   Short-lived (15 min). JWT. Stateless. Fast.
Refresh Token:  Long-lived (7–30 days). Opaque. Stored in DB. Revocable.

Flow:
  Login
    │
    ▼
  Server → access_token (15min JWT) + refresh_token (30d opaque, stored in DB)
    │
    ▼
  Client uses access_token for API requests (no DB hit) ✅
    │
    ▼ (access_token expires after 15 min)
    │
  Client sends refresh_token to /auth/refresh
    │
    ▼
  Server checks refresh_token in DB → valid? → issue new access_token ✅
    │
    ▼ (logout or token compromise)
    │
  DELETE refresh_token from DB → user is immediately locked out ✅

Result: Performance of JWTs + revocability of opaque tokens.
```

---

## JWT Signing Algorithms

### HS256 — Symmetric (One Shared Secret)

```
Think of it like a house key:
  Same key locks AND unlocks.

HMAC_SHA256(payload, secret_key)  ←── sign
HMAC_SHA256(payload, secret_key)  ←── verify (same key)

✅ Simple, fast
✅ Great when you control everything (one service, one secret)
❌ Every service that needs to VERIFY must also have the secret
❌ Secret must be shared securely across all services
```

### RS256 — Asymmetric (Public/Private Key Pair)

```
Think of it like a mailbox:
  Private key: only you can put mail in   (sign tokens)
  Public key:  anyone can check inside    (verify tokens)

RSA_sign(payload, private_key)        ←── Auth service signs
RSA_verify(payload, public_key)       ←── Any service verifies

✅ Auth service holds private key (never shared)
✅ Other services only need public key to verify
✅ Better for microservices with a central auth service
❌ Slower than HS256
❌ More complex key management
```

### When to Use Which

```
HS256 → Monolith or small app where YOU control all services
         Single secret, simple setup

RS256 → Microservices with a central identity provider (Auth0, Keycloak, your own)
         Multiple services verify tokens from the same issuer
         Public key can be published at /.well-known/jwks.json
```

---

## Security Mistakes (And How to Avoid Them)

### 1 — Always Use HTTPS

!!! danger "No exceptions"
    Basic Auth, Bearer, or JWT — none are secure over plain HTTP.
    HTTPS encrypts the entire request including the `Authorization` header.

```
HTTP  → Authorization header is plaintext → anyone on the network can read it
HTTPS → Entire request is TLS-encrypted   → header is unreadable in transit
```

### 2 — Token Storage: localStorage vs HttpOnly Cookie

```
localStorage:
  ✅ Simple, survives page reload
  ❌ Accessible via JavaScript: document.localStorage.getItem("token")
  ❌ XSS vulnerability — injected script can steal tokens

HttpOnly Cookie:
  ✅ Cannot be accessed by JavaScript at all
  ✅ Automatically sent with every request (same domain)
  ❌ CSRF vulnerability — a malicious site can trigger requests using your cookie

Best practice:
  HttpOnly + Secure + SameSite=Strict (or Lax)
  ↑ blocks JS access  ↑ HTTPS only  ↑ blocks cross-site requests (prevents CSRF)
```

| | `localStorage` | `HttpOnly` Cookie |
|-|----------------|-------------------|
| XSS risk | ❌ High (JS can read it) | ✅ Protected (JS can't touch it) |
| CSRF risk | ✅ Not sent automatically | ❌ Sent on cross-site requests |
| CSRF fix | N/A | `SameSite=Strict` or CSRF token |
| Manual header | Must set `Authorization` header | ✅ Browser attaches automatically |
| **Recommendation** | Avoid for sensitive tokens | ✅ Preferred with `SameSite` |

### 3 — Set Appropriate Expiration Times

```
❌ Bad:  exp = now + 1 year
         A stolen token is valid for a year.

✅ Good: access_token  exp = now + 15 minutes   (short window of exposure)
         refresh_token exp = now + 30 days        (revocable via DB)

The shorter the access token lifetime, the smaller the damage window if stolen.
```

### 4 — Never Roll Your Own Crypto

```
Use established, audited libraries:
  Node.js:  jsonwebtoken, jose
  Python:   PyJWT
  Go:       golang-jwt/jwt
  Java:     java-jwt (Auth0), jjwt

Your custom HMAC implementation probably has timing attack vulnerabilities.
Library implementations use constant-time comparison. Yours likely doesn't.
```

### 5 — Algorithm Confusion Attack

!!! danger "Classic JWT Vulnerability"
    An attacker changes the `alg` field in the header to `"none"` or from `RS256` to `HS256`. Naive implementations skip signature verification entirely or verify with the wrong key.

```
Attacker crafts:
  header:  { "alg": "none" }   ← or changes RS256 → HS256
  payload: { "sub": "admin", "role": "superuser" }
  sig:     ""   (empty — "none" means no signature)

Vulnerable server: "alg is none, skip signature check" → accepts it ❌

Fix:
  Always explicitly whitelist accepted algorithms:

  # Python (PyJWT)
  jwt.decode(token, secret, algorithms=["HS256"])  # only HS256 accepted

  # Node (jsonwebtoken)
  jwt.verify(token, secret, { algorithms: ["HS256"] })

  Never pass algorithms=None or allow the token to dictate the algorithm.
```

---

## Decision Framework

```
Is this an internal tool / local dev / machine-to-machine (you own both sides)?
  Yes → Basic Auth over HTTPS. Simple, zero overengineering.
  No  ↓

Is this a public-facing API?
  → Skip Basic Auth entirely.

Do you need to scale horizontally (multiple API servers)?
  Yes → JWTs. Stateless verification, no shared session store needed.
        Use short-lived access tokens + revocable refresh tokens.
  No  ↓

Is simplicity more important than scaling?
  Yes → Opaque bearer tokens + server-side sessions.
        Easier to revoke, easier to implement, DB lookup is fine at your scale.

Are you building microservices with a central identity provider?
  → JWTs with RS256. Each service verifies independently using public key.
```

```
┌──────────────────────────┬──────────────┬────────────────┬───────────────────────┐
│                          │ Basic Auth   │ Opaque Bearer  │ JWT                   │
├──────────────────────────┼──────────────┼────────────────┼───────────────────────┤
│ Credentials sent how?    │ Every request│ Once (login)   │ Once (login)          │
│ Server state required?   │ No           │ Yes (DB)       │ No                    │
│ DB lookup per request?   │ No           │ ✅ Always      │ ❌ Never              │
│ Revocation               │ Change passwd│ ✅ Instant     │ ❌ Needs workaround   │
│ Horizontal scaling       │ ✅ Easy      │ ❌ Shared store│ ✅ Easy               │
│ Payload readable?        │ ✅ Encoded   │ ❌ Opaque      │ ✅ Anyone can read    │
│ Best for                 │ Internal/dev │ Simple apps    │ Scalable public APIs  │
└──────────────────────────┴──────────────┴────────────────┴───────────────────────┘
```

---

## Quick Reference Cheat Sheet

```
Basic Auth:
  Authorization: Basic base64("user:pass")
  Base64 = encoding, NOT encryption (trivially reversible)
  Only safe over HTTPS. Credentials sent every request.
  Use for: internal tools, local dev only.

Bearer Token (Opaque):
  Authorization: Bearer <random_string>
  Token is meaningless without the server's DB.
  DB lookup every request. Easy to revoke. Needs shared store to scale.

JWT:
  Authorization: Bearer <header.payload.signature>
  Three parts, base64-encoded, dot-separated.
  Payload is READABLE — never store secrets in it.
  Signature is tamperproof — changing payload breaks the signature.
  Stateless — verify with math, no DB. Scales horizontally.
  Hard to revoke — use short expiry + refresh tokens.

Algorithms:
  HS256 → symmetric (same secret signs + verifies) → monolith/simple apps
  RS256 → asymmetric (private signs, public verifies) → microservices/IdP

Security rules:
  1. HTTPS always — no exceptions
  2. HttpOnly + Secure + SameSite cookie > localStorage
  3. Short access token (15m) + long refresh token (30d)
  4. Use a library — never roll your own crypto
  5. Whitelist allowed algorithms — prevent "alg: none" attacks
```
