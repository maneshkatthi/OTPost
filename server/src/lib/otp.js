import crypto from 'crypto';

/**
 * Generates a cryptographically secure 6-digit OTP using CSPRNG.
 * Rejection sampling inside crypto.randomInt avoids modulo bias.
 */
export const generateOtp = () => {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
};

/**
 * Computes HMAC-SHA256 of the email and OTP using the server-side OTP_PEPPER.
 */
export const hmacOtp = (email, otp) => {
  const pepper = process.env.OTP_PEPPER || 'default_dev_pepper_please_change';
  return crypto.createHmac('sha256', pepper).update(`${email}:${otp}`).digest('hex');
};

/**
 * Computes plain SHA-256 hash (used for high-entropy 256-bit session tokens).
 */
export const sha256 = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

/**
 * Performs constant-time comparison to prevent timing attacks.
 */
export const safeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

export const normalizeEmail = (val) => String(val ?? '').trim().toLowerCase();

export const isEmail = (email) => {
  return (
    typeof email === 'string' &&
    email.length > 3 &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
};

export const isOtp = (otp) => {
  return typeof otp === 'string' && /^\d{6}$/.test(otp);
};

export const sendError = (res, status, code, message) => {
  return res.status(status).json({
    error: {
      code,
      message,
    },
  });
};
