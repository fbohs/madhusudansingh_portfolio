# Miscellaneous — Quick Reference

Click any topic to expand it.

---

??? note "Serialization vs Deserialization"

    > **Serialization** converts an in-memory object into a storable/transmittable format.
    > **Deserialization** is the reverse — reconstructing the object from that format.

    ```
    Object in memory          Serialized form          Object in memory
    ┌───────────────┐         ┌─────────────┐          ┌───────────────┐
    │ User {        │──────▶  │ {"id":1,    │ ──────▶  │ User {        │
    │   id: 1       │ serial  │  "name":    │ deserial │   id: 1       │
    │   name: "M"   │         │  "Madhu"}   │          │   name: "M"   │
    │ }             │         └─────────────┘          │ }             │
    └───────────────┘                                   └───────────────┘
    ```

    **Common Serialization Formats**

    | Format | Type | Human-readable | Speed | Size | Best for |
    |--------|------|---------------|-------|------|----------|
    | JSON | Text | ✅ | Medium | Medium | REST APIs, config |
    | XML | Text | ✅ | Slow | Large | Legacy enterprise, SOAP |
    | YAML | Text | ✅ | Slow | Medium | Config files |
    | CSV | Text | ✅ | Fast | Small | Tabular data |
    | Protocol Buffers | Binary | ❌ | Very fast | Very small | gRPC, microservices |
    | MessagePack | Binary | ❌ | Fast | Small | High-throughput APIs |
    | Avro | Binary | ❌ | Fast | Small | Kafka schemas |

    **Schema Evolution Problem**

    ```
    v1 of your class:    User { id, name }
    v2 of your class:    User { id, name, email }

    Serialized v1 object → deserialize with v2 code
    What is email? → null? error? default value?

    Solutions:
      Protobuf: field numbers — old fields ignored, new ones default
      JSON: missing keys → null or default (flexible but no enforcement)
      Avro: schema stored alongside data — full compatibility rules
    ```

    **Key interview distinction:**

    ```
    Serialization  → object to bytes/string    (write to disk, send over wire)
    Deserialization → bytes/string to object   (read from disk, receive from wire)

    Also called:  marshal / unmarshal  (Go, some other languages)
                  pickle / unpickle   (Python)
                  encode / decode     (general)
    ```

---

??? note "Hashing vs Encryption vs Encoding"

    > Three completely different things that people often confuse. **Encoding is not security. Hashing is one-way. Encryption is two-way.**

    ```
    ┌───────────────┬──────────────┬──────────────┬───────────────────────────┐
    │               │ Reversible?  │ Needs key?   │ Purpose                   │
    ├───────────────┼──────────────┼──────────────┼───────────────────────────┤
    │ Encoding      │ ✅ Always    │ ❌           │ Format / representation   │
    │ Hashing       │ ❌ Never     │ ❌           │ Integrity / fingerprint   │
    │ Encryption    │ ✅ With key  │ ✅           │ Confidentiality / secrecy │
    └───────────────┴──────────────┴──────────────┴───────────────────────────┘
    ```

    **Encoding**

    Transforms data into another representation. No security involved — anyone can reverse it.

    ```
    Base64:   "Hello" → "SGVsbG8="        reverse: "SGVsbG8=" → "Hello"
    URL:      "hello world" → "hello%20world"
    ASCII:    'A' → 65

    Use for:  Sending binary data over text channels (email, JSON)
              URL-safe string representation
    NOT for:  Passwords, secrets — trivially reversible
    ```

    **Hashing**

    One-way mathematical function. Same input always → same output. Cannot go backwards.

    ```
    SHA-256("password123") → "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
    SHA-256("password123") → "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"  (identical)
    SHA-256("password124") → "7f4a9b5e..."  (completely different — avalanche effect)

    bcrypt("password123") → "$2a$10$N9qo8uLOickgx2ZMRZo..."  (includes salt, slow by design)
    ```

    | Algorithm | Use for | Notes |
    |-----------|---------|-------|
    | SHA-256 | File integrity, checksums, digital signatures | Fast — NOT for passwords |
    | SHA-512 | Same as SHA-256, larger output | |
    | MD5 | Legacy checksums only | Broken for security use |
    | bcrypt | **Passwords** | Deliberately slow, built-in salt |
    | Argon2 | **Passwords** (modern) | Winner of Password Hashing Competition |
    | HMAC | Message authentication | Hash + secret key = tamper detection |

    > **Never use SHA-256/MD5 for passwords** — they're too fast, making brute-force trivial. Always use bcrypt, Argon2, or scrypt for password hashing.

    **Encryption**

    Two-way — encrypted data can be decrypted with the right key.

    ```
    Symmetric (one shared key):
      AES-256-GCM("secret message", key) → ciphertext
      AES-256-GCM(ciphertext, same_key)  → "secret message"

      Fast. Problem: how do you securely share the key?

    Asymmetric (public + private key pair):
      Encrypt with public key  → only private key can decrypt
      Sign with private key    → anyone with public key can verify

      RSA, ECDSA, Ed25519
      Used in: TLS handshake, JWT signatures, SSH
    ```

    **The Mental Model**

    ```
    Encoding   → like translating English to French — everyone can translate back
    Hashing    → like a fingerprint — you can't reconstruct the person from it
    Encryption → like a locked box — only the key holder can open it
    ```

