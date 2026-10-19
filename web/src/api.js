/**
 * api.js — Thin fetch wrapper with credentials: 'include' for session cookies.
 * All calls go to /api/v1/auth via the Vite dev proxy.
 */

const BASE = '/api/v1/auth';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 No Content
  if (res.status === 204) return null;

  const data = await res.json();

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
