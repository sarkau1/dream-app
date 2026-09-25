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