---

??? note "Parsing"

    > **Parsing** converts raw text or bytes into a structured data structure your code can work with.

    ```
    Raw input (string/bytes)    →    [Parser]    →    Structured data
    '{"name":"Madhu","age":28}'       JSON              { name: "Madhu", age: 28 }
    "<h1>Hello</h1>"                  HTML              DOM tree
    "SELECT * FROM users"             SQL               AST (Abstract Syntax Tree)
    "2024-01-15"                      Date              Date object
    ```

    **Stages: Lexing → Parsing**

    ```
    Raw text: "x = 1 + 2"

    Stage 1 — Lexer (tokeniser):
      Breaks text into tokens (meaningful units)
      ["x", "=", "1", "+", "2"]
      → ["IDENTIFIER:x", "OPERATOR:=", "NUMBER:1", "OPERATOR:+", "NUMBER:2"]

    Stage 2 — Parser:
      Applies grammar rules to build a tree
          Assignment
          ├── Identifier: x
          └── Addition
              ├── Number: 1
              └── Number: 2
    ```

    **Types of Parsers**

    | Type | Example | Notes |
    |------|---------|-------|
    | JSON parser | `JSON.parse()`, `json.loads()` | Strict format — throws on invalid JSON |
    | HTML parser | BeautifulSoup, DOMParser | Lenient — browsers recover from bad HTML |
    | CSV parser | csv module, Papa Parse | Handle quoting, delimiters, newlines in fields |
    | Regex parser | Custom extraction | Fragile for complex formats — avoid for HTML |
    | Recursive descent | Language compilers | Handwritten, matches grammar rules recursively |

    **Common Parsing Pitfalls**

    ```
    Encoding issues:  file is UTF-8 but parsed as Latin-1 → garbled text
    Escape sequences: "He said \"hello\"" → parser must handle escaped quotes
    Newlines in fields: CSV with commas inside quoted fields
    Streaming vs batch: large files can't fit in memory → need streaming parser
    Malicious input: billion laughs (XML), deeply nested JSON → stack overflow / DoS
    ```

    **Parsing vs Serialization**

    ```
    Serialization → object to string   (you produce the string)
    Parsing       → string to object   (you consume the string)

    They're inverses, but "parsing" usually implies the consuming direction
    and often handling arbitrary/untrusted input with error handling.
    ```

---

