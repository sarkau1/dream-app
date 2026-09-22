-- Run this once in your Supabase project's SQL editor (Project -> SQL Editor -> New query).
-- Creates the tables and Row Level Security policies backing register/login/post-a-dream.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.dreams enable row level security;

-- Profiles: anyone signed in can read display names (needed to show authorship on dreams),
-- but a user can only create/edit their own profile row.
create policy "Profiles are readable by any signed-in user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id);

-- Dreams: public feed. Anyone signed in can read all dreams; a user can only insert their own.
-- If you want a private per-account journal instead, change the select policy below to
-- `using (auth.uid() = user_id)`.
create policy "Dreams are readable by any signed-in user"
  on public.dreams for select
  to authenticated
  using (true);

create policy "Users can insert their own dreams"
  on public.dreams for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Explicit grants: needed regardless of the "Automatically expose new tables" project setting
-- (grants gate access before RLS policies are even evaluated). Only `authenticated` needs
-- access here since every RLS policy above is scoped `to authenticated` anyway.
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.dreams to authenticated;
