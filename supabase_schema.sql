-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- Enable PostGIS for geo queries (optional but recommended)
-- create extension if not exists postgis;

create table if not exists users (
  id bigint primary key,                    -- Telegram user ID
  name text not null,
  photo_url text,
  height int default 170,
  weight int default 65,
  position decimal(2,1) default 0.5,      -- 0.0 to 1.0
  is_side boolean default false,
  preference1 text default 'Safe',         -- Safe | Raw
  preference2 text default 'Clean',         -- Clean | Party
  preference3 text default '1on1',         -- 1on1 | Group
  lat decimal(10,6),
  lng decimal(10,6),
  tg_username text,
  is_online boolean default true,
  updated_at timestamp with time zone default now()
);

-- Index for geo queries
 create index if not exists idx_users_lat_lng on users(lat, lng);
 create index if not exists idx_users_updated on users(updated_at desc);

-- Enable Row Level Security
alter table users enable row level security;

-- Policy: anyone can read (we filter by distance in the app)
create policy "Allow select for all"
  on users for select
  using (true);

-- Policy: users can only upsert their own row
create policy "Allow upsert own row"
  on users for all
  using (id = current_setting('request.jwt.claims', true)::json->>'sub')  -- simplified, use anon key approach instead
  with check (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Since we are using the anon key from a Telegram Mini App (no JWT auth),
-- we need a simpler approach. Enable RLS but use a simple policy:
drop policy if exists "Allow select for all" on users;
drop policy if exists "Allow upsert own row" on users;

-- For Telegram Mini App (no auth server), we use anon key with these policies:
create policy "Public read"
  on users for select
  to anon
  using (true);

create policy "Public insert"
  on users for insert
  to anon
  with check (true);

create policy "Public update"
  on users for update
  to anon
  using (true)
  with check (true);