??? note "SSL vs TLS vs HTTPS"

    > **SSL is deprecated. TLS is what's actually used today. HTTPS is HTTP transported over TLS.** The term "SSL certificate" is a misnomer that stuck — they're actually TLS certificates.

    **The Timeline**

    ```
    SSL 1.0 (1994)  — Never released publicly (security flaws)
    SSL 2.0 (1995)  — Deprecated 2011
    SSL 3.0 (1996)  — Deprecated 2015 (POODLE attack)
    TLS 1.0 (1999)  — Deprecated 2020
    TLS 1.1 (2006)  — Deprecated 2020
    TLS 1.2 (2008)  — Still widely used ✅
    TLS 1.3 (2018)  — Current standard ✅ (faster handshake, stronger ciphers)
    ```

    ```
    HTTPS = HTTP  +  TLS
            (app    (transport
            layer)   security)

    HTTP  → port 80, unencrypted, data visible to anyone between client and server
    HTTPS → port 443, TLS-encrypted, data unreadable in transit
    ```

    **TLS Handshake (Simplified)**

    ```
    Client                              Server
      │                                  │
      │── ClientHello ─────────────────▶ │  "I support TLS 1.3, here are my cipher suites"
      │                                  │
      │◀─ ServerHello + Certificate ──── │  "Use TLS 1.3 + AES-GCM. Here's my cert."
      │                                  │
      │   [Client verifies cert against  │
      │    trusted CA list]              │
      │                                  │
      │── Key exchange ────────────────▶ │  (Diffie-Hellman — both derive same key)
      │                                  │
      │◀──────── Encrypted from here ───▶│  All further traffic is encrypted
    ```

    **TLS 1.3 vs TLS 1.2**

    | | TLS 1.2 | TLS 1.3 |
    |-|---------|---------|
    | Handshake round trips | 2 RTT | **1 RTT** (faster) |
    | 0-RTT resumption | ❌ | ✅ (reconnect with zero extra latency) |
    | Removed weak ciphers | No | Yes (RC4, DES, SHA-1 gone) |
    | Forward secrecy | Optional | Mandatory |

    **Certificates**

    ```
    A TLS certificate contains:
      - Domain name it's valid for (e.g., *.example.com)
      - Public key of the server
      - Issuer (Certificate Authority — Let's Encrypt, DigiCert, etc.)
      - Expiry date
      - Digital signature from the CA

    The CA's signature lets the browser verify:
      "This cert was issued by a trusted authority for this domain"
      → The server is who it claims to be

    Self-signed cert:  Server signs its own cert — no trusted CA
                       Browser warns: "Your connection is not private"
                       OK for internal/dev, never for production
    ```

    **One-liner summary**

    ```
    SSL     → Old, broken, do not use
    TLS     → The actual protocol securing internet traffic today
    HTTPS   → HTTP + TLS — the encrypted web
    "SSL certificate" → Really a TLS certificate. The name just stuck.
    ```

---

??? note "Authentication vs Authorization"

    > **Authentication (AuthN)** = verifying identity — *who are you?*
    > **Authorization (AuthZ)** = verifying permissions — *what are you allowed to do?*

    ```
    Authentication:           Authorization:
    ─────────────────         ───────────────────────────────
    "I'm Madhu"               "Madhu can read /api/posts"
    Prove it → token          "Madhu cannot DELETE /api/users"
    Identity verified ✅       Permission checked ✅
    ```

    **The Sequence**

    ```
    Request hits server
          │
          ▼
    Is there a valid token/session?  ← Authentication
      No  → 401 Unauthorized  ("Who are you? Please log in")
      Yes ↓
    Does this user have permission?  ← Authorization
      No  → 403 Forbidden     ("I know who you are, but you can't do this")
      Yes ↓
    Handle the request ✅
    ```

    > The HTTP status codes 401 and 403 have misleading names:
    > - **401 Unauthorized** actually means *Unauthenticated* — "I don't know who you are"
    > - **403 Forbidden** actually means *Unauthorized* — "I know you, but you're not allowed"

    **Authentication Methods**

    | Method | How | Notes |
    |--------|-----|-------|
    | Session + Cookie | Server stores session, sends cookie with session ID | Stateful — server holds session |
    | JWT Bearer Token | Self-contained signed token in `Authorization` header | Stateless — server verifies signature |
    | API Key | Static secret in header (`X-API-Key`) | Simple but hard to rotate |
    | OAuth 2.0 | Delegated access — user grants app permission | For third-party access |
    | mTLS | Both client and server present certificates | Strongest — microservices |
    | Passkeys / WebAuthn | Biometric + device-based | Phishing-resistant, passwordless |

    **Authorization Models**

    ```
    RBAC — Role-Based Access Control:
      User has a role → role has permissions
      user → role:admin → can(DELETE /users)
      user → role:viewer → cannot(DELETE /users)
      Simple, widely used

    ABAC — Attribute-Based Access Control:
      Permissions based on attributes of user, resource, environment
      "User in department=engineering AND resource.owner=user AND time<18:00"
      Flexible but complex

    ReBAC — Relationship-Based Access Control:
      Permissions based on relationships in a graph
      "User can edit document if user is owner OR user is in editors list"
      Google Zanzibar model — used by Google Drive, GitHub
    ```

    **JWT Deep Dive**

    ```
    Header.Payload.Signature

    Payload (base64 decoded — NOT encrypted, anyone can read):
    {
      "sub": "user_42",          ← subject (user ID)
      "role": "admin",
      "exp": 1704067200,         ← expiry (Unix timestamp)
      "iat": 1704063600          ← issued at
    }

    Server verifies: HMAC_SHA256(header + "." + payload, secret) == signature
    If yes → token is valid and unmodified
    Check exp → is it expired?
    Check role → is user authorized for this endpoint?
    ```

