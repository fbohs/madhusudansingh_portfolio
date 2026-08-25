These terms aren't all the same kind of thing — they sit at different layers of identity and access. Some are credentials, some are token formats, some are protocols, and SSO is more of an architecture. Worth flagging upfront because they're often combined, not chosen between.

| Method | Category | How it works | Typical use |
|---|---|---|---|
| **Simple (Basic) Auth** | Credential scheme | Username + password sent in every request, Base64-encoded in the `Authorization: Basic …` header. Stateless. | Internal tools, quick API access behind HTTPS. Rarely used in public-facing apps today. |
| **Bearer Token** | Credential scheme | An opaque string sent as `Authorization: Bearer …`. "Whoever holds the token gets access." Server looks it up to find the user. | API keys, session-style access to REST APIs. |
| **JWT** | Token *format* | A signed, self-describing token: `header.payload.signature`. The payload carries claims (user id, roles, expiry). Server only has to verify the signature — no DB lookup needed. | Stateless sessions, microservices, often the actual token used inside OAuth 2.0 / SSO. |
| **OAuth 1.0** | Authorization protocol | Delegated access using HMAC-signed requests with nonces and timestamps. Doesn't require HTTPS but is complex to implement. | Mostly obsolete. Twitter's old API was the famous example. |
| **OAuth 2.0** | Authorization framework | Lets a user grant a third-party app limited access to their account *without sharing the password*. Defines several flows (Authorization Code + PKCE, Client Credentials, Device Code…). Returns an access token, usually a bearer or JWT. | "Sign in with Google," third-party API access (Slack, GitHub), mobile/SPA auth. |
| **TOTP** | Second factor | A shared secret + current 30-second time window produces a 6-digit code (RFC 6238). Verified offline by both sides. | 2FA via Google Authenticator, Authy, 1Password. Layers on top of another method — never replaces it. |
| **SSO** | Architectural pattern | One identity provider (IdP) authenticates the user once; multiple apps trust it via a protocol (SAML, OIDC, Kerberos). | Corporate logins (Okta, Azure AD, Google Workspace) where one login opens email, Slack, Jira, etc. |

A few connections that make the picture click:

The list mixes layers. *Bearer* describes how a token is sent. *JWT* is what's often inside a bearer token. *OAuth 2.0* is the protocol that hands out that token. *SSO* is the user-facing experience built on top of OAuth 2.0 / OIDC or SAML. So a single login flow can involve OAuth 2.0 + JWT + Bearer + SSO + TOTP all at once — they stack rather than compete.

OIDC (OpenID Connect) is worth knowing alongside these: it's a thin identity layer on top of OAuth 2.0 that adds an *ID token* (a JWT describing who the user is). OAuth 2.0 alone is about *authorization* ("this app can read your calendar"); OIDC adds *authentication* ("and here's proof of who you are"). Most modern "Sign in with X" buttons are OIDC.

TOTP is the odd one out — it's not a way to log in by itself, it's a second factor you combine with any of the others. If someone steals your password, the 30-second code is what stops them.

OAuth 1.0 vs 2.0 isn't really a choice today. 2.0 won; 1.0 only shows up in legacy systems. The trade-off was simplicity (2.0 relies on HTTPS instead of request signing) for an easier developer experience.