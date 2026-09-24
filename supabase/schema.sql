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
  mood text,
  symbols text[] not null default '{}',
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

-- Safe to re-run on a database created before mood/symbols/is_private existed.
alter table public.dreams add column if not exists mood text;
alter table public.dreams add column if not exists symbols text[] not null default '{}';
alter table public.dreams add column if not exists is_private boolean not null default false;

alter table public.profiles enable row level security;
alter table public.dreams enable row level security;

-- Profiles: anyone signed in can read display names (needed to show authorship on dreams),
-- but a user can only create/edit their own profile row.
-- Every policy below is preceded by `drop policy if exists` so this whole file can be
-- re-run safely on a database that already has some or all of them (the Supabase SQL editor
-- runs the file as one transaction, so a single "already exists" error rolls back everything
-- else in the script too).
drop policy if exists "Profiles are readable by any signed-in user" on public.profiles;
create policy "Profiles are readable by any signed-in user"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id);

-- Dreams: public feed by default, with a per-dream private toggle. Anyone signed in can read
-- public dreams; a private dream is only readable by the user who posted it.
drop policy if exists "Dreams are readable by any signed-in user" on public.dreams;
create policy "Dreams are readable by any signed-in user"
  on public.dreams for select
  to authenticated
  using (not is_private or auth.uid() = user_id);

drop policy if exists "Users can insert their own dreams" on public.dreams;
create policy "Users can insert their own dreams"
  on public.dreams for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own dreams" on public.dreams;
create policy "Users can update their own dreams"
  on public.dreams for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own dreams" on public.dreams;
create policy "Users can delete their own dreams"
  on public.dreams for delete
  to authenticated
  using (auth.uid() = user_id);

-- Explicit grants: needed regardless of the "Automatically expose new tables" project setting
-- (grants gate access before RLS policies are even evaluated). Only `authenticated` needs
-- access here since every RLS policy above is scoped `to authenticated` anyway.
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.dreams to authenticated;