---

??? note "Kafka vs Redis vs RabbitMQ vs AMQP"

    > **AMQP is a protocol. RabbitMQ implements it. Kafka and Redis are different tools solving overlapping but distinct problems.**

    **At a Glance**

    ```
    ┌─────────────────┬────────────────────────────────────────────────────────┐
    │ Kafka           │ Distributed commit log / event streaming platform      │
    │                 │ High throughput, durable, replayable, partitioned      │
    ├─────────────────┼────────────────────────────────────────────────────────┤
    │ RabbitMQ        │ Traditional message broker (implements AMQP)           │
    │                 │ Complex routing, push-based, messages deleted on ACK   │
    ├─────────────────┼────────────────────────────────────────────────────────┤
    │ Redis (Pub/Sub) │ In-memory pub/sub — fire and forget, no persistence    │
    │ Redis Streams   │ Persistent log in Redis, lighter-weight Kafka          │
    ├─────────────────┼────────────────────────────────────────────────────────┤
    │ AMQP            │ Protocol (not a product) — like HTTP is to web servers │
    │                 │ RabbitMQ, ActiveMQ, Azure Service Bus implement it     │
    └─────────────────┴────────────────────────────────────────────────────────┘
    ```

    **Feature Comparison**

    | Feature | Kafka | RabbitMQ | Redis Pub/Sub | Redis Streams |
    |---------|-------|----------|---------------|---------------|
    | Persistence | ✅ Disk | ✅ Optional | ❌ In-memory | ✅ In-memory + RDB |
    | Message replay | ✅ Retention window | ❌ | ❌ | ✅ |
    | Message ordering | Per-partition | Per-queue | ❌ | Per-stream |
    | Throughput | Very high | Moderate | Very high | High |
    | Routing | Partition key | Exchanges + bindings | Channel name | Stream key |
    | Consumer groups | ✅ | ✅ (competing consumers) | ❌ | ✅ |
    | Protocol | Custom (Kafka protocol) | AMQP | Redis protocol | Redis protocol |
    | Best for | Event streaming, audit log | Task queues, complex routing | Real-time pub/sub (e.g. live updates) | Lightweight event log |

    **AMQP Routing Model (RabbitMQ)**

    ```
    Producer → Exchange → (routing rules) → Queue → Consumer

    Exchange types:
      Direct:  route by exact routing key
      Fanout:  broadcast to ALL bound queues (ignore key)
      Topic:   route by pattern matching  (e.g. "orders.*")
      Headers: route by message headers
    ```

    **When to Use What**

    ```
    Kafka:
      → High throughput event streaming (millions/sec)
      → Need to replay messages / audit trail
      → Multiple independent consumers reading same events
      → Event sourcing, CDC (Change Data Capture)

    RabbitMQ:
      → Task queues with complex routing logic
      → Need push delivery (server pushes to consumer)
      → RPC-style request-reply pattern
      → Already in an AMQP ecosystem

    Redis Pub/Sub:
      → Real-time broadcast (WebSocket presence, live notifications)
      → Loss of messages is acceptable (fire and forget)
      → Ultra-low latency, in-memory only

    Redis Streams:
      → Need Kafka-like semantics but within existing Redis infra
      → Lighter workload, don't need Kafka's operational complexity
    ```

---

