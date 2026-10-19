-- Email OTP Auth: Supabase / PostgreSQL schema
-- Run in the Supabase SQL editor.
-- The backend uses the service role key, which bypasses RLS.
-- RLS is enabled with no policies, so the public anon key can read nothing.
 
------------------------------------------------------------
-- Tables
------------------------------------------------------------
 
create table if not exists users (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now(),
  constraint users_email_lowercase check (email = lower(email))
);
 
create table if not exists otps (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  otp_hash   text not null,                    -- HMAC-SHA256 hex, never the raw code
  expires_at timestamptz not null,
  attempts   int  not null default 0 check (attempts >= 0),
  consumed   boolean not null default false,
  created_at timestamptz not null default now(),
  constraint otps_email_lowercase check (email = lower(email))
);
 
create table if not exists sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  token_hash text not null unique,             -- SHA-256 hex of the cookie token
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
 
------------------------------------------------------------
-- Indexes
------------------------------------------------------------
 
-- Latest OTP per email (cooldown check + verify lookup)
create index if not exists otps_email_created_idx
  on otps (email, created_at desc);
 
-- Cleanup jobs
create index if not exists otps_expires_idx     on otps (expires_at);
create index if not exists sessions_expires_idx on sessions (expires_at);
 
-- logout-all
create index if not exists sessions_user_idx on sessions (user_id);
 
-- token_hash already indexed by its UNIQUE constraint
 
------------------------------------------------------------
-- Row Level Security (deny everything to anon/authenticated roles)
------------------------------------------------------------
 
alter table users    enable row level security;
alter table otps     enable row level security;
alter table sessions enable row level security;
 
------------------------------------------------------------
-- Atomic attempt counter (fixes the read-then-write race)
-- Call from Node: supabase.rpc('increment_otp_attempts', { p_id: rec.id })
------------------------------------------------------------
 
create or replace function increment_otp_attempts(p_id uuid)
returns int
language sql
security definer
set search_path = public
as $$
  update otps
     set attempts = attempts + 1
   where id = p_id
  returning attempts;
$$;
 
-- Only the backend (service role) may call it
revoke all on function increment_otp_attempts(uuid) from public, anon, authenticated;
grant execute on function increment_otp_attempts(uuid) to service_role;
 
------------------------------------------------------------
-- Cleanup of expired rows
------------------------------------------------------------
 
create or replace function cleanup_auth_tables()
returns void
language sql
security definer
set search_path = public
as $$
  delete from otps     where expires_at < now() - interval '1 day';
  delete from sessions where expires_at < now();
$$;
 
revoke all on function cleanup_auth_tables() from public, anon, authenticated;
grant execute on function cleanup_auth_tables() to service_role;
 
-- Optional: schedule hourly with pg_cron (enable the extension in the Supabase dashboard first)
-- select cron.schedule('auth-cleanup', '0 * * * *', $$select cleanup_auth_tables();$$);
 