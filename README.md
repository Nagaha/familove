# Familove BE

Familove is a Node.js REST API for tracking the daily meal status (breakfast, lunch, dinner) of your family members.

This branch adds a complete JWT-based authentication flow (registration, login, refresh-token rotation, logout) plus current-user profile endpoints.

## Tech Stack

- **Node.js** (ES Modules) + **Express** 5
- **MongoDB** via **Mongoose** (single shared connection)
- **jsonwebtoken** for access tokens
- **bcryptjs** for password hashing
- **Zod** for request validation
- **cookie-parser**, **cors**, **dotenv**
- **cookie-parser**, **cors**, **dotenv**

## Project Structure

```
Familove-be/
├── app.js                                # Express app entry point, mounts routers
├── config.js/
│   ├── env.js                            # Centralized + validated environment config
│   ├── mongoose.js                       # Single shared Mongoose connection
│   ├── database.js                       # Legacy collection helper (reuses Mongoose)
│   └── rabbitMQ.js                       # Optional message broker connection
├── modules/
│   ├── auth/
│   │   ├── auth.routers.js               # /api/v1/auth routes
│   │   ├── auth.controller.js            # HTTP request/response handling
│   │   ├── auth.service.js               # Auth business logic / token sessions
│   │   ├── auth.validation.js            # Zod schemas (register/login)
│   │   └── refresh-session.model.js      # Refresh-token session model
│   └── user/
│       ├── user.model.js                 # Mongoose User model
│       ├── user.routes.js                # /api/v1/users routes
│       ├── user.controller.js            # HTTP request/response handling
│       ├── user.service.js               # Profile business logic
│       └── user.validation.js            # Zod schema (profile update)
├── middleware/
│   ├── authenticate.js                   # Bearer access-token verification
│   ├── validate.js                       # Zod validation middleware
│   ├── csrf.js                           # Double-submit cookie CSRF (optional; only enforced for cookie-based refresh)
│   └── errorHandler.js                   # notFound + centralized error handler
├── utils/
│   ├── errors.js                         # ApiError
│   ├── asyncHandler.js                   # async route wrapper
│   ├── password.js                       # bcrypt hash/verify
│   ├── tokens.js                         # JWT sign/verify + secure random/hash
│   ├── cookies.js                        # Cookie options + helpers
│   └── duration.js                       # Duration string parser
├── controller/                           # (existing) family/meal/user/notification logic
└── router/                               # (existing) family/meal/user routers
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values. `.env` is git-ignored.

| Variable | Purpose | Default |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string (falls back to `CONNECTION_STRING`) | — |
| `DB_NAME` | Database name | `familoveDB` |
| `USER_COLLECTION_NAME` | Existing user collection name | `userCollection` |
| `PORT` | HTTP port | `3000` |
| `NODE_ENV` | `development` / `production` | `development` |
| `CLIENT_ORIGINS` | Comma-separated allowed browser origins | (reflect request origin) |
| `JWT_ACCESS_SECRET` | Access-token signing secret (required) | — |
| `JWT_ACCESS_EXPIRES_IN` | Access-token lifetime | `15m` |
| `JWT_ISSUER` | JWT `iss` claim | `familove` |
| `JWT_AUDIENCE` | JWT `aud` claim | `familove-client` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh-session lifetime | `7d` |
| `BCRYPT_SALT_ROUNDS` | bcrypt work factor | `12` |
| `REFRESH_COOKIE_NAME` | Browser refresh cookie name | `refreshToken` |
| `CSRF_COOKIE_NAME` | CSRF cookie name | `csrfToken` |
| `COOKIE_SECURE` | Force `Secure` cookies | `true` in production |
| `COOKIE_SAME_SITE` | Cookie `SameSite` policy | `lax` |
| `COOKIE_DOMAIN` | Cookie domain | (unset) |

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Getting Started

```bash
npm install
npm start
```

The server starts at `http://localhost:3000` (or `PORT`). The MongoDB connection is established before the server begins accepting requests. RabbitMQ is optional; the server starts even if it is unavailable.

## Authentication Flow

### Registration — `POST /api/v1/auth/register`

```json
{ "name": "Harish", "email": "harish@example.com", "password": "StrongPassword123!" }
```

