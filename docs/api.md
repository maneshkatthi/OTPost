# Email OTP Auth: API Contract

## Conventions

| Item | Value |
|---|---|
| Base URL | `/api/v1/auth` |
| Format | JSON only (`Content-Type: application/json`) |
| Auth | HttpOnly session cookie `sid` (no tokens in JSON bodies) |
| CORS | `origin: FRONTEND_URL`, `credentials: true` |
| Frontend fetch | `credentials: 'include'` on every call |
| Email | Trimmed and lowercased server-side, max 254 chars |
| OTP | Exactly 6 digits, sent as a string (keeps leading zeros) |

**Error shape (all errors):**

```json
{ "error": { "code": "INVALID_CODE", "message": "Invalid or expired code" } }
```

`code` is for the frontend to branch on. `message` is safe to show to the user.

---

## 1. Request an OTP

`POST /auth/request-otp`

**Request**

```json
{ "email": "sam@gmail.com" }
```

**Responses**

| Status | When | Body |
|---|---|---|
| `200` | Valid email format (whether or not an account exists) | `{ "message": "If the email is valid, a code has been sent.", "resendAfter": 60 }` |
| `400` | Malformed email | `{ "error": { "code": "INVALID_EMAIL", ... } }` |
| `429` | 60s per-email cooldown active | `{ "error": { "code": "COOLDOWN", ... } }` + `Retry-After: <seconds>` |
| `429` | Per-IP limit hit (10 per 15 min) | `{ "error": { "code": "RATE_LIMITED", ... } }` |
| `500` | Unexpected server error | `{ "error": { "code": "SERVER_ERROR", ... } }` |

**Side effects:** invalidates older unconsumed OTPs for that email, stores the new HMAC hash with a 5-minute expiry, sends the email.

---

## 2. Verify the OTP

`POST /auth/verify-otp`

**Request**

```json
{ "email": "sam@gmail.com", "otp": "042913" }
```

**Responses**

| Status | When | Body |
|---|---|---|
| `200` | Code correct | `{ "user": { "id": "uuid", "email": "sam@gmail.com" } }` + `Set-Cookie: sid=...` |
| `400` | Wrong, expired, consumed, or locked (**one generic error**) | `{ "error": { "code": "INVALID_CODE", "message": "Invalid or expired code" } }` |
| `400` | Bad input format | `{ "error": { "code": "INVALID_INPUT", ... } }` |
| `429` | Too many verify calls from one IP | `{ "error": { "code": "RATE_LIMITED", ... } }` |
| `500` | Unexpected server error | `{ "error": { "code": "SERVER_ERROR", ... } }` |

**Cookie set on success:**

```
Set-Cookie: sid=<64 hex chars>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```

Wrong, expired, and locked all return the same `400` on purpose, so an attacker learns nothing about which case they hit.

---

## 3. Get the current user

`GET /auth/me`

No body. The cookie is sent automatically.

| Status | When | Body |
|---|---|---|
| `200` | Valid session | `{ "user": { "id": "uuid", "email": "sam@gmail.com" } }` |
| `401` | No cookie, unknown token, or expired session | `{ "error": { "code": "UNAUTHENTICATED", ... } }` |

React calls this on page load to choose between the app and the login screen.

---

## 4. Logout

`POST /auth/logout`

| Status | When | Body |
|---|---|---|
| `204` | Always, even if already logged out (idempotent) | none |

**Side effects:** deletes the session row and clears the cookie (`Set-Cookie: sid=; Max-Age=0`).

---

## 5. Logout everywhere

`POST /auth/logout-all` (requires a session)

| Status | Body |
|---|---|
| `204` | none |
| `401` | `UNAUTHENTICATED` |

Deletes all session rows for the user.

---

## Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `INVALID_EMAIL` | 400 | Email format is bad |
| `INVALID_INPUT` | 400 | Missing or malformed fields |
| `INVALID_CODE` | 400 | Wrong, expired, used, or locked OTP |
| `UNAUTHENTICATED` | 401 | No valid session |
| `COOLDOWN` | 429 | Wait before requesting another code |
| `RATE_LIMITED` | 429 | Too many requests from this IP |
| `SERVER_ERROR` | 500 | Something broke on our side |

## Limits

| Limit | Value |
|---|---|
| OTP length | 6 digits |
| OTP lifetime | 5 minutes |
| Wrong attempts per OTP | 5 |
| Request cooldown per email | 60 seconds |
| `request-otp` per IP | 10 per 15 min |
| `verify-otp` per IP | 30 per 15 min |
| Session lifetime | 7 days |

## Typical frontend sequence

```
1. GET  /auth/me          -> 401  -> show email form
2. POST /auth/request-otp -> 200  -> show code form, start 60s timer
3. POST /auth/verify-otp  -> 200  -> cookie set, go to dashboard
   (400 INVALID_CODE -> show error, let them retry or resend)
4. GET  /auth/me          -> 200  -> logged in on every future load
5. POST /auth/logout      -> 204  -> back to email form
```