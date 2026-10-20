<div align="center">

# 📬 OTPost

### Generate · Send · Verify — Free & Unlimited OTPs via SMTP

**A production-ready OTP generation and delivery system powered by Gmail SMTP.**

Built with Node.js + Express · React + Vite · Supabase (PostgreSQL) · Nodemailer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![GitHub](https://img.shields.io/badge/GitHub-maneshkatthi%2FOTPost-181717?logo=github)](https://github.com/maneshkatthi/OTPost)

</div>

---

## 🚀 TL;DR — What is this?

You know those **6-digit verification codes** you get from banks, Instagram, or WhatsApp when you log in? OTPost lets you **send those exact same codes** to any email address — **for free, with no limits** — using just a Gmail account.

That's it. No paid services. No complex setup. Just clone this repo, plug in your Gmail, and you have a working OTP system.

```
You (or your app)  →  OTPost  →  Gmail sends the code  →  User's inbox 📩
```

---

## 🎯 Who is this for?

| You are... | Why you'd want this |
|---|---|
| 🧑‍💻 **A vibe coder** building with AI agents | Drop this into your project and tell your AI agent *"add email OTP login using OTPost"* — it handles the rest |
| 📱 **Building a side project** that needs login | No need to pay for Auth0, Firebase, or Twilio — OTPost gives you OTP auth for $0 |
| 🎓 **A student** learning backend development | See how real-world email delivery, cryptography, and API design actually work |
| 🏗️ **A developer** who wants a starter template | Fork it, customize it, ship it — it's production-ready out of the box |

---

## 🤖 Just Tell Your AI Agent

If you use AI coding tools (Cursor, Copilot, Windsurf, Claude Code, Antigravity, etc.), you don't even need to figure out the code yourself. Just pick your scenario and paste the prompt:

### Scenario 1 — "I already have an app, I just want the OTP logic" (No frontend needed)
> *"Look at `otpost.js` in the repository https://github.com/maneshkatthi/OTPost. It is a single self-contained file with the complete OTP generation and Gmail SMTP sender (no database or Supabase needed). Integrate `otpost.js` into my project using my Gmail credentials."*

### Scenario 2 — "I want to run the whole project to test it out"
> *"Clone https://github.com/maneshkatthi/OTPost and set it up locally for me. Follow the README to install dependencies for both `server/` and `web/`, create the `.env` file, and run both dev servers so I can test OTP login in my browser."*

---

## 📦 How to Use This Repo (Pick What You Need)

You don't have to use everything in this repository! Here is how to take only what fits your project:

```
OTPost/
├── 📄 otpost.js   ← 🌟 ALL-IN-ONE SINGLE FILE (Complete OTP engine, zero database needed!)
├── 📂 server/     ← ⚡ Standalone Express / Vercel Serverless Backend
├── 📂 web/        ← 🎨 Optional React Frontend Demo
└── 📂 db/         ← 🗄️ Optional PostgreSQL schema (only if you want a SQL database)
```

| If your goal is... | What to do |
|---|---|
| **I want the entire OTP backend in 1 file** | Literally just copy **`otpost.js`** into your project! It has crypto generation, Gmail SMTP mailing, attempt tracking, and session verification built in. **Zero database or Supabase required.** |
| **I only want the backend API** | Clone the repo, use the `server/` folder, and **delete `web/`**. Your backend is 100% standalone and works with any frontend (React, Next.js, Flutter, Vue, mobile apps, etc.). |
| **I want a full working demo out-of-the-box** | Run both `server/` and `web/` (see [Quick Start](#-local-development-setup)). |

---

## 🤔 What is OTPost?

OTPost is a **complete OTP (One-Time Password) generation and delivery system** that generates secure 6-digit codes and sends them to any email address via **Gmail SMTP** — completely **free**.

**In plain English:**
- User enters their email → your server generates a random 6-digit code → Gmail delivers it to their inbox → user types the code → they're verified ✅
- The codes **expire in 5 minutes**, can only be used **once**, and are **locked after 5 wrong guesses**
- New users are **automatically registered** on their first successful verification — no signup form needed

**Why it's worth your time:**
- 💰 **$0 cost** — Gmail SMTP is free (500 emails/day personal, 2000/day with Google Workspace)
- ⚡ **Works in minutes** — clone, configure Gmail, run
- 🔒 **Actually secure** — codes are cryptographically generated and never stored in plain text
- 🎨 **Looks good** — comes with a polished React UI with animations, auto-advancing inputs, and paste support
- 🧩 **Plug and play** — use the full app, or just grab the backend API for your own frontend

> **Key idea:** Gmail SMTP with an App Password gives you **unlimited free OTP emails** using just a standard Gmail account. No credit card, no API key purchase, no monthly limits.

---

## 📖 Table of Contents

1. [TL;DR — What is this?](#-tldr--what-is-this)
2. [Who is this for?](#-who-is-this-for)
3. [Just Tell Your AI Agent](#-just-tell-your-ai-agent)
4. [How to Use This Repo (Pick What You Need)](#-how-to-use-this-repo-pick-what-you-need)
5. [What is OTPost?](#-what-is-otpost)
6. [Why Gmail SMTP? (Free & Unlimited)](#-why-gmail-smtp-free--unlimited)
7. [Feature Highlights](#-feature-highlights)
8. [How It Works — The Complete OTP Flow](#-how-it-works--the-complete-otp-flow)
9. [System Architecture](#-system-architecture)
10. [Project Structure](#-project-structure)
11. [Security Deep Dive](#-security-deep-dive)
12. [Database Schema](#-database-schema)
13. [API Reference](#-api-reference)
14. [Gmail SMTP Setup Guide](#-gmail-smtp-setup-guide)
15. [Local Development Setup](#-local-development-setup)
16. [Environment Variables Reference](#-environment-variables-reference)
17. [Deployment Guide](#-deployment-guide)
18. [Tech Stack](#-tech-stack)
19. [Contributing](#-contributing)
20. [License](#-license)

---

## 📨 Why Gmail SMTP? (Free & Unlimited)

**SMTP** (Simple Mail Transfer Protocol) is the standard internet protocol used to **send emails** between servers. It's the same protocol that every email client and service (Gmail, Outlook, Yahoo, etc.) uses under the hood to deliver messages. When OTPost needs to send a 6-digit code to a user's inbox, it connects to Gmail's SMTP server (`smtp.gmail.com`) and hands the email off — Gmail then delivers it to the recipient, just like any normal email.

> 💡 Think of SMTP as the "postal system" for email — it's the universal delivery mechanism that moves your message from the sender's server to the recipient's inbox.

| Method | Cost | Limits | Setup |
|---|---|---|---|
| **Gmail SMTP (this project)** | **Free** | 500 emails/day (personal), 2000/day (Workspace) | One-time App Password setup |
| Twilio SMS | Paid | Per-message cost | Paid account + phone number |
| SendGrid | Free tier limited | 100/day free, then paid | API key + domain verification |
| AWS SES | Paid after free tier | Limited free tier | Complex AWS setup |
| Firebase Auth SMS | Paid after quota | Limited free quota | Firebase project setup |

Gmail SMTP is the **fastest way to get real OTP delivery working** for free:
- ✅ No payment method required
- ✅ No domain verification needed
- ✅ Works immediately after enabling an App Password
- ✅ Reliable delivery with Google's infrastructure
- ✅ HTML-formatted emails with professional styling

> [!TIP]
> **Need higher daily limits?**
> If you feel Gmail's single-account SMTP limit (~500 emails/day) isn't enough for your needs, you can simply ask your coding agent:  
> *"Add a fallback / round-robin rotation with multiple Gmail accounts"*  
> and provide multiple Gmail addresses with their respective App Passwords to easily scale your daily OTP volume for free!

---

## ✨ Feature Highlights

- 📧 **Email Delivery** — OTP codes sent via Gmail SMTP using Nodemailer (no paid SMS service needed)
- 🔐 **HMAC-SHA256 OTP Hashing** — Plaintext codes are never stored anywhere on the server
- ⏱️ **Timing-Attack Resistant** — All comparisons use `crypto.timingSafeEqual` (constant time)
- 🛑 **Rate Limiting** — IP-based limits via `express-rate-limit` prevent flooding
- ⏳ **Per-Email Cooldown** — 60-second cooldown prevents OTP spamming per address
- 🔒 **Attempt Locking** — Maximum 5 incorrect attempts per OTP code
- ♻️ **Single-Use Enforcement** — Atomic database update prevents replay attacks
- 🍪 **HttpOnly Session Cookies** — Sessions stored securely, immune to XSS theft
- 👤 **Auto User Registration** — New users are auto-created on first successful login
- 🚪 **Logout + Logout All Devices** — Full session management from the dashboard
- ⚛️ **Polished React UI** — Auto-advance OTP inputs, clipboard paste, countdown timer, animations

---

## 🔄 How It Works — The Complete OTP Flow

### Step 1 — User Enters Email

The user visits the login page and enters their email address. The React frontend submits it to the backend.

```text
Browser                          Backend (Express)              Database (Supabase)
  |                                     |                               |
  |-- POST /api/v1/auth/request-otp --> |                               |
  |   { email: "user@example.com" }     |                               |
```

### Step 2 — Backend Validates & Generates OTP

The server:
1. **Normalises** the email (trim + lowercase).
2. **Validates** format with a regex (no network call to check if email exists).
3. **Checks cooldown** — queries the database for an OTP created within the last 60 seconds. If found, returns 429.
4. **Invalidates older codes** — marks any unconsumed OTPs for this email as consumed.
5. **Generates a new OTP** using `crypto.randomInt(0, 1_000_000)` — cryptographically secure, no modulo bias.
6. **Hashes the OTP** using `HMAC-SHA256(email:otp, OTP_PEPPER)` and stores only the hash.
7. **Sends the email** via Gmail SMTP through Nodemailer — the plaintext OTP goes only to the inbox, never stored.

```text
Backend                                                    Database
  |-- Invalidate old OTPs for email ----------------------->|
  |-- INSERT { email, otp_hash, expires_at: +5min } ------->|
  |-- Send OTP email via Gmail SMTP (FREE) ---------------> user's inbox
  |
  |<-- Returns 200: { message: "...", resendAfter: 60 }
```

> **Key point:** The OTP plaintext **only ever exists in two places**: the server's memory (milliseconds) and the user's email inbox. The database stores only an HMAC hash — even a full database breach leaks nothing.

### Step 3 — User Enters the 6-Digit Code

The React OTP input shows 6 individual digit boxes. The user types or pastes their code. When all 6 boxes are filled, verification is **automatically triggered**.

### Step 4 — Backend Verifies the Code

```text
Browser                          Backend                        Database
  |                                 |                               |
  |-- POST /verify-otp -----------> |                               |
  |   { email, otp: "123456" }      |                               |
  |                                 |-- SELECT latest OTP --------> |
  |                                 |<-- OTP record (hash, expiry) --|
  |                                 |                               |
  |                                 | (1) Check: not expired?       |
  |                                 | (2) Check: attempts < 5?      |
  |                                 | (3) HMAC-SHA256(email:otp)    |
  |                                 | (4) timingSafeEqual compare   |
  |                                 |                               |
  |                                 |-- UPDATE consumed=true ------> |
  |                                 |-- UPSERT user (by email) ----> |
  |                                 |-- INSERT session hash -------> |
  |                                 |                               |
  |<-- 200 { user } + Set-Cookie: sid=<256-bit token> --------------|  
```

### Step 5 — Session Established

On success:
- A **256-bit random session token** is generated via `crypto.randomBytes(32)`.
- The token is hashed with **SHA-256** and stored in the `sessions` table.
- The **raw token** is placed in an `HttpOnly; SameSite=Lax; Secure` cookie named `sid`.
- The cookie is valid for **7 days**.

The raw token never touches the database — only its hash does. So even a full database compromise cannot forge valid sessions.

### Step 6 — Authenticated Requests

Every subsequent page load, the browser automatically sends the `sid` cookie. The `requireAuth` middleware:
1. Reads the `sid` cookie.
2. Computes `SHA-256(token)` and looks it up in the `sessions` table.
3. Checks `expires_at`.
4. Attaches `req.user` and calls `next()`.

### Step 7 — Logout

- **Logout**: Deletes the single session row, clears the `sid` cookie.
- **Logout All**: Deletes ALL session rows for that `user_id`, clears the cookie.

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                             │
│                                                                     │
│   React App (Vite, port 5173)                                       │
│   ┌──────────────┐    ┌──────────────────────────────────────────┐  │
│   │  LoginPage   │    │            DashboardPage                 │  │
│   │  ─────────── │    │  ──────────────────────────────────────  │  │
│   │  EmailStep   │    │  Shows user email                        │  │
│   │  OtpStep     │    │  Logout / Logout All Devices             │  │
│   └──────────────┘    └──────────────────────────────────────────┘  │
│         │                          │                                 │
│         └────────────┬─────────────┘                                │
│                      │  /api/* proxied by Vite dev server           │
└──────────────────────┼──────────────────────────────────────────────┘
                       │  HTTP + HttpOnly Cookies
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│               EXPRESS OTP SERVER (Node.js, port 4000)               │
│                                                                     │
│   Security Layer: helmet · cors · express.json (10kb limit)         │
│   Rate Limiting:  express-rate-limit (per IP)                       │
│                                                                     │
│   Routes (/api/v1/auth):                                            │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │  POST /request-otp  →  Validate · Cooldown · Hash · Mail  │    │
│   │  POST /verify-otp   →  Lookup · Check · Compare · Session │    │
│   │  GET  /me           →  requireAuth middleware → user       │    │
│   │  POST /logout       →  Delete session · Clear cookie      │    │
│   │  POST /logout-all   →  Delete all sessions · Clear cookie │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│   Crypto:   crypto.randomInt · HMAC-SHA256 · SHA-256 · timingSafeEqual
│   Session:  256-bit token (raw in cookie) · SHA-256 hash in DB     │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
┌─────────────────────────┐  ┌────────────────────────────────────────┐
│  SUPABASE (PostgreSQL)  │  │  GMAIL SMTP (via Nodemailer)            │
│                         │  │                                        │
│  Tables:                │  │  ✅ FREE — No payment needed           │
│  • users                │  │  ✅ Unlimited OTPs (500/day personal)  │
│  • otps (hashes only)   │  │  ✅ App Password auth (not your main   │
│  • sessions (hashes)    │  │     Google password)                   │
│                         │  │                                        │
│  RLS enabled on all     │  │  Sends HTML-formatted OTP email        │
│  tables (deny public)   │  │  with 5-minute expiry notice           │
│                         │  └────────────────────────────────────────┘
│                         │
│  Functions:             │
│  • increment_otp_attempts (atomic)
│  • cleanup_auth_tables  │
└─────────────────────────┘
```

---

## 📁 Project Structure

```text
OTPost/
│
├── 📄 README.md                  ← You are here
├── 📄 LICENSE                    ← MIT License
├── 📄 .gitignore                 ← Strict ignore rules (secrets never committed)
│
├── 📂 db/
│   └── schema.sql                ← Authoritative PostgreSQL schema (run this in Supabase)
│
├── 📂 docs/
│   ├── api.md                    ← Detailed endpoint documentation
│   ├── openapi.yaml              ← OpenAPI 3.0 / Swagger specification
│   └── project.md                ← Full architectural blueprint & threat model
│
├── 📂 server/                    ← Node.js + Express backend
│   ├── .env.example              ← Copy to .env and fill in your secrets
│   ├── package.json
│   └── src/
│       ├── server.js             ← Express entry point, security middleware
│       ├── lib/
│       │   ├── otp.js            ← CSPRNG OTP, HMAC-SHA256, timingSafeEqual, validators
│       │   ├── mailer.js         ← Nodemailer transport + HTML email template
│       │   └── supabase.js       ← Supabase client (service role, server-only)
│       ├── middleware/
│       │   └── requireAuth.js    ← Session cookie → user lookup middleware
│       └── routes/
│           └── auth.routes.js    ← All 5 auth endpoints
│
└── 📂 web/                       ← React + Vite frontend
    ├── vite.config.js            ← Dev proxy: /api → localhost:4000
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx               ← Route: /login vs /dashboard
        ├── api.js                ← Fetch wrapper (credentials: 'include')
        ├── index.css             ← Full glassmorphism design system
        ├── context/
        │   └── AuthContext.jsx   ← Global auth state (user, loading, login, logout)
        └── pages/
            ├── LoginPage.jsx     ← EmailStep + OtpStep with auto-advance & paste
            └── DashboardPage.jsx ← Authenticated user home
```

---

## 🔒 Security Deep Dive

### OTP Generation
```js
// Uses Node.js crypto.randomInt — CSPRNG, no modulo bias
crypto.randomInt(0, 1_000_000)  // → integer in [0, 999999]
String(value).padStart(6, '0')  // → "042913"
```
The chance of guessing a valid OTP is 1 in 1,000,000 per attempt. With a 5-attempt lock, the effective probability of brute-forcing a single OTP drops to **0.0005%**.

### OTP Hashing
```js
// The plaintext OTP is NEVER stored — only this hash goes into the database
crypto.createHmac('sha256', OTP_PEPPER)
      .update(`${email}:${otp}`)
      .digest('hex')
```
The `OTP_PEPPER` is a 32-byte random secret stored only in your `.env`. Even if an attacker dumps the entire `otps` table, they cannot reverse the hashes without the pepper.

### Timing Attack Prevention
```js
// Constant-time comparison — prevents timing side-channel attacks
crypto.timingSafeEqual(
  Buffer.from(expectedHash),
  Buffer.from(submittedHash)
)
```
A normal `===` comparison short-circuits, leaking timing information about how many characters matched. `timingSafeEqual` always takes the same time regardless of the input.

### Session Token Design
```
Generation:  crypto.randomBytes(32)  → 64 hex chars (256 bits of entropy)
In cookie:   raw token (64 hex chars)
In database: SHA-256(token)          → 64 hex chars

Breach impact: Even with full DB read access, SHA-256 hashes cannot be
               reversed to forge session cookies.
```

### Cookie Security
```
Set-Cookie: sid=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```
- **HttpOnly** — JavaScript cannot read the cookie (`document.cookie` returns nothing). XSS attacks cannot steal the session.
- **Secure** — Only sent over HTTPS in production.
- **SameSite=Lax** — Sent on same-site navigations but NOT on cross-site POST requests. Mitigates CSRF.

### Atomic OTP Consumption
```sql
-- Only marks consumed if it's STILL unconsumed (prevents race conditions)
UPDATE otps SET consumed = true
WHERE id = $1 AND consumed = false
RETURNING id
```
If two simultaneous requests submit the same OTP, only the one that wins the database lock will see a returned row. The second gets `[]` and is rejected.

### Security Controls Summary

| Attack Vector | Mitigation | Detail |
|---|---|---|
| OTP brute force | Attempt locking | Max 5 wrong attempts per code |
| OTP flooding / spam | Per-email cooldown | 60s between requests per address |
| API flooding | IP rate limiting | 10 request-otp / 30 verify-otp per 15 min per IP |
| OTP replay | Single-use enforcement | Atomic `consumed = true` update |
| OTP expiry bypass | TTL check | Expires 5 min after creation |
| Database breach | HMAC hashing | Pepper + email context in hash |
| Timing oracle | `timingSafeEqual` | Constant-time comparison |
| XSS session theft | HttpOnly cookie | JS cannot access `sid` cookie |
| CSRF | SameSite=Lax | Cross-site POST doesn't send cookie |
| User enumeration | Generic response | Same 200 response whether email exists or not |
| Session fixation | Fresh token on login | New random token on every login |

---

## 🗄️ Database Schema

Run the contents of [`db/schema.sql`](./db/schema.sql) in your **Supabase SQL Editor** to set up the database.

### `users` table
```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_email_lowercase CHECK (email = lower(email))
);
```
Users are automatically created on their first successful OTP verification. No registration form required.

### `otps` table
```sql
CREATE TABLE otps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  otp_hash   TEXT NOT NULL,       -- HMAC-SHA256 hex. Never the raw code.
  expires_at TIMESTAMPTZ NOT NULL,
  attempts   INT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  consumed   BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `sessions` table
```sql
CREATE TABLE sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,  -- SHA-256 hex of the cookie value
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Row Level Security (RLS)
RLS is **enabled on all tables** with no public policies. Only the backend's `service_role` key (which bypasses RLS entirely) can read or write data. The public `anon` key cannot access any row.

---

## 📡 API Reference

**Base URL:** `/api/v1/auth`  
**Auth method:** HttpOnly session cookie (`sid`)  
**Format:** `application/json`

All error responses share this shape:
```json
{ "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```

---

### `POST /request-otp`

Generates a cryptographically secure 6-digit OTP and delivers it to the given email address via Gmail SMTP (free, no limits).

**Request body:**
```json
{ "email": "you@example.com" }
```

**Responses:**

| Status | Code | When |
|---|---|---|
| `200` | — | Valid email format. A code has been sent (or silently failed — same response either way). |
| `400` | `INVALID_EMAIL` | Email format is malformed. |
| `429` | `COOLDOWN` | A code was already sent within the last 60 seconds. Includes `Retry-After` header. |
| `429` | `RATE_LIMITED` | Too many requests from this IP (10 per 15 min). |
| `500` | `SERVER_ERROR` | Unexpected server error. |

**Success body:**
```json
{
  "message": "If the email is valid, a code has been sent.",
  "resendAfter": 60
}
```

---

### `POST /verify-otp`

Verifies the 6-digit code and creates a session.

**Request body:**
```json
{ "email": "you@example.com", "otp": "123456" }
```

**Responses:**

| Status | Code | When |
|---|---|---|
| `200` | — | Code correct. Session cookie set. |
| `400` | `INVALID_CODE` | Code is wrong, expired, already used, or locked (all return the same error — attacker learns nothing). |
| `400` | `INVALID_INPUT` | Missing or malformed email/otp fields. |
| `429` | `RATE_LIMITED` | Too many verify attempts from this IP (30 per 15 min). |
| `500` | `SERVER_ERROR` | Unexpected server error. |

**Success body + cookie:**
```json
{ "user": { "id": "uuid", "email": "you@example.com" } }
```
```
Set-Cookie: sid=<64 hex chars>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```

---

### `GET /me`

Returns the currently authenticated user. Call this on page load to determine if the user is logged in.

**Responses:**

| Status | Body |
|---|---|
| `200` | `{ "user": { "id": "uuid", "email": "..." } }` |
| `401` | `{ "error": { "code": "UNAUTHENTICATED", ... } }` |

---

### `POST /logout`

Destroys the current session. Always returns `204` (idempotent — safe to call even if already logged out).

**Side effects:** Deletes session row from DB, clears `sid` cookie.

---

### `POST /logout-all`

Destroys **all active sessions** for the authenticated user across all devices. Requires a valid session.

**Responses:** `204` on success, `401` if not authenticated.

---

### Error Codes Reference

| Code | HTTP | Meaning |
|---|---|---|
| `INVALID_EMAIL` | 400 | Email format is invalid |
| `INVALID_INPUT` | 400 | Missing or malformed request fields |
| `INVALID_CODE` | 400 | OTP is wrong, expired, consumed, or locked |
| `UNAUTHENTICATED` | 401 | No valid session cookie |
| `COOLDOWN` | 429 | Email cooldown is active |
| `RATE_LIMITED` | 429 | IP rate limit exceeded |
| `SERVER_ERROR` | 500 | Internal server error |

---

### Rate Limits

| Endpoint | Limit | Window |
|---|---|---|
| `POST /request-otp` | 10 requests | Per IP per 15 minutes |
| `POST /verify-otp` | 30 requests | Per IP per 15 minutes |
| Per-email cooldown | 1 OTP | Per email per 60 seconds |
| OTP attempt lock | 5 wrong attempts | Per OTP code |
| OTP TTL | Expires after 5 min | Per OTP code |
| Session TTL | Valid for 7 days | Per session |

---

## 📧 Gmail SMTP Setup Guide

OTPost uses **Gmail SMTP** via Nodemailer to deliver OTPs. This is completely **free** — no paid plan, no credit card. You only need a Gmail account and an **App Password** — a special 16-character credential for third-party apps, separate from your main Google account password.

> ⚠️ **Never use your real Google account password.** App Passwords are safe to use and can be revoked at any time without affecting your main account.

### Step 1 — Enable 2-Step Verification on your Google Account

App Passwords only work when 2-Step Verification (2FA) is enabled.

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google", click **2-Step Verification**
4. Follow the prompts to turn it on (use phone/authenticator app/SMS)

### Step 2 — Create a Gmail App Password

1. After enabling 2-Step Verification, go back to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Under "How you sign in to Google", click **2-Step Verification** again
3. Scroll to the bottom and click **App passwords**
4. In the "Select app" dropdown, choose **Mail** (or type "OTPost")
5. In the "Select device" dropdown, choose **Other (custom name)** and type `OTPost Server`
6. Click **Generate**
7. Google will display a **16-character password** like `aorr swxz zphl mxku`

> 🔑 **Copy this password immediately** — Google will not show it again after you close the dialog.

### Step 3 — Add Credentials to Your `.env` File

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=aorr swxz zphl mxku
```

The spaces in the App Password are fine — Nodemailer handles them correctly.

### Step 4 — Verify It Works

After starting the backend server, request an OTP from the frontend and check your inbox. Emails typically arrive within 5–15 seconds via Gmail's SMTP infrastructure.

**Troubleshooting:**

| Problem | Solution |
|---|---|
| `Invalid login` error | Make sure you're using the App Password, not your real Google password |
| `Username and Password not accepted` | Re-check that 2-Step Verification is enabled |
| Email goes to spam | Add your Gmail address to your test email's contacts |
| No email received | Check backend console for `Mail delivery failure` log |
| App Passwords option not visible | 2-Step Verification must be enabled first |

### Using a Custom SMTP Provider

If you prefer another email provider (SendGrid, Mailgun, AWS SES, Outlook, etc.), update `server/src/lib/mailer.js`:

```js
// Example: SendGrid via SMTP
export const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

// Example: Custom SMTP
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

---

## 🚀 Local Development Setup

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org) | v18.0.0+ | Check: `node --version` |
| [Git](https://git-scm.com) | Any | For cloning |
| [Supabase Account](https://supabase.com) | Free tier | For the database |
| Gmail Account | — | For free SMTP OTP delivery |

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/OTPost.git
cd OTPost
```

---

### 2. Set Up the Database (Supabase)

1. Go to [supabase.com](https://supabase.com) and **create a new project**.
2. Once the project is ready, navigate to **SQL Editor** in the left sidebar.
3. Click **New query**, paste the entire contents of [`db/schema.sql`](./db/schema.sql), and click **Run**.

You should see: `Success. No rows returned.`

4. Collect your credentials from **Settings → API**:
   - **Project URL** (`SUPABASE_URL`) — looks like `https://xyzxyz.supabase.co`
   - **service_role key** (`SUPABASE_SERVICE_ROLE_KEY`) — under "Project API Keys", reveal the `service_role` key

> ⚠️ Use the `service_role` key only in the backend `.env`. Never expose it in the frontend.

---

### 3. Set Up the Backend

```bash
cd server
npm install
```

Copy the example environment file:
```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Fill in `server/.env`:
```env
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsIn...

# Generate your OTP pepper:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
OTP_PEPPER=c95968056a14ba646231f382fc3a04675be9e3146953ef0...

GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

Start the backend dev server:
```bash
npm run dev
```

You should see:
```
[AUTH SERVER] Running on http://localhost:4000
[AUTH SERVER] Accepting requests from frontend: http://localhost:5173
```

---

### 4. Set Up the Frontend

Open a **new terminal window**:

```bash
cd web
npm install
npm run dev
```

You should see:
```
  VITE v8.x.x  ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

---

### 5. Try It Out

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

1. Enter your email address and click **Send verification code**.
2. Check your inbox — you'll receive a **6-digit OTP via Gmail SMTP** (free, arrives in seconds).
3. Type or paste the code into the boxes.
4. You're logged in! 🎉

---

## 🔧 Environment Variables Reference

### `server/.env`

| Variable | Required | Example | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Set to `production` in production (enables secure cookies) |
| `PORT` | No | `4000` | Port the Express server listens on |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | CORS origin — set to your frontend's URL |
| `SUPABASE_URL` | Yes | `https://xxx.supabase.co` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `eyJhbGci...` | Supabase service role key — **backend only, never expose** |
| `OTP_PEPPER` | Yes | `c95968...` | 32-byte hex secret for HMAC-SHA256 OTP hashing |
| `GMAIL_USER` | Yes | `you@gmail.com` | Gmail address to send OTPs from (SMTP sender) |
| `GMAIL_APP_PASSWORD` | Yes | `abcd efgh ijkl mnop` | Gmail App Password — enables free SMTP delivery (see setup guide) |

### Generating a Secure OTP Pepper

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the output into your `.env` as `OTP_PEPPER`. Keep it secret — changing it will invalidate all in-flight OTPs.

---

## 🌐 Deployment Guide (Vercel, Render, Railway)

### Deploying to Vercel (Recommended)

Since this repo is a monorepo containing `server/` and `web/`, deploy them as **two separate projects** in your Vercel dashboard:

#### 1. Deploy the Backend (`server/`)
1. In Vercel, click **Add New Project** and select your `OTPost` repository.
2. In **Root Directory**, click Edit and select **`server`**.
3. Under **Environment Variables**, add:
   * `NODE_ENV` = `production`
   * `GMAIL_USER` = your Gmail address
   * `GMAIL_APP_PASSWORD` = your 16-character Gmail App Password
   * `SUPABASE_URL` = your Supabase project URL
   * `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service role key
   * `OTP_PEPPER` = your 32-byte hex string
   * `FRONTEND_URL` = your frontend Vercel URL (e.g. `https://your-app.vercel.app`)
4. Click **Deploy**. Note your backend URL (e.g., `https://otpost-server.vercel.app`).

#### 2. Deploy the Frontend (`web/`)
1. In Vercel, click **Add New Project** and select the same `OTPost` repository again.
2. In **Root Directory**, click Edit and select **`web`**.
3. Under **Environment Variables**, add:
   * `VITE_API_URL` = `https://otpost-server.vercel.app` *(your backend URL from Step 1, without trailing slash)*
4. Click **Deploy**.

> 💡 **Why did `Unexpected token 'T'` happen before?**  
> If `VITE_API_URL` is missing, the frontend attempts to call `/api/v1/auth/...` on the frontend domain itself. Vercel returns its default HTML 404 page ("**T**he page could not be found"), which fails when parsed as JSON. Setting `VITE_API_URL` points requests directly to your backend!

---

## 🧰 Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| [express](https://expressjs.com) | ^4 | HTTP server and routing |
| [helmet](https://helmetjs.github.io) | ^8 | Security headers (CSP, HSTS, etc.) |
| [cors](https://github.com/expressjs/cors) | ^2 | Cross-Origin Resource Sharing |
| [cookie-parser](https://github.com/expressjs/cookie-parser) | ^1 | Read `sid` cookie from requests |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | ^7 | IP-based request rate limiting |
| [@supabase/supabase-js](https://github.com/supabase/supabase-js) | ^2 | Supabase PostgreSQL client |
| [nodemailer](https://nodemailer.com) | ^7 | Gmail SMTP transport for free OTP email delivery |
| [dotenv](https://github.com/motdotla/dotenv) | ^16 | `.env` file loader |
| Node.js `crypto` | built-in | CSPRNG, HMAC-SHA256, SHA-256, timingSafeEqual |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| [react](https://react.dev) | ^19 | UI library |
| [vite](https://vitejs.dev) | ^8 | Dev server, bundler, proxy |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | ^6 | React Fast Refresh |
| Vanilla CSS | — | Glassmorphism design system |

### Database
| Tool | Purpose |
|---|---|
| [Supabase](https://supabase.com) | Hosted PostgreSQL with REST API |
| PostgreSQL | Relational database |
| Row Level Security | Table-level access control |

### Email Delivery (Free)
| Tool | Cost | Purpose |
|---|---|---|
| Gmail SMTP | **Free** | OTP email delivery — 500 emails/day (personal), 2000/day (Workspace) |
| Nodemailer | Free (npm) | SMTP transport library |

---

## 🤝 Contributing

Contributions are welcome! Please:

1. **Fork** the repository.
2. Create a **feature branch**: `git checkout -b feat/my-feature`
3. **Commit** your changes: `git commit -m "feat: add my feature"`
4. **Push** to your fork: `git push origin feat/my-feature`
5. Open a **Pull Request**.

**Good first issues:**
- Add support for custom SMTP providers via environment config
- Add `pg_cron` scheduled cleanup for expired OTPs/sessions
- Add password-less magic link as an alternative to OTP
- Add admin endpoint to view/revoke active sessions
- Write unit tests for `otp.js` crypto helpers

---

## 📄 License

This project is open-source and available under the **[MIT License](./LICENSE)**.

---

<div align="center">

Built with ❤️ as a learning project in full-stack development, SMTP email delivery, and cryptographic OTP security.

**[⭐ Star this repo](https://github.com/maneshkatthi/OTPost)** if you found it helpful!

Made by [Manesh Katthi ](https://github.com/maneshkatthi)

</div>
