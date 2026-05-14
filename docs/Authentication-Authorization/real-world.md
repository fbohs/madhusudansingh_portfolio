# Authentication Methods Explained

## 1. **Simple Auth (Basic Authentication)**

The most straightforward approach. The client sends the user's credentials directly with every request.

**How it works:**
- Username and password are combined and encoded in Base64
- Sent in the HTTP header: `Authorization: Basic base64(username:password)`
- Server decodes and validates immediately

**Example:**
```
Authorization: Basic dXNlcjpwYXNzd29yZA==
```

**Pros:** Simple, immediate validation
**Cons:** Credentials exposed on every request, passwords transmitted (requires HTTPS), vulnerable to credential theft

---

## 2. **Bearer Token**

A generic token-based approach where the client uses a token to prove authentication.

**How it works:**
- Client authenticates once and receives a token
- Token is sent in the header: `Authorization: Bearer <token>`
- Server validates the token against stored tokens

**Example:**
```
Authorization: Bearer a1b2c3d4e5f6...
```

**Pros:** Safer than sending passwords repeatedly, tokens can be revoked
**Cons:** Server must validate every token, tokens can be stolen if exposed

---

## 3. **JWT (JSON Web Tokens)**

A self-contained token format that carries encoded information and is cryptographically signed.

**Structure:** Three parts separated by dots: `header.payload.signature`

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.
TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ
```

**How it works:**
- Server creates a JWT containing user data and signs it with a secret key
- Client stores and sends the JWT with requests: `Authorization: Bearer <jwt>`
- Server validates the signature without needing to look up the token in a database

**Pros:** Stateless (no database lookup needed), can work offline, tokens carry user info
**Cons:** Can't revoke tokens easily (they're valid until expiration), larger than simple tokens, secret compromise affects all tokens

---

## 4. **OAuth (OAuth 1.0)**

A protocol for delegated access where a user grants a third-party app permission to access their data without sharing passwords.

**Flow (3-legged):**
1. User clicks "Login with Service X"
2. App redirects to Service X's login page
3. User logs in and grants permission
4. Service X redirects back with credentials
5. App exchanges credentials for an access token
6. App accesses user's resources using the token

**Pros:** User password never shared with third-party app, granular permissions
**Cons:** Complex, requires signing requests, largely replaced by OAuth 2.0

---

## 5. **OAuth 2.0**

A modernized version of OAuth designed to be simpler and more flexible, with different "flows" for different scenarios.

**Common flows:**

**Authorization Code Flow (most common):**
1. User clicks "Login with Service X"
2. App redirects to Service X's authorization endpoint
3. User grants permission
4. Service X redirects back with an authorization code
5. App exchanges code for access token (this happens server-to-server, more secure)
6. App uses access token to access user's resources

**Implicit Flow (older):**
- Token given directly in redirect (less secure, token exposed in URL)
- Rarely used anymore

**Client Credentials Flow:**
- App authenticates directly using its own credentials
- No user involved (for server-to-server communication)

**Resource Owner Password Flow:**
- User provides credentials directly to the app (risky, not recommended)

**Pros:** Simpler than OAuth 1.0, multiple flow options, industry standard, no request signing
**Cons:** Token still vulnerable if exposed, authorization code flow requires secure backend

---

## 6. **OAuth 2.0 with PKCE**

**PKCE** (Proof Key for Code Exchange) is an extension to OAuth 2.0 that adds an extra security layer for apps that can't keep secrets (like mobile apps or SPAs).

**Problem it solves:** 
In the standard authorization code flow, if someone intercepts the authorization code, they could exchange it for a token without needing the app's secret (which mobile apps can't keep secure anyway).

**How PKCE works:**

1. App generates a random string called `code_verifier`
2. App hashes it to create `code_challenge`
3. App redirects user to authorization endpoint with `code_challenge`
4. User grants permission and receives authorization code
5. App exchanges authorization code + original `code_verifier` for token
6. Service verifies that the `code_verifier` matches the `code_challenge` from step 3

**Example:**
```
// Step 1 & 2
code_verifier = random_string()
code_challenge = base64_url(sha256(code_verifier))

// Step 3: Redirect with
?code_challenge=ABC123...&code_challenge_method=S256

// Step 5: Exchange with
POST /token
code=auth_code
code_verifier=original_random_string
```

**Pros:** Prevents authorization code interception, safe for public clients (mobile/SPA), becoming the standard
**Cons:** Slightly more complex to implement

---

## Quick Comparison Table

| Method | Security | Stateless | Best For | Revocable |
|--------|----------|-----------|----------|-----------|
| Basic Auth | ⚠️ Low | No | Legacy systems | Yes |
| Bearer Token | ⭐ Medium | Yes | APIs | Yes |
| JWT | ⭐ Medium | Yes | Microservices, offline | No* |
| OAuth 1.0 | ⭐⭐ High | No | Third-party delegation | Yes |
| OAuth 2.0 | ⭐⭐ High | Depends | Third-party delegation | Yes |
| OAuth 2.0+PKCE | ⭐⭐⭐ High | Depends | Mobile/SPA apps | Yes |

*JWT revocation requires additional mechanisms like token blacklisting

---

## Modern Best Practices

**For web APIs:** OAuth 2.0 + JWT (token stored in refresh tokens)
**For mobile/SPA:** OAuth 2.0 with PKCE
**For internal microservices:** JWT with short expiration
**For user/password login:** OAuth 2.0 authorization code flow with refresh tokens