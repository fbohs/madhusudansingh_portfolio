# HTTP — HyperText Transfer Protocol

> **The foundation of all web communication.** Everything else (REST, GraphQL, gRPC over HTTP/2, SSE, WebSockets) is built on top of HTTP.

---

## HTTP Request Structure

```
POST /api/users HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Accept: application/json

{
  "name": "Madhu",
  "email": "madhu@example.com"
}

 ▲             ▲               ▲
 │             │               │
Request Line  Headers         Body
```

**Parts of a Request:**

| Part | Example | Notes |
|------|---------|-------|
| Method | `POST` | What action to perform |
| Path | `/api/users` | Resource to act on |
| Version | `HTTP/1.1` | Protocol version |
| Headers | `Content-Type: application/json` | Metadata |
| Body | `{"name": "Madhu"}` | Optional payload |

---

## HTTP Response Structure

```
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/users/42
X-Request-Id: abc-123

{
  "id": 42,
  "name": "Madhu"
}

    ▲          ▲              ▲
    │          │              │
Status Line  Headers        Body
```

---

## HTTP Methods

| Method | Safe? | Idempotent? | Body? | Use For |
|--------|-------|-------------|-------|---------|
| `GET` | ✅ | ✅ | ❌ | Fetch a resource |
| `HEAD` | ✅ | ✅ | ❌ | Fetch headers only (no body) |
| `OPTIONS` | ✅ | ✅ | ❌ | What methods does this endpoint support? |
| `POST` | ❌ | ❌ | ✅ | Create a resource |
| `PUT` | ❌ | ✅ | ✅ | Replace a resource entirely |
| `PATCH` | ❌ | ❌ | ✅ | Partially update a resource |
| `DELETE` | ❌ | ✅ | Optional | Delete a resource |

> **Safe** = doesn't change server state
> **Idempotent** = calling it N times = calling it once (same result)

### The PUT vs PATCH Trap

```
# PUT replaces the ENTIRE resource
PUT /users/1
{ "name": "Madhu", "email": "new@email.com", "role": "admin" }
# Must send ALL fields — missing fields get nulled/removed

# PATCH updates ONLY what you send
PATCH /users/1
{ "email": "new@email.com" }
# Only email changes; name and role stay unchanged
```

---

## Key HTTP Headers

### Request Headers

| Header | Purpose | Example |
|--------|---------|---------|
| `Authorization` | Auth token | `Bearer <token>` |
| `Content-Type` | Body format | `application/json` |
| `Accept` | Desired response format | `application/json` |
| `Cache-Control` | Caching directives | `no-cache` |
| `If-None-Match` | Conditional request (ETag) | `"abc123"` |
| `If-Modified-Since` | Conditional request (date) | `Wed, 01 Jan 2025...` |
| `Origin` | CORS — where request came from | `https://myapp.com` |

### Response Headers

| Header | Purpose | Example |
|--------|---------|---------|
| `Content-Type` | Body format | `application/json` |
| `Location` | Redirect or new resource URL | `/api/users/42` |
| `ETag` | Resource version hash | `"d8e8fca2"` |
| `Cache-Control` | Caching rules | `max-age=3600` |
| `Access-Control-Allow-Origin` | CORS | `*` or `https://myapp.com` |
| `X-Rate-Limit-Remaining` | Rate limit info | `99` |
| `Retry-After` | When to retry (429/503) | `60` |

---

## HTTP Versions

```mermaid
mindmap
  root((HTTP Versions))
    HTTP/1.0
      One connection per request
      No persistent connections
      Very old
    HTTP/1.1
      Persistent connections Keep-Alive
      Pipelining (limited)
      Host header required
      Most common baseline
    HTTP/2
      Multiplexing
        Multiple requests over one connection
      Header Compression HPACK
      Server Push
      Binary protocol not text
      Requires TLS in practice
    HTTP/3
      Built on QUIC not TCP
      UDP-based
      Eliminates head-of-line blocking
      Faster connection setup
      0-RTT reconnect
```

### Head-of-Line Blocking Explained

