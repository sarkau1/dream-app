# Dream App

A dream journaling site: register, log in, and post your dreams to a shared feed. Also
includes lucid-dreaming games, a symbol atlas, a forum, and lessons.

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
5. `npm run dev`

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - typecheck and build for production
- `npm run lint` - run oxlint
- `npm run vault:build` - regenerate the Obsidian vault mirror for the Dream Walk game's story
  content (see `scripts/generate-dream-vault.mjs`)

## Deployment

Pushing to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which
builds the app and publishes it to GitHub Pages. It needs two repository secrets set under
Settings -> Secrets and variables -> Actions: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
GitHub Pages itself needs to be enabled once under Settings -> Pages -> Source ->
GitHub Actions.

Every pull request runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (lint + build)
so changes get checked before merging.

## Contributing

Pull requests welcome. Open an issue or PR describing the change; CI will lint and build it
automatically.
