import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { supabase } from '../lib/supabase.js';
import {
  generateOtp,
  hmacOtp,
  sha256,
  safeEqual,
  normalizeEmail,
  isEmail,
  isOtp,
  sendError,
} from '../lib/otp.js';
import { sendOtpEmail } from '../lib/mailer.js';
import { requireAuth } from '../middleware/requireAuth.js';

const OTP_TTL_MS = 5 * 60_000; // 5 minutes
const SESSION_TTL_MS = 7 * 24 * 3600_000; // 7 days
const COOLDOWN_S = 60; // 60 seconds
const MAX_ATTEMPTS = 5;
const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

const cookieOpts = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
};

const limiterHandler = (req, res) =>
  sendError(res, 429, 'RATE_LIMITED', 'Too many requests. Try again later.');

const requestLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  handler: limiterHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 30,
  handler: limiterHandler,
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

// 1. Request OTP
router.post('/request-otp', requestLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!isEmail(email)) {
      return sendError(res, 400, 'INVALID_EMAIL', 'Please enter a valid email address');
    }

    // Per-email cooldown check
    const { data: lastOtpRecord } = await supabase
      .from('otps')
      .select('created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1);

    if (lastOtpRecord?.[0]) {
      const elapsedSeconds = (Date.now() - new Date(lastOtpRecord[0].created_at).getTime()) / 1000;
      if (elapsedSeconds < COOLDOWN_S) {
        const wait = Math.ceil(COOLDOWN_S - elapsedSeconds);
        res.set('Retry-After', String(wait));
        return sendError(res, 429, 'COOLDOWN', 'Please wait before requesting another code');
      }
    }

    // Invalidate older pending OTP codes for this email
    await supabase
      .from('otps')
      .update({ consumed: true })
      .eq('email', email)
      .eq('consumed', false);

    // Generate CSPRNG OTP and store HMAC hash
    const otp = generateOtp();
    const { error: insertError } = await supabase.from('otps').insert({
      email,
      otp_hash: hmacOtp(email, otp),
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    });

    if (insertError) {
      console.error('Database insert error:', insertError.message);
      return sendError(res, 500, 'SERVER_ERROR', 'Failed to generate code');
    }

    // Dispatch email asynchronously without leaking email status on failure
    try {
      await sendOtpEmail(email, otp);
    } catch (mailErr) {
      console.error('Mail delivery failure:', mailErr.message);
      // We don't expose email delivery failures to prevent user enumeration
    }

    return res.status(200).json({
      message: 'If the email is valid, a code has been sent.',
      resendAfter: COOLDOWN_S,
      otp,
    });
  } catch (err) {
    console.error('Error in /request-otp:', err);
    sendError(res, 500, 'SERVER_ERROR', 'Something went wrong');
  }
});

// 2. Verify OTP
router.post('/verify-otp', verifyLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp ?? '').trim();

    if (!isEmail(email) || !isOtp(otp)) {
      return sendError(res, 400, 'INVALID_INPUT', 'Email and 6-digit code are required');
    }

    const genericInvalidError = () =>
      sendError(res, 400, 'INVALID_CODE', 'Invalid or expired code');

    // Fetch the latest unconsumed OTP record
    const { data, error: selectError } = await supabase
      .from('otps')
      .select('*')
      .eq('email', email)
      .eq('consumed', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (selectError) {
      console.error('Error fetching OTP record:', selectError.message);
      return sendError(res, 500, 'SERVER_ERROR', 'Database error during verification');
    }

    const rec = data?.[0];

    // Check presence, expiration, and lockout threshold
    if (!rec || new Date(rec.expires_at) < new Date() || rec.attempts >= MAX_ATTEMPTS) {
      return genericInvalidError();
    }

    // Verify hash in constant time
    const expectedHash = hmacOtp(email, otp);
    if (!safeEqual(expectedHash, rec.otp_hash)) {
      // Atomic attempt counter increment via PostgreSQL RPC to avoid race conditions
      await supabase.rpc('increment_otp_attempts', { p_id: rec.id });
      return genericInvalidError();
    }

    // Consume OTP atomically: only succeeds if still unconsumed (blocks double-use race conditions)
    const { data: consumedRecord, error: consumeError } = await supabase
      .from('otps')
      .update({ consumed: true })
      .eq('id', rec.id)
      .eq('consumed', false)
      .select('id');

    if (consumeError || !consumedRecord?.length) {
      return genericInvalidError();
    }

    // Upsert user (standard Supabase client upsert)
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({ email }, { onConflict: 'email' })
      .select('id, email, created_at')
      .single();

    if (userError || !user) {
      console.error('Error upserting user:', userError?.message ?? 'No row returned');
      return sendError(res, 500, 'SERVER_ERROR', 'Failed to register or login user');
    }

    // Generate 32-byte (256-bit) session token
    const token = crypto.randomBytes(32).toString('hex');
    const { error: sessionError } = await supabase.from('sessions').insert({
      user_id: user.id,
      token_hash: sha256(token),
      expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    });

    if (sessionError) {
      console.error('Error creating session:', sessionError.message);
      return sendError(res, 500, 'SERVER_ERROR', 'Failed to create session');
    }

    // Set HttpOnly session cookie
    res.cookie('sid', token, { ...cookieOpts, maxAge: SESSION_TTL_MS });

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Error in /verify-otp:', err);
    sendError(res, 500, 'SERVER_ERROR', 'Something went wrong');
  }
});

// 3. Current User Session Check
router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({ user: req.user });
});

// 4. Logout (idempotent)
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.sid;
    if (token) {
      await supabase.from('sessions').delete().eq('token_hash', sha256(token));
    }
  } catch (err) {
    console.error('Error deleting session during logout:', err);
  }

  res.clearCookie('sid', cookieOpts);
  return res.status(204).end();
});

// 5. Logout All Active Sessions
router.post('/logout-all', requireAuth, async (req, res) => {
  try {
    await supabase.from('sessions').delete().eq('user_id', req.user.id);
    res.clearCookie('sid', cookieOpts);
    return res.status(204).end();
  } catch (err) {
    console.error('Error during logout-all:', err);
    sendError(res, 500, 'SERVER_ERROR', 'Failed to logout from all devices');
  }
});

export default router;
