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
-- Set by a moderator (admin_hide_dream) to take a shared dream out of the feed. The dreamer
-- still sees it in their journal, with the reason.
alter table public.dreams add column if not exists hidden_at timestamptz;
alter table public.dreams add column if not exists hidden_reason text;
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

-- Admins: can moderate the community side (hide shared dreams, delete comments, reset names,
-- suspend users, handle reports) but, like everyone, never read anyone's private dreams or
-- notes. Nobody can make themselves an admin from the app: this table has no policies or
-- grants, so it's only writable in the SQL editor. To make yourself one, run:
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com';
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

-- Suspended users keep their private journal but can't share to the feed, comment or react,
-- and their shared dreams leave the feed. Only admins write this, through admin_suspend_user().
create table if not exists public.user_suspensions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint user_suspensions_reason_length check (char_length(reason) between 1 and 500)
);
alter table public.user_suspensions enable row level security;

-- security definer so the policies can check these tables, which callers can't read directly.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.is_suspended(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.user_suspensions where user_id = target);
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke execute on function public.is_suspended(uuid) from public, anon;
grant execute on function public.is_suspended(uuid) to authenticated;

drop policy if exists "Users can see their own suspension, admins all" on public.user_suspensions;
create policy "Users can see their own suspension, admins all"
  on public.user_suspensions for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

grant select on public.user_suspensions to authenticated;

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

-- Dreams: public feed by default, with a per-dream private toggle. A private dream is only
-- readable by the user who posted it, admins included. A shared dream is readable by anyone
-- signed in unless a moderator hid it or its dreamer is suspended; admins still see those, so
-- they can review reports and undo it.
drop policy if exists "Dreams are readable by any signed-in user" on public.dreams;
create policy "Dreams are readable by any signed-in user"
  on public.dreams for select
  to authenticated
  using (
    auth.uid() = user_id
    or (not is_private and hidden_at is null and not public.is_suspended(user_id))
    or (not is_private and public.is_admin())
  );

-- A suspended user can still write, but only private dreams.
drop policy if exists "Users can insert their own dreams" on public.dreams;
create policy "Users can insert their own dreams"
  on public.dreams for insert
  to authenticated
  with check (auth.uid() = user_id and (is_private or not public.is_suspended(auth.uid())));

drop policy if exists "Users can update their own dreams" on public.dreams;
create policy "Users can update their own dreams"
  on public.dreams for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and (is_private or not public.is_suspended(auth.uid())));

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
-- Dreams: the app writes only the dream itself, never hidden_at / hidden_reason (moderators set
-- those through admin_hide_dream). Revoked first so re-running narrows an older, broader grant.
revoke insert, update on public.dreams from authenticated;
grant select, delete on public.dreams to authenticated;
grant insert (user_id, title, body, mood, symbols, is_private, dreamt_on) on public.dreams to authenticated;
grant update (title, body, mood, symbols, is_private, dreamt_on) on public.dreams to authenticated;

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
    and not public.is_suspended(auth.uid())
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
    and not public.is_suspended(auth.uid())
    and exists (select 1 from public.dreams d where d.id = dream_id and not d.is_private)
  );

-- A comment can be removed by whoever wrote it, by the dreamer whose dream it's on, or by an
-- admin.
drop policy if exists "Commenters and dreamers can delete comments" on public.dream_comments;
create policy "Commenters and dreamers can delete comments"
  on public.dream_comments for delete
  to authenticated
  using (
    auth.uid() = user_id
    or exists (select 1 from public.dreams d where d.id = dream_id and d.user_id = auth.uid())
    or public.is_admin()
  );

grant select, insert, delete on public.dream_reactions to authenticated;
grant select, insert, delete on public.dream_comments to authenticated;

