-- ============================================================
-- OTPost: Supabase / PostgreSQL Database Schema
-- Run this in your Supabase SQL Editor.
-- ============================================================

------------------------------------------------------------
-- Tables
------------------------------------------------------------

-- 1. Users Table
create table if not exists users (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now(),
  constraint users_email_lowercase check (email = lower(email))
);

-- 2. OTPs Table (Stores HMAC-SHA256 hashes, never plaintext codes)
create table if not exists otps (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  otp_hash   text not null,
  expires_at timestamptz not null,
  attempts   int  not null default 0 check (attempts >= 0),
  consumed   boolean not null default false,
  created_at timestamptz not null default now(),
  constraint otps_email_lowercase check (email = lower(email))
);

-- 3. Sessions Table (Stores SHA-256 hashes of the cookie token)
create table if not exists sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

------------------------------------------------------------
-- Indexes
------------------------------------------------------------

-- Latest OTP per email (used for cooldown checks & verification)
create index if not exists otps_email_created_idx
  on otps (email, created_at desc);

-- Expiration indexes for background cleanup
create index if not exists otps_expires_idx     on otps (expires_at);
create index if not exists sessions_expires_idx on sessions (expires_at);

-- User lookup for session management & logout
create index if not exists sessions_user_idx on sessions (user_id);

------------------------------------------------------------
-- Row Level Security (RLS)
-- Denies access to public/anon/authenticated roles;
-- The backend uses the service_role key to manage records.
------------------------------------------------------------

alter table users    enable row level security;
alter table otps     enable row level security;
alter table sessions enable row level security;

------------------------------------------------------------
-- Atomic Attempt Counter Function
-- Increments failed attempt count atomically to prevent race conditions.
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

-- Grant execution only to backend service role
revoke all on function increment_otp_attempts(uuid) from public, anon, authenticated;
grant execute on function increment_otp_attempts(uuid) to service_role;

------------------------------------------------------------
-- Automatic Cleanup of Expired Rows
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
