/**
 * ============================================================================
 * OTPost — Single-File Zero-Database OTP Engine
 * ============================================================================
 * Generates secure 6-digit OTPs and delivers them via Gmail SMTP for FREE.
 * Requires ZERO database: uses cryptographically signed HMAC tokens + in-memory
 * state with native Node.js crypto.
 * 
 * Run directly: node src/server.js
 * Or deploy directly to Vercel/Render as a serverless or standalone app.
 * ============================================================================
 */

import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// ── Configuration ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const SECRET_KEY = process.env.OTP_PEPPER || process.env.JWT_SECRET || 'otpost_default_super_secret_pepper_2026';
const REPO_URL = 'https://github.com/maneshkatthi/OTPost';

const OTP_TTL_MS = 5 * 60_000;       // 5 minutes
const COOLDOWN_S = 60;               // 60 seconds
const SESSION_TTL_MS = 7 * 24 * 3600_000; // 7 days
const MAX_ATTEMPTS = 5;

// Warn if Gmail credentials are not provided
if (!GMAIL_USER || !GMAIL_PASS) {
  console.warn('\n⚠️ [WARN] GMAIL_USER or GMAIL_APP_PASSWORD missing in environment!');
  console.warn('   Emails will not send until Gmail credentials are added in .env\n');
}

// ── In-Memory Cooldown & Rate-Limit Cache ─────────────────────────────────────
// Structure: email -> { lastRequestedAt: number, attempts: number }
const stateCache = new Map();

// Periodic sweep to prevent memory leaks (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of stateCache.entries()) {
    if (now - record.lastRequestedAt > OTP_TTL_MS * 2) {
      stateCache.delete(email);
    }
  }
}, 10 * 60_000);