```
HTTP/1.1 — Blocked!                HTTP/2 — Parallel Streams
─────────────────────              ─────────────────────────
[Req 1] → ████████████ ✅          Stream 1: [██████      ] ✅
[Req 2] → waiting...               Stream 2: [    ████    ] ✅
[Req 3] → waiting...               Stream 3: [      ██████] ✅
          blocked by Req 1         All over ONE TCP connection
```

---

## CORS — Cross-Origin Resource Sharing

> **The problem:** Browsers block JavaScript from calling APIs on a different origin (domain/port/protocol) by default — this is the Same-Origin Policy.

### What counts as a different origin?

```
https://myapp.com  → https://api.myapp.com  ❌ (different subdomain)
https://myapp.com  → http://myapp.com        ❌ (different protocol)
https://myapp.com  → https://myapp.com:3001  ❌ (different port)
https://myapp.com  → https://myapp.com/api   ✅ (same origin)
```

### Preflight Flow (for non-simple requests)

```
Browser                          Server
   │                               │
   │── OPTIONS /api/users ─────────▶│  (Preflight)
   │   Origin: https://myapp.com   │
   │   Access-Control-Request-Method: POST
   │                               │
   │◀─ 204 No Content ─────────────│
   │   Access-Control-Allow-Origin: https://myapp.com
   │   Access-Control-Allow-Methods: GET, POST
   │   Access-Control-Max-Age: 86400
   │                               │
   │── POST /api/users ────────────▶│  (Actual request)
   │◀─ 201 Created ────────────────│
```

> Simple requests (GET/POST with basic headers) skip the preflight. Complex requests (custom headers, PUT, DELETE, JSON body) trigger it.

---

## Caching

### Cache-Control Directives

| Directive | Meaning |
|-----------|---------|
| `no-store` | Never cache this |
| `no-cache` | Cache but always revalidate before use |
| `private` | Only the browser can cache (not CDNs) |
| `public` | CDNs and browsers can cache |
| `max-age=3600` | Cache for 3600 seconds |
| `s-maxage=3600` | CDN-specific max age |
| `must-revalidate` | After expiry, must check server |

### ETag-Based Conditional Requests

```
# First request
GET /api/user/1
→ 200 OK  ETag: "abc123"  (server sends resource + hash)

# Second request (browser sends ETag back)
GET /api/user/1
If-None-Match: "abc123"
→ 304 Not Modified  (resource unchanged — no body sent!)

# If resource changed:
→ 200 OK  ETag: "xyz789"  (new resource + new hash)
```

---

## Cookies vs LocalStorage vs SessionStorage

| Feature | Cookie | LocalStorage | SessionStorage |
|---------|--------|-------------|----------------|
| Sent with requests | ✅ Auto | ❌ Manual | ❌ Manual |
| Expiry | Configurable | Never | Tab close |
| Size | ~4KB | ~5-10MB | ~5-10MB |
| Accessible via JS | ✅ (unless HttpOnly) | ✅ | ✅ |
| HttpOnly flag | ✅ | ❌ | ❌ |
| Secure flag | ✅ | ❌ | ❌ |
| Best for | Auth tokens (secure) | Preferences | Temp data |

> **Security tip:** Always use `HttpOnly` + `Secure` + `SameSite=Strict/Lax` for auth cookies.

---

## Quick Reference

```mermaid
mindmap
  root((HTTP))
    Methods
      GET Safe + Idempotent
      POST Create
      PUT Replace Idempotent
      PATCH Partial Update
      DELETE Remove Idempotent
      HEAD Metadata Only
      OPTIONS CORS Preflight
    Headers
      Request
        Authorization
        Content-Type
        Accept
        Cache-Control
      Response
        Location
        ETag
        Set-Cookie
        Access-Control-Allow-Origin
    Versions
      HTTP 1.1 Keep-Alive
      HTTP 2 Multiplexing
      HTTP 3 QUIC UDP
    Caching
      ETag Conditional Requests
      Cache-Control Directives
      304 Not Modified
    CORS
      Preflight OPTIONS
      Allow-Origin Header
      Simple vs Complex Requests
```

---

> **Interview tip:** Know the difference between `PUT` and `PATCH`, what `idempotent` means, and how CORS works end-to-end. HTTP/2 multiplexing vs HTTP/1.1 head-of-line blocking is also a favorite.
