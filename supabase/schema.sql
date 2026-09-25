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
  -- The night the dream happened, which can be earlier than when it was written down.
  dreamt_on date not null default current_date,
  created_at timestamptz not null default now()
);

-- Safe to re-run on a database created before mood/symbols/is_private/dreamt_on existed.
alter table public.dreams add column if not exists mood text;
alter table public.dreams add column if not exists symbols text[] not null default '{}';
alter table public.dreams add column if not exists is_private boolean not null default false;
alter table public.dreams add column if not exists dreamt_on date;
-- Backfill existing rows from when they were posted, then lock the column down.
update public.dreams set dreamt_on = created_at::date where dreamt_on is null;
alter table public.dreams alter column dreamt_on set default current_date;
alter table public.dreams alter column dreamt_on set not null;

-- Limits the client can't be trusted to enforce. The UI applies the same ones (DreamForm,
-- RegisterPage) and the mood list matches DREAM_MOODS in src/types/dream.ts. `not valid` means
-- rows that already break a rule stay as they are; every new or edited row is checked.
alter table public.dreams drop constraint if exists dreams_title_length;
alter table public.dreams add constraint dreams_title_length
  check (char_length(title) between 1 and 200) not valid;
alter table public.dreams drop constraint if exists dreams_body_length;
alter table public.dreams add constraint dreams_body_length
  check (char_length(body) between 1 and 20000) not valid;
alter table public.dreams drop constraint if exists dreams_mood_known;
alter table public.dreams add constraint dreams_mood_known
  check (mood is null or mood in ('Lucid', 'Nightmare', 'Recurring', 'Peaceful', 'Confusing')) not valid;
alter table public.dreams drop constraint if exists dreams_symbols_count;
alter table public.dreams add constraint dreams_symbols_count
  check (coalesce(array_length(symbols, 1), 0) <= 30) not valid;
alter table public.dreams drop constraint if exists dreams_dreamt_on_not_future;
-- A day of slack for timezones ahead of the server's.
alter table public.dreams add constraint dreams_dreamt_on_not_future
  check (dreamt_on <= current_date + 1) not valid;
alter table public.profiles drop constraint if exists profiles_display_name_length;
alter table public.profiles add constraint profiles_display_name_length
  check (char_length(display_name) between 1 and 50) not valid;

-- The journal lists one user's dreams by night; the feed lists public dreams newest first.
create index if not exists dreams_journal_idx
  on public.dreams (user_id, dreamt_on desc, created_at desc);
create index if not exists dreams_feed_idx
  on public.dreams (created_at desc) where not is_private;

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