1. Body is validated with a strict Zod schema — unexpected fields are rejected.
2. Email is trimmed and lowercased.
3. Password must be at least 8 characters and at most 72 bytes (bcrypt's limit).
4. Existing email → `409`; invalid input → `400`.
5. Password is hashed with bcrypt (`BCRYPT_SALT_ROUNDS`).
6. Returns `201` with the sanitized profile. The user is **not** logged in automatically.

Concurrent duplicate registrations are handled by the unique email index (`E11000` → `409`).

### Login — `POST /api/v1/auth/login`

```json
{ "email": "harish@example.com", "password": "StrongPassword123!" }
```

1. Email normalized, user loaded with `passwordHash`.
2. Password verified with bcrypt; unknown email compares against a dummy hash to keep timing constant.
3. Invalid credentials → generic `401 { "error": "Invalid email or password" }` (never reveals whether the email exists).
4. Inactive account → `403`.
5. Access JWT issued (15 min, subject = user `_id`).
6. A refresh session is created; the raw refresh token is returned only via the chosen transport.

### Refresh — `POST /api/v1/auth/refresh`

1. Refresh token read from the HttpOnly cookie (browser) or the request body (mobile). For cookie-based requests, CSRF protection is applied only if a cookie is present.
2. Its SHA-256 hash is looked up server-side.
3. Revoked → **reuse detected**; the whole token family is revoked and `401` is returned.
4. Expired → `401` (expiry/revocation are always checked explicitly).
5. On success the token is **rotated**: a new session is created and the old one is revoked atomically.
6. A new access token (and rotated refresh token) is returned.

### Logout — `POST /api/v1/auth/logout`

Revokes the current refresh session, clears the browser cookies, and returns `200`. Safe to call repeatedly.

### Logout all — `POST /api/v1/auth/logout-all`

Requires a valid access token. Revokes all refresh sessions for the authenticated user and returns `200`.

> **Note:** Already-issued access tokens remain valid until they expire (15 min). There is no access-token denylist; add one (e.g. Redis) if immediate access-token revocation is required.

## Refresh-Token Transport

### Browser clients

- Refresh token is delivered as an **HttpOnly** cookie (`refreshToken`), scoped to `/api/v1/auth`, `Secure` in production, `SameSite` configured by `COOKIE_SAME_SITE`.
- A JS-readable `csrfToken` cookie is also set. Cookie-based `refresh`/`logout` requests must send the matching `X-CSRF-Token` header (double-submit CSRF protection).
- Do **not** store refresh tokens in `localStorage`.

### Mobile clients

- Send `X-Client-Platform: mobile` on login/refresh. The refresh token is then returned in the JSON body (`data.refreshToken`) and no cookie is set; CSRF is not required.
- Store the refresh token in platform-secure storage (iOS Keychain, Android Keystore/EncryptedSharedPreferences) and send it back in the request body as `refreshToken`.

## Endpoints

### Auth — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/register` | No | Register a new user |
| POST | `/login` | No | Authenticate and receive tokens |
| POST | `/refresh` | Refresh token | Rotate refresh token, issue new access token |
| POST | `/logout` | Refresh token | Revoke current session |
| POST | `/logout-all` | Access token | Revoke all sessions for the user |

### Users — `/api/v1/users`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/me` | Access token | Get the current user's profile |
| PATCH | `/me` | Access token | Update `name` and/or `avatarUrl` |

`PATCH /me` accepts only `name` and `avatarUrl`; any other field (`_id`, `email`, `passwordHash`, `isActive`, timestamps, etc.) is rejected with `400`.

Example authenticated request:

```bash
curl http://localhost:3000/api/v1/users/me -H "Authorization: Bearer <accessToken>"
```

### Response shapes

- Success: `{ "success": true, "data": { ... } }`
- Error: `{ "error": "message" }` (plus `details` for validation failures)

## JWT Configuration

- Algorithm: **HS256** (explicitly set for signing and verification).
- Access payload contains only `sub`, `iss`, `aud`, `iat`, `exp` — no passwords, hashes, or personal data.
- Verification validates signature, algorithm, issuer, audience, and expiry.
- Required configuration (`MONGODB_URI`, `JWT_ACCESS_SECRET`) is validated at startup.

## Session Rotation & Reuse Detection

- Refresh tokens are 48 random bytes (base64url); only their SHA-256 hash is stored.
- Each login creates a new **token family** (`sessionId`). Every rotation keeps the same family and creates a new session row.
- Rotating marks the previous session `revokedAt` and links `replacedBy` using an atomic `findOneAndUpdate` guard, preventing concurrent reuse.
- Presenting an already-rotated (revoked) token revokes the entire family.
- Expired sessions are removed by a MongoDB TTL index, but authorization always checks `expiresAt`/`revokedAt` explicitly.

## Security

- Passwords are only ever stored as bcrypt hashes; `passwordHash` has `select: false` and is stripped from JSON.
- Generic login failures avoid email enumeration; unknown-email logins use a dummy bcrypt comparison.
- CORS is restricted to `CLIENT_ORIGINS` with credentials enabled when configured.
- Centralized error handling returns consistent status codes and never exposes stack traces or database internals.
- `.env` is git-ignored; only `.env.example` is committed.

## Existing (pre-auth) Endpoints

The legacy `/user`, `/family`, and `/meal` routes remain available for backward compatibility and now share the same Mongoose connection. See `router/` and `controller/` for details.

## Assumptions & Known Limitations

- No automated tests are included (per project instructions); database-backed behavior (index creation, register/login/refresh round trips) has not been executed against a live cluster.
- The unique email index must be able to build on the existing `userCollection`. Pre-existing documents with duplicate or missing emails will cause index creation to fail.
- Existing user documents created before auth have no `passwordHash`; they remain in the collection but cannot log in until migrated.
- Access tokens cannot be revoked before expiry (no denylist).
- `SameSite=lax` is the default; cross-site browser clients must use `SameSite=none` together with `COOKIE_SECURE=true`.
