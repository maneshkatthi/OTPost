import { supabase } from '../lib/supabase.js';
import { sha256, sendError } from '../lib/otp.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.sid;
    if (!token) {
      return sendError(res, 401, 'UNAUTHENTICATED', 'Not logged in');
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .select('id, user_id, expires_at, users(id, email)')
      .eq('token_hash', sha256(token))
      .maybeSingle();

    if (error) {
      console.error('requireAuth query error:', error.message);
      return sendError(res, 500, 'SERVER_ERROR', 'Database error during authentication');
    }

    if (!session || new Date(session.expires_at) < new Date()) {
      return sendError(res, 401, 'UNAUTHENTICATED', 'Not logged in');
    }

    req.user = session.users;
    req.sessionId = session.id;
    next();
  } catch (err) {
    console.error('requireAuth unexpected error:', err);
    sendError(res, 500, 'SERVER_ERROR', 'Something went wrong');
  }
}
