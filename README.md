# Oladeinde List

A mobile-first to-do and project app with dark mode, offline support, drag-and-drop, profile photos, and Google Calendar, Slack and email integrations.

Built with React, TypeScript, Vite, Tailwind CSS and Supabase. See [AGENTS.md](AGENTS.md) for architecture and conventions.

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL and publishable key.
3. In Supabase, open **SQL Editor**, paste [supabase/schema.sql](supabase/schema.sql) and run it.
4. `npm run dev` and open http://localhost:5173

## Deploy to Vercel
1. Push this repo to GitHub.
2. In Vercel: **Add New → Project**, import the repo. Framework is detected as Vite.
3. Under **Environment Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Deploy, then add your Vercel URL (e.g. `https://your-app.vercel.app/**`) to Supabase **Authentication → URL Configuration → Redirect URLs**.
