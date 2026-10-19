import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    '[WARN] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Check your server/.env file.'
  );
}

// Backend uses the service role key which bypasses RLS
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceRoleKey || 'placeholder', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
