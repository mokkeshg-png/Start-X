# Start-X Backend API Documentation

## Base URL

```
http://localhost:5000/api
```

---

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error

```json
{
  "success": false,
  "message": "Human-readable error description",
  "error": "Technical error detail (development only)"
}
```

### Validation Error (422)

```json
{
  "success": false,
  "message": "Validation Error",
  "error": "Invalid request body",
  "details": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

---

## Error Codes

| Status | Meaning              | When                                         |
|--------|----------------------|----------------------------------------------|
| 400    | Bad Request          | Malformed request, invalid parameters         |
| 401    | Unauthorized         | Missing/invalid/expired token                 |
| 403    | Forbidden            | Valid token but insufficient role              |
| 404    | Not Found            | Route or resource does not exist              |
| 409    | Conflict             | Duplicate resource (e.g. email already taken) |
| 422    | Validation Error     | Zod schema validation failed                 |
| 429    | Too Many Requests    | Rate limit exceeded                          |
| 500    | Internal Server Error| Unexpected server failure                    |
| 501    | Not Implemented      | Module not yet built                         |
| 503    | Service Unavailable  | Supabase or external service not configured   |

---

## Authentication

All protected endpoints require an `Authorization` header:

```
Authorization: Bearer <supabase_access_token>
```

Tokens are issued by the `/auth/login` and `/auth/signup` endpoints.

---

## Health Endpoints

### `GET /api/health`

Unversioned health check.

**Response:** `200`

```json
{
  "status": "ok",
  "service": "Start-X Backend"
}
```

---

### `GET /api/v1/health`

Versioned health check.

**Response:** `200`

```json
{
  "status": "ok",
  "service": "Start-X Backend",
  "version": "v1"
}
```

---

### `GET /api/v1/database/health`

Tests the live Supabase connection.

**Response (connected):** `200`

```json
{
  "status": "connected",
  "database": "supabase"
}
```

**Response (disconnected):** `503`

```json
{
  "status": "disconnected",
  "database": "supabase"
}
```

---

### `GET /api/v1/system/info`

Returns safe system metadata.

**Response:** `200`

```json
{
  "success": true,
  "data": {
    "service": "Start-X Backend",
    "version": "1.0.0",
    "environment": "development"
  }
}
```

---

## Authentication Endpoints

### `POST /api/v1/auth/signup`

Register a new user via Supabase Auth.

**Rate limit:** 20 requests / 15 min

**Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "Jane Doe"
}
```

| Field      | Type   | Required | Rules                          |
|------------|--------|----------|--------------------------------|
| email      | string | ✅       | Valid email, max 255 chars     |
| password   | string | ✅       | 8–128 characters               |
| fullName   | string | ✅       | 1–100 characters               |

**Response:** `201`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "Jane Doe",
      "emailConfirmedAt": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "session": {
      "accessToken": "eyJ...",
      "refreshToken": "abc123...",
      "tokenType": "bearer",
      "expiresIn": 3600,
      "expiresAt": 1700000000
    }
  },
  "message": "Signup successful"
}
```

**Errors:** `400`, `409` (email exists), `422` (validation), `503` (Supabase not configured)

---

### `POST /api/v1/auth/login`

Authenticate with email and password.

**Rate limit:** 20 requests / 15 min

**Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200` (same structure as signup)

**Errors:** `401` (invalid credentials), `422`, `503`

---

### `POST /api/v1/auth/logout`

Log out the current user.

**Auth:** Required (Bearer token)

**Body:** None

**Response:** `200`

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

**Errors:** `401`

---

### `POST /api/v1/auth/refresh`

Refresh an expired access token.

**Rate limit:** 20 requests / 15 min

**Body:**

```json
{
  "refreshToken": "abc123..."
}
```

**Response:** `200` (same user + session structure as login)

**Errors:** `401` (invalid/expired refresh token), `422`, `503`

---

### `GET /api/v1/auth/me`

Get the currently authenticated user.

**Auth:** Required (Bearer token)

**Response:** `200`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "Jane Doe",
      "emailConfirmedAt": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Errors:** `401`

---

## Future Module Endpoints

The following modules are registered but return `501 Not Implemented` until their database schemas are created:

| Prefix                      | Module            |
|-----------------------------|-------------------|
| `/api/v1/users`             | Users             |
| `/api/v1/students`          | Students          |
| `/api/v1/staff`             | Staff             |
| `/api/v1/teams`             | Teams             |
| `/api/v1/discussions`       | Discussions       |
| `/api/v1/contributions`     | Contributions     |
| `/api/v1/knowledge`         | Knowledge         |
| `/api/v1/documents`         | Documents         |
| `/api/v1/tasks`             | Tasks             |
| `/api/v1/insights`          | AI Insights       |
| `/api/v1/gaps`              | Collaboration Gaps|
| `/api/v1/collaboration`     | Collaboration     |
| `/api/v1/notifications`     | Notifications     |

**Response for all unimplemented endpoints:** `501`

```json
{
  "success": false,
  "message": "Not Implemented",
  "error": "<Module> module is not yet implemented"
}
```

---

## Role System

Roles supported (prepared in middleware, not yet connected to database):

| Role          | Description                  |
|---------------|------------------------------|
| SUPER_ADMIN   | Full platform access         |
| STAFF         | Faculty / staff access       |
| STUDENT       | Student access               |
| TEAM_LEADER   | Team leadership privileges   |
| TEAM_MEMBER   | Team member access           |

Protected endpoints will use:

```
requireAuth          — Verify JWT token
requireRole(ROLE)    — Verify user has the specified role
```

---

## Rate Limits

| Scope       | Limit               | Applies To                 |
|-------------|----------------------|---------------------------|
| General     | 200 req / 15 min     | All endpoints              |
| Auth        | 20 req / 15 min      | `/api/v1/auth/*`           |
| Strict      | 5 req / 15 min       | Sensitive operations       |

Exceeding the limit returns `429`:

```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```