-- Reports of shared dreams, comments and users, for admins to review. Filed only through
-- report_content(), which works out who is being reported from the thing reported, so that
-- can't be faked; nobody but an admin can read them.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('dream', 'comment', 'user')),
  -- Kept when the dream or comment is deleted, so the report still says what happened.
  dream_id uuid references public.dreams (id) on delete set null,
  comment_id uuid references public.dream_comments (id) on delete set null,
  reported_user_id uuid not null references auth.users (id) on delete cascade,
  -- Mirrors REPORT_REASONS in src/lib/moderation.ts.
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'other')),
  details text check (details is null or char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

-- One open report per person per thing: reporting it again changes nothing.
create unique index if not exists reports_one_open_per_reporter
  on public.reports (reporter_id, kind, coalesce(comment_id, dream_id, reported_user_id))
  where status = 'open';
create index if not exists reports_open_idx on public.reports (created_at) where status = 'open';

alter table public.reports enable row level security;

drop policy if exists "Admins can read reports" on public.reports;
create policy "Admins can read reports"
  on public.reports for select
  to authenticated
  using (public.is_admin());

grant select on public.reports to authenticated;

-- Views are dropped and re-created rather than replaced in place, so this file can also take
-- columns away (create or replace view can only add them at the end).
drop view if exists public.dream_comments_with_authors;
create view public.dream_comments_with_authors
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
drop view if exists public.dreams_with_authors;
create view public.dreams_with_authors
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
  (select count(*) from public.dream_comments c where c.dream_id = d.id) as comment_count,
  (select count(*) from public.dream_reactions r where r.dream_id = d.id) as reaction_count,
  exists (
    select 1 from public.dream_reactions r where r.dream_id = d.id and r.user_id = auth.uid()
  ) as reacted_by_me,
  d.hidden_at,
  d.hidden_reason,
  -- The suspensions policy lets people see only their own row (admins all), so this is true only
  -- for your own dreams while you're suspended, or for an admin looking at a suspended user's.
  exists (select 1 from public.user_suspensions s where s.user_id = d.user_id) as author_suspended
from public.dreams d
left join public.profiles p on p.user_id = d.user_id;

grant select on public.dreams_with_authors to authenticated;

-- Reports with what they're about, for the admin page. security_invoker: only admins get rows,
-- and a dream that has since been made private shows no title or text, even to admins.
drop view if exists public.reports_with_details;
create view public.reports_with_details
  with (security_invoker = true)
as
select
  r.id,
  r.kind,
  r.reason,
  r.details,
  r.status,
  r.created_at,
  r.reporter_id,
  coalesce(rp.display_name, 'Dreamer') as reporter_name,
  r.reported_user_id,
  coalesce(up.display_name, 'Dreamer') as reported_user_name,
  exists (select 1 from public.user_suspensions s where s.user_id = r.reported_user_id)
    as reported_user_suspended,
  r.dream_id,
  d.title as dream_title,
  left(d.body, 300) as dream_preview,
  d.hidden_at as dream_hidden_at,
  r.comment_id,
  c.body as comment_body,
  c.dream_id as comment_dream_id
from public.reports r
left join public.profiles rp on rp.user_id = r.reporter_id
left join public.profiles up on up.user_id = r.reported_user_id
left join public.dreams d on d.id = r.dream_id
left join public.dream_comments c on c.id = r.comment_id;

grant select on public.reports_with_details to authenticated;

-- The home page leaderboard: dreamers ranked by how many dreams they've logged, private
-- ones included. security definer because the dreams policies hide other people's private
-- dreams; it returns only names and counts, never dream content. Gives the top 10 plus the
-- caller's own row, so they can see where they stand even outside the top 10.
-- Dropped first: create or replace can't change the columns a function returns.
drop function if exists public.dream_leaderboard();
create function public.dream_leaderboard()
returns table (user_id uuid, display_name text, dream_count bigint, rank bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with ranked as (
    select
      p.user_id,
      p.display_name,
      count(d.id) as dream_count,
      rank() over (order by count(d.id) desc) as rank
    from public.profiles p
    join public.dreams d on d.user_id = p.user_id
    group by p.user_id, p.display_name
  )
  select r.user_id, r.display_name, r.dream_count, r.rank
  from ranked r
  where r.rank <= 10 or r.user_id = auth.uid()
  order by r.rank, r.display_name;
$$;

revoke execute on function public.dream_leaderboard() from public, anon;
grant execute on function public.dream_leaderboard() to authenticated;

-- Files a report. `target` is the dream, comment or user being reported, by `kind`. Only things
-- the reporter can see count (shared dreams, comments on them, existing users), and nobody can
-- report themselves. Reporting the same thing again while it's open does nothing.
create or replace function public.report_content(kind text, target uuid, reason text, details text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
  report_dream uuid;
  report_comment uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if kind = 'dream' then
    select d.user_id, d.id into owner, report_dream
    from public.dreams d where d.id = target and not d.is_private;
  elsif kind = 'comment' then
    select c.user_id, c.id, c.dream_id into owner, report_comment, report_dream
    from public.dream_comments c
    join public.dreams d on d.id = c.dream_id
    where c.id = target and not d.is_private;
  elsif kind = 'user' then
    select p.user_id into owner from public.profiles p where p.user_id = target;
  else
    raise exception 'report_target_missing';
  end if;

  if owner is null then
    raise exception 'report_target_missing';
  end if;
  if owner = auth.uid() then
    raise exception 'report_own';
  end if;

  insert into public.reports (reporter_id, kind, dream_id, comment_id, reported_user_id, reason, details)
  values (auth.uid(), kind, report_dream, report_comment, owner, reason, nullif(trim(details), ''))
  on conflict do nothing;
end;
$$;

revoke execute on function public.report_content(text, uuid, text, text) from public, anon;
grant execute on function public.report_content(text, uuid, text, text) to authenticated;

-- Admin actions. Each checks is_admin() itself; security definer so they can change rows the
-- app otherwise can't (other people's dreams and profiles, suspensions, reports).
create or replace function public.admin_hide_dream(dream uuid, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  update public.dreams
  set hidden_at = now(), hidden_reason = nullif(trim(reason), '')
  where id = dream;
end;
$$;

create or replace function public.admin_unhide_dream(dream uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  update public.dreams set hidden_at = null, hidden_reason = null where id = dream;
end;
$$;

create or replace function public.admin_suspend_user(target uuid, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if exists (select 1 from public.admins where user_id = target) then
    raise exception 'cannot_suspend_admin';
  end if;
  insert into public.user_suspensions (user_id, reason)
  values (target, coalesce(nullif(trim(reason), ''), 'Broke the community rules'))
  on conflict (user_id) do update set reason = excluded.reason;
end;
$$;

create or replace function public.admin_unsuspend_user(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  delete from public.user_suspensions where user_id = target;
end;
$$;

-- For offensive display names: sets it back to the default.
create or replace function public.admin_reset_display_name(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  update public.profiles set display_name = 'Dreamer' where user_id = target;
end;
$$;

create or replace function public.admin_close_report(report uuid, outcome text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if outcome not in ('resolved', 'dismissed') then
    raise exception 'report_outcome_unknown';
  end if;
  update public.reports set status = outcome, closed_at = now() where id = report and status = 'open';
end;
$$;

-- Counts for the admin page. Numbers only, never anyone's dreams.
create or replace function public.admin_overview()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  return json_build_object(
    'users', (select count(*) from public.profiles),
    'new_users_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'active_users_7d', (
      select count(distinct user_id) from public.dreams where created_at > now() - interval '7 days'
    ),
    'dreams', (select count(*) from public.dreams),
    'dreams_7d', (select count(*) from public.dreams where created_at > now() - interval '7 days'),
    'lucid_dreams', (select count(*) from public.dreams where mood = 'Lucid'),
    'shared_dreams', (select count(*) from public.dreams where not is_private),
    'comments_7d', (
      select count(*) from public.dream_comments where created_at > now() - interval '7 days'
    ),
    'open_reports', (select count(*) from public.reports where status = 'open'),
    'suspended_users', (select count(*) from public.user_suspensions),
    'hidden_dreams', (select count(*) from public.dreams where hidden_at is not null)
  );
end;
$$;

revoke execute on function public.admin_hide_dream(uuid, text) from public, anon;
grant execute on function public.admin_hide_dream(uuid, text) to authenticated;
revoke execute on function public.admin_unhide_dream(uuid) from public, anon;
grant execute on function public.admin_unhide_dream(uuid) to authenticated;
revoke execute on function public.admin_suspend_user(uuid, text) from public, anon;
grant execute on function public.admin_suspend_user(uuid, text) to authenticated;
revoke execute on function public.admin_unsuspend_user(uuid) from public, anon;
grant execute on function public.admin_unsuspend_user(uuid) to authenticated;
revoke execute on function public.admin_reset_display_name(uuid) from public, anon;
grant execute on function public.admin_reset_display_name(uuid) to authenticated;
revoke execute on function public.admin_close_report(uuid, text) from public, anon;
grant execute on function public.admin_close_report(uuid, text) to authenticated;
revoke execute on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;

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

-- Removes the Essence Shop that an earlier version of this file created (frames and titles
-- bought with Dream Essence). Does nothing on a database that never had it. Runs after the
-- views above are re-created without the shop columns, so nothing depends on them any more.
drop function if exists public.buy_essence_item(text);
drop function if exists public.equip_essence_item(text, text);
alter table public.profiles drop column if exists avatar_frame;
alter table public.profiles drop column if exists title;
drop table if exists public.essence_purchases;
drop table if exists public.shop_items;
