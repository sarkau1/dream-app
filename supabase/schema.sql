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

-- Private notes: the dreamer's own reading of a dream (meaning, analysis, what it reminded them
-- of). One per dream, kept in their own table so sharing a dream never shares its note.
create table if not exists public.dream_notes (
  dream_id uuid primary key references public.dreams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  updated_at timestamptz not null default now(),
  constraint dream_notes_body_length check (char_length(body) between 1 and 20000)
);

alter table public.dream_notes enable row level security;

drop policy if exists "Users can read their own notes" on public.dream_notes;
create policy "Users can read their own notes"
  on public.dream_notes for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can note their own dreams" on public.dream_notes;
create policy "Users can note their own dreams"
  on public.dream_notes for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.dreams d where d.id = dream_id and d.user_id = auth.uid())
  );

drop policy if exists "Users can update their own notes" on public.dream_notes;
create policy "Users can update their own notes"
  on public.dream_notes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own notes" on public.dream_notes;
create policy "Users can delete their own notes"
  on public.dream_notes for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.dream_notes to authenticated;

-- Reactions and comments on shared dreams. The `exists (select ... from dreams)` checks run
-- under the dreams policies, so they only see dreams the caller may read: making a dream
-- private hides its reactions and comments from everyone but its dreamer.
create table if not exists public.dream_reactions (
  dream_id uuid not null references public.dreams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (dream_id, user_id)
);

create table if not exists public.dream_comments (
  id uuid primary key default gen_random_uuid(),
  dream_id uuid not null references public.dreams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  -- Mirrors MAX_COMMENT_LENGTH in src/lib/dreamSocial.ts.
  constraint dream_comments_body_length check (char_length(body) between 1 and 1000)
);

create index if not exists dream_comments_dream_idx on public.dream_comments (dream_id, created_at);

alter table public.dream_reactions enable row level security;
alter table public.dream_comments enable row level security;

drop policy if exists "Reactions are readable with their dream" on public.dream_reactions;
create policy "Reactions are readable with their dream"
  on public.dream_reactions for select
  to authenticated
  using (exists (select 1 from public.dreams d where d.id = dream_id));

drop policy if exists "Users can react to shared dreams" on public.dream_reactions;
create policy "Users can react to shared dreams"
  on public.dream_reactions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.dreams d where d.id = dream_id and not d.is_private)
  );

drop policy if exists "Users can remove their own reactions" on public.dream_reactions;
create policy "Users can remove their own reactions"
  on public.dream_reactions for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Comments are readable with their dream" on public.dream_comments;
create policy "Comments are readable with their dream"
  on public.dream_comments for select
  to authenticated
  using (exists (select 1 from public.dreams d where d.id = dream_id));

drop policy if exists "Users can comment on shared dreams" on public.dream_comments;
create policy "Users can comment on shared dreams"
  on public.dream_comments for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.dreams d where d.id = dream_id and not d.is_private)
  );

-- A comment can be removed by whoever wrote it, or by the dreamer whose dream it's on.
drop policy if exists "Commenters and dreamers can delete comments" on public.dream_comments;
create policy "Commenters and dreamers can delete comments"
  on public.dream_comments for delete
  to authenticated
  using (
    auth.uid() = user_id
    or exists (select 1 from public.dreams d where d.id = dream_id and d.user_id = auth.uid())
  );

grant select, insert, delete on public.dream_reactions to authenticated;
grant select, insert, delete on public.dream_comments to authenticated;

create or replace view public.dream_comments_with_authors
  with (security_invoker = true)
as
select
  c.id,
  c.dream_id,
  c.user_id,
  c.body,
  c.created_at,
  coalesce(p.display_name, 'Dreamer') as author_name
from public.dream_comments c
left join public.profiles p on p.user_id = c.user_id;

grant select on public.dream_comments_with_authors to authenticated;

-- Dreams joined to their author's display name, a short preview of the text and their comment
-- and reaction counts, so the app reads a page of dreams in one request and the journal can
-- list every dream without downloading every full body. Defined after the comment and reaction
-- tables it counts. security_invoker makes the view run as the signed-in user, so
-- the dreams and profiles policies above still decide which rows come back.
create or replace view public.dreams_with_authors
  with (security_invoker = true)
as
select
  d.id,
  d.user_id,
  d.title,
  d.body,
  left(d.body, 400) as preview,
  d.mood,
  d.symbols,
  d.is_private,
  d.dreamt_on,
  d.created_at,
  coalesce(p.display_name, 'Dreamer') as author_name,
  -- Appended last: create or replace view can only add columns at the end.
  (select count(*) from public.dream_comments c where c.dream_id = d.id) as comment_count,
  (select count(*) from public.dream_reactions r where r.dream_id = d.id) as reaction_count
from public.dreams d
left join public.profiles p on p.user_id = d.user_id;

grant select on public.dreams_with_authors to authenticated;

-- Lets a signed-in user delete their own account. Their profile and dreams go with it through
-- the `on delete cascade` foreign keys. security definer because only the database owner may
-- delete from auth.users; the function can only ever delete the caller.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