??? note "Backpressure & Piggybacking"

    ## Backpressure

    > **Backpressure is a mechanism for a consumer to signal to its upstream producer to slow down** — preventing the consumer from being overwhelmed.

    ```
    Without backpressure:
      Producer (300 msg/s) ──▶ Queue ──▶ Consumer (200 msg/s)
                                │
                                Queue grows 100 msg/s → memory exhausted → crash

    With backpressure:
      Producer (300 msg/s) ──▶ [FULL SIGNAL] ──▶ Producer slows to 200 msg/s
      Consumer (200 msg/s) ←── balanced ─────────────────────────────────────
    ```

    **Backpressure Strategies**

    | Strategy | Mechanism | Trade-off |
    |----------|-----------|-----------|
    | **Reject / error** | Return 429 / error to producer | Simple, producer must handle retry |
    | **Block** | Producer call blocks until consumer ready | Easy but stalls producer thread |
    | **Drop** | Silently discard excess messages | Fast, but data loss — only for non-critical |
    | **Buffer with limit** | Queue up to N messages, then apply one of above | Absorbs short bursts |
    | **Rate limit** | Token bucket / leaky bucket at producer | Smooth, controlled flow |

    **In practice (code side)**

    ```python
    # Async Python — backpressure via bounded queue
    import asyncio

    queue = asyncio.Queue(maxsize=100)  # ← bounded — blocks producer when full

    async def producer():
        for item in data_stream:
            await queue.put(item)    # blocks if queue is full (backpressure!)

    async def consumer():
        while True:
            item = await queue.get()
            await process(item)
            queue.task_done()
    ```

    **Backpressure in Kafka**

    ```
    Kafka doesn't push to consumers — consumers pull.
    This is inherently backpressure-friendly:
      Consumer controls its own rate of consumption.
      If consumer is slow → it just pulls less frequently.
      Queue (partition) grows → that's fine, Kafka handles it durably.

    The problem: if partition grows unboundedly → disk fills up.
    Solution: monitor lag (consumer_lag metric) + autoscale consumers.
    ```

    ---

    ## Piggybacking

    > **Piggybacking attaches acknowledgements (or control data) onto outgoing data packets** going in the opposite direction, rather than sending a separate ACK packet. Saves a round-trip.

    ```
    Without piggybacking:
      A ──── Data ────────────────▶ B
      A ◀─── ACK (separate packet) ─ B   ← extra packet, extra latency

    With piggybacking:
      A ──── Data ────────────────▶ B
      B ──── Data + ACK ──────────▶ A   ← ACK rides along on B's next data packet
    ```

    **Where Piggybacking Appears**

    ```
    TCP:
      TCP delays ACKs by up to 200ms (Delayed ACK) waiting for
      outgoing data to piggyback on. If data arrives, ACK goes with it.

    HTTP/2:
      SETTINGS_ACK, PING_ACK frames are piggybacked on data frames
      where possible.

    Sliding Window Protocols:
      Receiver's window update (flow control) piggybacked on data frame
      heading back to sender.
    ```

    **Piggybacking vs Backpressure**

    ```
    Backpressure:  flow control — slow down the sender
    Piggybacking:  efficiency — combine ACK with data to save packets

    Different problems, different layers.
    Piggybacking is a TCP/data-link optimisation.
    Backpressure is an application/system architecture concern.
    ```

---

??? note "UNIX Socket vs TCP/IP Stack"

    > **Unix domain sockets** communicate between processes on the **same machine** entirely in kernel space — no network stack involved. **TCP/IP** goes through the full network stack, even for loopback (`127.0.0.1`).

    **The Architecture Difference**

    ```
    TCP localhost (127.0.0.1):
      App A → socket syscall
            → TCP layer (segmentation, sequencing)
            → IP layer (routing, headers)
            → Loopback interface (lo)
            → IP layer
            → TCP layer
            → App B
      (full network stack — just never leaves the machine)

    Unix domain socket (/tmp/app.sock):
      App A → socket syscall
            → Kernel buffer (direct memory copy)
            → App B
      (skips TCP/IP entirely)
    ```

    **Performance**

    ```
    Benchmark (rough numbers — vary by system):
      TCP localhost:    ~40–60 μs latency, ~800 MB/s throughput
      Unix socket:      ~20–30 μs latency, ~2 GB/s throughput

    Why faster?
      No TCP headers to construct/parse
      No IP routing decisions
      No checksum calculation (kernel handles integrity itself)
      No port allocation overhead
      Fewer syscalls in some implementations
    ```

    **Feature Comparison**

    | Feature | Unix Socket | TCP localhost |
    |---------|-------------|---------------|
    | Same machine only | ✅ Required | ❌ Can cross machines |
    | Network overhead | ❌ None | ✅ Full stack |
    | Speed | Faster | Slower |
    | File system path | ✅ e.g. `/run/nginx.sock` | ❌ IP:port |
    | Permission control | ✅ File system ACLs | ❌ IP-based only |
    | Works across hosts | ❌ | ✅ |
    | Port required | ❌ | ✅ |

    **Real-World Usage**

    ```
    Nginx → PHP-FPM:    fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    Nginx → Gunicorn:   proxy_pass http://unix:/run/gunicorn.sock;
    PostgreSQL (local): psql connects via /var/run/postgresql/.s.PGSQL.5432
    Redis (local):      redis-cli -s /var/run/redis/redis.sock
    Docker daemon:      /var/run/docker.sock
    ```

    **When to Use Which**

    ```
    Unix socket:
      ✅ Two processes always on the same host
      ✅ Maximum local throughput (e.g. web server ↔ app server)
      ✅ Want file-permission-based access control
      ✅ Containerised app where both services are in same pod

    TCP/IP:
      ✅ Services may be on different machines
      ✅ Microservices across a network
      ✅ Need to switch between local and remote without code changes
      ✅ Easier firewall / load balancer integration
    ```