// ── Cryptographic Helpers ────────────────────────────────────────────────────
function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidOtp(otp) {
  return /^\d{6}$/.test(String(otp || '').trim());
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function hmacHash(value, secret = SECRET_KEY) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

/**
 * Creates a tamper-proof cryptographically signed token using native Node.js crypto.
 * No external libraries or database required!
 */
function createSignedToken(payload, secret = SECRET_KEY) {
  const serialized = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(serialized).digest('base64url');
  return `${serialized}.${signature}`;
}

/**
 * Verifies and decodes a signed token using constant-time comparison.
 */
function verifySignedToken(token, secret = SECRET_KEY) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [serialized, receivedSig] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(serialized).digest('base64url');

  const bufReceived = Buffer.from(receivedSig);
  const bufExpected = Buffer.from(expectedSig);

  if (bufReceived.length !== bufExpected.length) return null;
  if (!crypto.timingSafeEqual(bufReceived, bufExpected)) return null;

  try {
    return JSON.parse(Buffer.from(serialized, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

// ── Nodemailer Transport & HTML Email Template ───────────────────────────────
const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

async function sendOtpEmail(toEmail, otp) {
  const mailOptions = {
    from: `"OTPost Authentication" <${GMAIL_USER}>`,
    to: toEmail,
    subject: `${otp} is your OTPost verification code`,
    text: `Your OTPost one-time login code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nStar us on GitHub: ${REPO_URL}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #090a10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #090a10; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 520px; background-color: #12131d; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; overflow: hidden; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);" cellspacing="0" cellpadding="0">
                <tr>
                  <td height="4" style="background: linear-gradient(90deg, #5b6bf0 0%, #06d6d6 50%, #a855f7 100%);"></td>
                </tr>
                <tr>
                  <td style="padding: 36px 32px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                      <tr>
                        <td>
                          <span style="font-size: 26px; vertical-align: middle;">📬</span>
                          <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; margin-left: 8px; vertical-align: middle;">OTPost</span>
                        </td>
                        <td align="right">
                          <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #06d6d6; background-color: rgba(6, 214, 214, 0.1); border: 1px solid rgba(6, 214, 214, 0.25); padding: 4px 10px; border-radius: 20px;">
                            Gmail SMTP
                          </span>
                        </td>
                      </tr>
                    </table>

                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.3px;">
                      Your Login Verification Code
                    </h1>
                    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                      Use the 6-digit code below to securely complete your sign-in. This code was generated just for you and expires in <strong>5 minutes</strong>.
                    </p>

                    <div style="background: linear-gradient(135deg, rgba(91, 107, 240, 0.12) 0%, rgba(6, 214, 214, 0.06) 100%); border: 1.5px solid #5b6bf0; border-radius: 12px; padding: 22px; text-align: center; margin-bottom: 24px;">
                      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #a0b4fb; font-weight: 600; margin-bottom: 8px;">
                        One-Time Passcode
                      </div>
                      <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', Courier, monospace; margin: 4px 0 10px 0;">
                        ${otp}
                      </div>
                      <div style="font-size: 12px; color: #94a3b8;">
                        🔒 Single-use only · Expires in 5 minutes
                      </div>
                    </div>

                    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 28px 0;">
                      If you did not request this login attempt, someone may have typed your email address by mistake. Your account remains completely secure.
                    </p>

                    <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px 20px; text-align: center; margin-bottom: 12px;">
                      <div style="font-size: 14px; font-weight: 600; color: #f1f5f9; margin-bottom: 4px;">
                        ⭐ Star OTPost on GitHub
                      </div>
                      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0 0 14px 0;">
                        This email was sent for free with OTPost using Gmail SMTP. If this project helped you, please give it a star!
                      </p>
                      <a href="${REPO_URL}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 8px 18px; border-radius: 8px; box-shadow: 0 2px 10px rgba(245, 158, 11, 0.35);">
                        ⭐ Star on GitHub (maneshkatthi/OTPost)
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 32px; background-color: #0c0d14; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
                    <p style="color: #475569; font-size: 11px; margin: 0; line-height: 1.5;">
                      Powered by <strong>OTPost</strong> — Zero-Database Free OTP Engine.<br>
                      <a href="${REPO_URL}" style="color: #7a8ef7; text-decoration: none;">github.com/maneshkatthi/OTPost</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  return mailTransporter.sendMail(mailOptions);
}

// ── Express Application Setup ────────────────────────────────────────────────
const app = express();
app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Rate limiters
const standardLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait a bit.' } },
});

// Cookie options
const cookieOpts = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
};

// ── Authentication Middleware ────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const sessionToken = req.cookies?.sid;
  if (!sessionToken) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Please log in to continue.' } });
  }

  const session = verifySignedToken(sessionToken);
  if (!session || !session.email || Date.now() > session.expiresAt) {
    res.clearCookie('sid', cookieOpts);
    return res.status(401).json({ error: { code: 'SESSION_EXPIRED', message: 'Session expired. Please log in again.' } });
  }

  req.user = { email: session.email, id: session.id || hmacHash(session.email).slice(0, 16) };
  next();
}

// ── Auth Router ──────────────────────────────────────────────────────────────
const authRouter = express.Router();

/**
 * 1. POST /request-otp
 * Generates OTP, returns signed OTP token in cookie/payload, and emails user.
 */
authRouter.post('/request-otp', standardLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: { code: 'INVALID_EMAIL', message: 'Please enter a valid email address.' } });
    }

    // Cooldown check
    const existing = stateCache.get(email);
    if (existing) {
      const elapsed = (Date.now() - existing.lastRequestedAt) / 1000;
      if (elapsed < COOLDOWN_S) {
        const wait = Math.ceil(COOLDOWN_S - elapsed);
        res.set('Retry-After', String(wait));
        return res.status(429).json({ error: { code: 'COOLDOWN', message: `Please wait ${wait}s before requesting another code.` } });
      }
    }

    // Generate 6-digit OTP
    const otp = generateOtp();
    const expiresAt = Date.now() + OTP_TTL_MS;
    const otpHash = hmacHash(`${email}:${otp}`);

    // Update in-memory cooldown state
    stateCache.set(email, {
      lastRequestedAt: Date.now(),
      attempts: 0,
    });

    // Create a tamper-proof stateless OTP ticket
    const otpTicket = createSignedToken({
      email,
      otpHash,
      expiresAt,
    });

    // Set ticket in secure cookie
    res.cookie('otp_ticket', otpTicket, {
      ...cookieOpts,
      maxAge: OTP_TTL_MS,
    });

    // Send email via Gmail SMTP
    try {
      await sendOtpEmail(email, otp);
    } catch (mailErr) {
      console.error('Mail delivery failure:', mailErr.message);
    }

    return res.status(200).json({
      message: 'If the email is valid, a code has been sent.',
      resendAfter: COOLDOWN_S,
      otp, // Included for live demo preview
    });
  } catch (err) {
    console.error('Error in /request-otp:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Something went wrong.' } });
  }
});

/**
 * 2. POST /verify-otp
 * Verifies code against the tamper-proof signed ticket. Establishes session.
 */
authRouter.post('/verify-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || '').trim();

    if (!isValidEmail(email) || !isValidOtp(otp)) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Email and 6-digit code are required.' } });
    }

    // Read signed OTP ticket from cookie
    const ticketToken = req.cookies?.otp_ticket;
    const ticket = verifySignedToken(ticketToken);

    if (!ticket || ticket.email !== email || Date.now() > ticket.expiresAt) {
      return res.status(400).json({ error: { code: 'INVALID_CODE', message: 'Invalid or expired code. Please request a new one.' } });
    }

    // Attempt counter (lock after 5 tries)
    const state = stateCache.get(email) || { attempts: 0 };
    if (state.attempts >= MAX_ATTEMPTS) {
      res.clearCookie('otp_ticket', cookieOpts);
      return res.status(429).json({ error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many incorrect attempts. Please request a new code.' } });
    }

    // Compare hash with timingSafeEqual
    const computedHash = hmacHash(`${email}:${otp}`);
    const bufComputed = Buffer.from(computedHash);
    const bufExpected = Buffer.from(ticket.otpHash);

    const isMatch = bufComputed.length === bufExpected.length && crypto.timingSafeEqual(bufComputed, bufExpected);

    if (!isMatch) {
      state.attempts += 1;
      stateCache.set(email, state);
      return res.status(400).json({ error: { code: 'INVALID_CODE', message: 'Invalid verification code.' } });
    }

    // Success: Clear OTP ticket & create session
    res.clearCookie('otp_ticket', cookieOpts);
    stateCache.delete(email);

    const user = {
      id: hmacHash(email).slice(0, 16),
      email,
      created_at: new Date().toISOString(),
    };

    // Create stateless signed session token valid for 7 days
    const sessionToken = createSignedToken({
      id: user.id,
      email: user.email,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

    res.cookie('sid', sessionToken, {
      ...cookieOpts,
      maxAge: SESSION_TTL_MS,
    });

    return res.status(200).json({ user });
  } catch (err) {
    console.error('Error in /verify-otp:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to verify code.' } });
  }
});

/**
 * 3. GET /me
 * Checks session and returns active user.
 */
authRouter.get('/me', requireAuth, (req, res) => {
  res.status(200).json({ user: req.user });
});

/**
 * 4. POST /logout
 * Clears session cookie.
 */
authRouter.post('/logout', (req, res) => {
  res.clearCookie('sid', cookieOpts);
  res.status(204).send();
});

/**
 * 5. POST /logout-all
 * Clears session cookie.
 */
authRouter.post('/logout-all', (req, res) => {
  res.clearCookie('sid', cookieOpts);
  res.status(204).send();
});

// ── Route Mounts ─────────────────────────────────────────────────────────────
// Supports root health checks and multi-prefix routes for direct or Vercel routing
app.get(['/', '/api', '/api/v1', '/api/v1/health', '/v1/health', '/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'otpost-engine',
    mode: 'zero-database',
    timestamp: new Date().toISOString(),
  });
});

app.use(['/api/v1/auth', '/v1/auth', '/auth'], authRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.path}` } });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error.' } });
});

// ── Start Server ─────────────────────────────────────────────────────────────
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 [OTPost Engine] Running on http://localhost:${PORT}`);
    console.log(`🔒 Mode: Zero-Database (Stateless Cryptographic Tokens)`);
    console.log(`📬 Mailer: Gmail SMTP (${GMAIL_USER || 'Credentials missing in .env'})`);
    console.log(`🌐 Frontend CORS: ${FRONTEND_URL}\n`);
  });
}

export default app;
