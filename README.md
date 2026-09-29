# Lucent Dreaming

A dream journaling site. Register, keep a journal of your dreams (private by default), and
share the ones you choose to a community feed. Tag the symbols you notice and the Dream Web
shows how your dreams connect. Logging a lucid dream earns Dream Essence (25 per lucid dream,
derived from your saved dreams).

## Stack

- React 19 + Vite + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com) for auth and the `dreams` table (Postgres + Row Level
  Security)
- Deployed to GitHub Pages via GitHub Actions

## Local setup

1. `npm install`
2. Create a free project at [supabase.com](https://supabase.com).
3. In the Supabase SQL editor, run [`supabase/schema.sql`](supabase/schema.sql) to create the
   `profiles` and `dreams` tables and their security policies.
4. Copy `.env.example` to `.env.local` and fill in your project's URL and anon key (Project
   Settings -> API).
5. For the links in password-reset and email-change emails to work, add your app's
   `/reset-password` and `/profile` URLs under Authentication -> URL Configuration -> Redirect
   URLs, for both local and deployed, e.g. `http://localhost:5173/reset-password`,
   `http://localhost:5173/profile`, `https://<user>.github.io/<repo>/reset-password` and
   `https://<user>.github.io/<repo>/profile`.
6. `npm run dev`

`supabase/schema.sql` is safe to re-run: when you pull a change that adds a column, run the
whole file again to migrate an existing database.

## Installing as an app

The site is a Progressive Web App: in Chrome or Edge (including on Android) it offers **Install
app**, and the home page shows an Install button. It then opens full screen from its own icon.

- `public/manifest.webmanifest`: name, colours, icons and home-screen shortcuts.
- `public/sw.js`: the service worker. Pages always load from the network, so each deploy
  reaches users on their next open; built files are cached so the app opens fast, and
  `public/offline.html` is shown without a connection. Supabase requests are never cached.
  Bump `VERSION` in it only when the worker's own logic changes.
- `public/icon.svg` is the source of the icons; the PNGs were rendered from it at 512, 192 and
  180 (Apple) pixels. Re-render them if it changes.

The service worker is only registered in production builds, so try installing on the deployed
site or with `npm run build && npm run preview`.

## Habits

`/habits` is a private habit tracker. **Today** lists the day's habits to tick off, around a
progress ring; **Mirror** shows the honest numbers: this week's promises kept against last
week's, done and missed per habit, streaks, a Strong / Slipping / Neglected label from the last
30 days, and a 12-week grid where missed days show as gaps. The database keeps it honest: only
today and yesterday can be ticked or unticked, a habit can't be backdated, and stopping one
archives it so its history keeps counting. Habits are visible only to their owner (admins
included) and are part of the JSON export.

## Admins and moderation

Admins can hide shared dreams from the feed, delete any comment, reset offensive display names,
suspend users (they keep their private journal but can't share, comment or react) and work
through reports at `/admin`, which also shows site-wide counts. Nobody, admins included, can read
another user's private dreams or notes through the app.

Anyone signed in can report a shared dream, a comment or a dreamer. Reports are only visible to
admins.

There's no way to become an admin from the app. Add yourself once in the Supabase SQL editor,
using the email you log in with:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'you@example.com';
```

Then log out and back in (or reload) to see the Admin link.

## Checking the access rules

The Row Level Security policies in `supabase/schema.sql` can't be unit tested without a
database, so after changing them, check by hand with two accounts, A and B:

- B can't see A's private dreams: not in the feed, not on A's dreamer page, not at `/dreams/<id>`.
- B never sees A's notes, even on a dream A has shared.
- B can comment on and react to A's shared dreams, but not A's private ones, including a
  shared dream A has since made private.
- B can delete B's own comments. A can delete any comment on A's dreams. B can't delete other
  people's comments on someone else's dream.
- A's dreamer page, seen by A, shows the same counts B sees, which only include shared dreams.
- The home page leaderboard shows B only names and dream counts for others, never titles or text.
- B can't read reports, can't make themselves an admin, and can't unhide a dream a moderator hid.
- Nobody but B can see B's habits. B can't tick a day older than yesterday, backdate a habit,
  or stop one from a past date.
- An admin can't read B's private dreams or notes, but can hide B's shared dreams, delete B's
  comments and suspend B. Suspended, B can still write private dreams but can't share, comment
  or react, and B's shared dreams leave the feed until the suspension is lifted.

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - typecheck and build for production
- `npm run lint` - run oxlint
- `npm test` - run the unit tests (Vitest)

## Deployment

Pushing to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which
builds the app and publishes it to GitHub Pages. It needs two repository secrets set under
Settings -> Secrets and variables -> Actions: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
GitHub Pages itself needs to be enabled once under Settings -> Pages -> Source ->
GitHub Actions.

Every pull request runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (lint + test + build)
so changes get checked before merging.

## Contributing

Pull requests welcome. Open an issue or PR describing the change; CI will lint, test and build it
automatically.