---

??? note "Redirect vs Webhook"

    > **Redirect** tells the client "go look over there" — the client drives the follow-up.
    > **Webhook** is the server proactively calling your URL when something happens — server drives the notification.

    **Redirect**

    ```
    Client ──── GET /old-page ────────────▶ Server A
    Client ◀─── 301 Location: /new-page ── Server A
    Client ──── GET /new-page ────────────▶ Server A   ← client follows automatically

    The client is the one making the second request.
    The server is passive — it just tells the client where to go.
    ```

    **Common Redirect Use Cases**

    | Code | Type | Example |
    |------|------|---------|
    | `301` | Permanent | Old domain → new domain migration |
    | `302` | Temporary | A/B test, maintenance page |
    | `307` | Temporary (method preserved) | POST redirect keeping method |
    | `308` | Permanent (method preserved) | POST endpoint permanently moved |
    | OAuth | Login flow | After auth, redirect to `?code=xyz` |

    **OAuth Redirect Flow**

    ```
    Your app ──── redirect user to Google OAuth ────▶ Google
    User logs in at Google
    Google ──── redirect back with code ────────────▶ Your app (/callback?code=abc)
    Your app exchanges code for access token (server-to-server, no redirect)
    ```

    ---

    **Webhook**

    ```
    Your server registers: "call https://myapp.com/webhook when payment succeeds"

    [Payment succeeds at Stripe]

    Stripe ──── POST https://myapp.com/webhook ────▶ Your server
    Body: { "event": "payment.succeeded", "amount": 5000, "id": "ch_abc" }

    Your server ──── 200 OK ────────────────────────▶ Stripe

    The external service is the one initiating the call.
    Your server is the passive receiver.
    ```

    **Webhook Best Practices**

    ```
    Verify signatures:
      Stripe sends: Stripe-Signature: t=timestamp,v1=HMAC_SHA256(payload, secret)
      You verify the HMAC before trusting the payload.
      Without this → anyone can POST fake events to your webhook URL.

    Respond immediately (200 OK), process async:
      Webhook caller has a short timeout (~30s).
      If your processing takes longer → queue the job, return 200 right away.

    Idempotency:
      Webhooks may be delivered more than once (retries on network failure).
      Store event IDs → skip if already processed.

    Retry handling:
      If you return 5xx, the sender retries (usually with backoff).
      Design for this — don't double-charge, double-send emails, etc.
    ```

    **Redirect vs Webhook — Side by Side**

    ```
    ┌─────────────────┬────────────────────────────┬────────────────────────────┐
    │                 │ Redirect                   │ Webhook                    │
    ├─────────────────┼────────────────────────────┼────────────────────────────┤
    │ Who initiates   │ Client follows the redirect│ External server calls you  │
    │ Direction       │ Client → Server            │ Server → Your server       │
    │ Trigger         │ HTTP response code         │ Event on the other system  │
    │ Real-time       │ Synchronous                │ Async / event-driven       │
    │ Common use      │ URL changes, OAuth flows   │ Payment events, CI/CD      │
    │                 │ www → non-www              │ triggers, notifications    │
    └─────────────────┴────────────────────────────┴────────────────────────────┘
    ```
