/**
 * api.js — Thin fetch wrapper with credentials: 'include' for session cookies.
 * All calls go to /api/v1/auth via the Vite dev proxy.
 */

// Normalize API base URL: handles any user format in VITE_API_URL cleanly
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const BASE = rawApiUrl.endsWith('/api/v1/auth')
  ? rawApiUrl
  : rawApiUrl.endsWith('/api/v1')
  ? `${rawApiUrl}/auth`
  : rawApiUrl.endsWith('/api')
  ? `${rawApiUrl}/v1/auth`
  : rawApiUrl
  ? `${rawApiUrl}/api/v1/auth`
  : '/api/v1/auth';

async function request(method, path, body) {
  const url = `${BASE}${path}`;
  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (netErr) {
    throw new Error(`Failed to connect to backend at ${url}. Check your network or VITE_API_URL configuration.`);
  }

  // 204 No Content
  if (res.status === 204) return null;

  // Safely read response text first to prevent "Unexpected end of JSON input" errors
  const rawText = await res.text();

  if (!rawText || !rawText.trim()) {
    if (!res.ok) {
      throw new Error(`Backend returned HTTP ${res.status} with an empty response at ${url}. Check your Vercel backend logs.`);
    }
    return null;
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (parseErr) {
    if (res.status === 404) {
      throw new Error(
        `API endpoint not found (404) at ${url}.\n\n` +
        `If running on Vercel:\n` +
        `1. Ensure your backend server is deployed.\n` +
        `2. Add Environment Variable VITE_API_URL=<your-backend-url> in your Vercel frontend project settings and redeploy.`
      );
    }
    throw new Error(`Server returned HTTP ${res.status} non-JSON response: ${rawText.slice(0, 120)}`);
  }

  if (!res.ok) {
    const err = new Error(data?.error?.message || 'Request failed');
    err.code = data?.error?.code;
    err.status = res.status;
    err.retryAfter = res.headers.get('Retry-After');
    throw err;
  }

  return data;
}

export const api = {
  requestOtp:  (email)      => request('POST', '/request-otp', { email }),
  verifyOtp:   (email, otp) => request('POST', '/verify-otp', { email, otp }),
  me:          ()           => request('GET',  '/me'),
  logout:      ()           => request('POST', '/logout'),
  logoutAll:   ()           => request('POST', '/logout-all'),
};
