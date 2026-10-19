# Project Context: Email OTP Authentication System

> A single reference document describing what we are building, why each decision was made, and where the project currently stands. Paste it into any new chat or hand it to a teammate to restore full context.

---

## 1. Goal

Build a **passwordless login system** for a web app using **email one-time passwords (OTP)**.

1. The user enters their email.
2. The server emails them a random 6-digit code.
3. The user enters the code.
4. If correct, the server logs them in with a secure session.

**Constraints and motivations**
- No paid SMS OTP service. Email is the delivery channel.
- No passwords to store or leak.
- A learning project covering backend development, DB integration, email automation, API design, and authentication security.

---

## 2. Tech stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | React + Vite | Email form, code form, session check |
| Backend | Node.js + Express | All security logic and the API |
| Database | Supabase (PostgreSQL) | Stores users, OTP hashes, sessions |
| Email | Nodemailer + Gmail SMTP (App Password) | Delivers the OTP (Node equivalent of Python's `smtplib`) |

**Supporting libraries:** `cors`, `helmet`, `cookie-parser`, `express-rate-limit`, `nodemailer`, `@supabase/supabase-js`.

---

## 3. Key security decisions

### 3.1 Generation vs. hashing are different jobs

The original idea was to use SHA-256 to *generate* the OTP. That doesn't work: SHA-256 is deterministic, so if an attacker can guess the inputs (email + timestamp, say), they can predict the code.

| Job | Tool | Why |
|---|---|---|
| **Generate** the OTP | `crypto.randomInt(0, 1_000_000)` padded to 6 digits | CSPRNG, unpredictable, unbiased (rejection sampling) |
| **Store** the OTP | `HMAC-SHA256(OTP_PEPPER, "email:otp")` | A DB leak exposes only hashes, and the server-side secret blocks offline brute force |
| Compare | `crypto.timingSafeEqual` | Constant-time comparison |

**Never use `Math.random()`**: its state can be recovered from a few outputs.

**Randomness source:** Node's `crypto` calls the OS CSPRNG (`getrandom` / `/dev/urandom` / `BCryptGenRandom`), which is seeded from real entropy (interrupt timings, hardware RNG like RDRAND, etc.). That is effectively as good as true randomness for auth.

**Modulo bias trap:** `randomBytes(4).readUInt32BE() % 1000000` is slightly biased. `crypto.randomInt` avoids this.

### 3.2 Weak secret vs. strong secret

| | OTP | Session token |
|---|---|---|
| Entropy | ~20 bits (1M options) | 256 bits (32 random bytes) |
| Guessable? | Yes, so it needs limits | No |
| Protection | Short expiry, 5 attempts, one-time use, rate limits, HMAC + pepper | Hash before storing (plain SHA-256 is enough) |

> **Weak secret → add limits. Strong secret → just protect it.**

### 3.3 Guess odds

With 5 attempts and 1,000,000 possible codes, the chance of guessing one code is 5 / 1,000,000 = **0.0005%**.

### 3.4 Other principles
- **No user enumeration:** `request-otp` returns the same response whether or not the account exists.
- **One generic error** (`INVALID_CODE`) for wrong, expired, consumed, or locked codes.
- **Never log OTPs.** The plaintext code exists only in the email and briefly in server memory.
- **Sessions in an HttpOnly cookie**, not localStorage, so XSS can't steal them.
- **Server-side sessions** (not JWTs), so logins can be revoked instantly by deleting a row.
- **Service role key stays on the backend only.** RLS is enabled on all tables as a safety net.

---

## 4. Login workflow

```
User → [email] → Backend → generate OTP → store HMAC hash → email the OTP
User ← [code input] ←──────────────────────────────────────┘
User → [email + OTP] → Backend → check hash / expiry / attempts
                                   ├─ fail → attempts++ → generic error
                                   └─ pass → consume OTP → create session → set cookie
User → [any request + cookie] → requireAuth → hash cookie → look up session → allow
```

**Step by step**

1. **Request:** `POST /auth/request-otp {email}`
2. **Prepare:** normalize email, check rate limits and the 60s cooldown, invalidate older OTPs, generate with `randomInt`, store HMAC hash with `expires_at = now + 5 min`.
3. **Send:** Nodemailer sends the plain OTP through Gmail SMTP.
4. **Reply:** generic "if the email is valid, a code has been sent".
5. **Verify:** `POST /auth/verify-otp {email, otp}`. Fetch the latest unconsumed OTP, reject if missing, expired, or `attempts >= 5`, then compare hashes in constant time.
6. **Wrong code:** `attempts + 1` (atomically via RPC), generic error.
7. **Correct code:** mark consumed, upsert the user, generate a 32-byte session token, store its SHA-256, set the `sid` cookie.
8. **Stay logged in:** the browser sends the cookie, and `requireAuth` hashes it, looks up the session, and checks expiry. React calls `GET /auth/me` on load.
9. **Logout:** delete the session row, clear the cookie.

---

## 5. Limits

| Limit | Value |
|---|---|
| OTP length | 6 digits |
| OTP lifetime | 5 minutes |
| Wrong attempts per OTP | 5 |
| Request cooldown per email | 60 seconds |
| `request-otp` per IP | 10 per 15 min |
| `verify-otp` per IP | 30 per 15 min |
| Session lifetime | 7 days |
| Session token | 32 random bytes (64 hex chars) |

---

## 6. API summary

Base URL: `/api/v1/auth`. JSON only. Cookie `sid` for auth. Full details are in `API_CONTRACT.md` and `openapi.yaml`.

| Method | Path | Auth | Success |
|---|---|---|---|
| POST | `/request-otp` | no | `200 { message, resendAfter }` |
| POST | `/verify-otp` | no | `200 { user }` + `Set-Cookie: sid` |
| GET | `/me` | cookie | `200 { user }` |
| POST | `/logout` | optional | `204` (idempotent) |
| POST | `/logout-all` | cookie | `204` |

**Error shape:** `{ "error": { "code": "...", "message": "..." } }`

**Error codes:** `INVALID_EMAIL`, `INVALID_INPUT`, `INVALID_CODE`, `UNAUTHENTICATED`, `COOLDOWN`, `RATE_LIMITED`, `SERVER_ERROR`

**Cookie:** `sid=<64 hex>; HttpOnly; Secure (prod); SameSite=Lax; Path=/; Max-Age=604800`

**Frontend requirements:** `fetch(..., { credentials: 'include' })`, and CORS on the server with `origin: FRONTEND_URL, credentials: true`.

---

## 7. Database

Three tables (full SQL in `schema.sql`):

| Table | Key columns |
|---|---|
| `users` | `id uuid`, `email` (unique, lowercase), `created_at` |
| `otps` | `id`, `email`, `otp_hash`, `expires_at`, `attempts`, `consumed`, `created_at` |
| `sessions` | `id`, `user_id → users`, `token_hash` (unique), `expires_at`, `created_at` |

Also included in `schema.sql`:
- Indexes for the latest-OTP lookup, expiry cleanup, and logout-all
- RLS enabled on all tables, with no policies for the anon role
- `increment_otp_attempts(p_id)`: atomic attempt counter (callable only by the service role)
- `cleanup_auth_tables()`: deletes expired OTPs and sessions (schedule with `pg_cron` or a Node cron job)

---

## 8. Environment variables

```env
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...      # backend only, never in the frontend

OTP_PEPPER=...                     # long random string, e.g. crypto.randomBytes(32).toString('hex')

GMAIL_USER=yourapp@gmail.com
GMAIL_APP_PASSWORD=...             # needs 2-Step Verification enabled on the Google account
```

Never commit `.env`. Rotating `OTP_PEPPER` invalidates all pending OTPs (acceptable, since they live 5 minutes).

---

## 9. Deliverables so far

| File | Purpose |
|---|---|
| `PROJECT_CONTEXT.md` | This document |
| `API_CONTRACT.md` | Human-readable API contract |
| `openapi.yaml` | OpenAPI 3.0 spec (load into Swagger UI / Postman) |
| `schema.sql` | Supabase tables, indexes, RLS, RPC and cleanup functions |
| `auth.routes.js` | Express router + `requireAuth` middleware matching the contract |

**One pending code change:** in `auth.routes.js`, replace the read-then-update attempt counter with
`await supabase.rpc('increment_otp_attempts', { p_id: rec.id });`

---

## 10. Suggested project structure

```
project/
├── server/
│   ├── src/
│   │   ├── server.js            # app setup: helmet, cors, json, routes
│   │   ├── routes/auth.routes.js
│   │   ├── lib/                 # (optional) split helpers out of the routes file
│   │   │   ├── otp.js           # generateOtp, hmacOtp, safeEqual
│   │   │   ├── mailer.js
│   │   │   └── supabase.js
│   │   └── middleware/requireAuth.js
│   ├── .env
│   └── package.json             # "type": "module"
├── web/                         # React + Vite
│   └── src/
│       ├── api.js               # fetch wrapper with credentials: 'include'
│       ├── AuthContext.jsx      # calls /auth/me on load
│       └── pages/Login.jsx      # email step → code step
└── db/schema.sql
```

---

## 11. Frontend plan (not built yet)

- **State:** `step = 'email' | 'otp'`, plus `user` loaded from `GET /auth/me` on startup.
- **Email step:** posts to `/request-otp`, then switches to the code step and starts a 60s resend countdown (use `resendAfter`).
- **Code step:** `<input inputMode="numeric" autoComplete="one-time-code" maxLength={6}>`, posts to `/verify-otp`, and shows the generic error on `INVALID_CODE`.
- **Resend:** disabled until the timer ends. On `429 COOLDOWN`, read `Retry-After`.
- **Logout button:** `POST /auth/logout`, then reset state.
- **Vite dev:** either proxy `/api` to the backend, or keep CORS with credentials.

---

## 12. Gmail SMTP caveats

- Requires 2-Step Verification and an App Password (not your normal password).
- Personal accounts cap around **500 emails/day**. This is fine for learning.
- Emails may land in spam. A custom domain with SPF/DKIM helps later.
- For production, switch to Resend, SES, or Postmark. Only the `transporter` changes.

---

## 13. Hardening checklist

- [x] CSPRNG OTP generation
- [x] HMAC-hashed OTP storage with pepper
- [x] Constant-time comparison
- [x] 5-minute expiry, 5 attempts, one-time use
- [x] Per-email cooldown + per-IP rate limits
- [x] Generic responses (no enumeration)
- [x] HttpOnly + SameSite cookie, hashed server-side session
- [x] RLS enabled, service role key kept server-side
- [ ] Switch attempt counter to `increment_otp_attempts` RPC
- [ ] Schedule `cleanup_auth_tables()`
- [ ] HTTPS everywhere in production (`secure` cookie flag depends on it)
- [ ] CSRF token if the frontend is ever hosted on a different site than the API
- [ ] Move off Gmail SMTP for production
- [ ] Add SPF/DKIM on a custom domain
- [ ] Tests: expiry, attempt lockout, double-use race, cooldown
- [ ] Optional: per-email verify throttling (not just per-IP), account/session audit log

---

## 14. Build order

1. Create Supabase project and run `schema.sql`
2. Express skeleton + `.env`
3. Nodemailer sends a test email
4. Wire in `auth.routes.js` and test with Postman using `openapi.yaml`
5. React UI (email step, code step, auth context)
6. Rate limit tuning, cleanup job, hardening checklist
7. Deploy (HTTPS, production env vars, production email provider)

---

## 15. Explaining it to a non-developer (hotel analogy)

You walk up to a hotel desk and say your email. The desk generates a random 6-digit code by "rolling dice" (not by following a pattern) and mails it to you. They write only a scrambled version of the code in their logbook. You read the code from your inbox and tell it to the desk, who scrambles what you said and compares it with the logbook. If it matches, you get a key card (the session) that lasts 7 days.

| Rule | Hotel version |
|---|---|
| Random code | Dice, not a pattern |
| Scrambled storage | Logbook only has scrambled codes |
| 5-minute expiry | Code stops working after 5 minutes |
| 5 attempts | Code cancelled after 5 wrong guesses |
| One-time use | Code torn up once it works |
| 60s cooldown | Desk won't print a new code every second |
| Generic reply | Desk never says "we don't know that email" |

The 6-digit code is **easy to guess**, so it gets strict limits. The key card is **impossible to guess**, so the hotel just keeps a scrambled copy and can cancel it any time (logout).

---

## 16. Glossary

| Term | Meaning |
|---|---|
| **OTP** | One-time password: a short-lived code used once |
| **CSPRNG** | Cryptographically secure pseudo-random number generator |
| **HMAC** | Keyed hash: a hash that needs a secret key to compute |
| **Pepper** | A server-side secret mixed into hashes (kept out of the DB) |
| **Session** | Server-side record proving a browser is logged in |
| **HttpOnly cookie** | Cookie that JavaScript cannot read (protects against XSS theft) |
| **SameSite** | Cookie flag limiting cross-site sending (CSRF defense) |
| **RLS** | Row Level Security: Postgres access rules per row |
| **User enumeration** | Learning which emails have accounts from differing responses |
| **Rejection sampling** | Discarding out-of-range random values to avoid bias |

---

## 17. Current status

- ✅ Architecture and security design finished
- ✅ API contract (Markdown + OpenAPI)
- ✅ Database schema
- ✅ Backend route skeleton
- ⬜ React frontend
- ⬜ Local end-to-end test
- ⬜ Hardening and deployment

**Next step:** build the React login components, or set up Supabase and send the first test email.