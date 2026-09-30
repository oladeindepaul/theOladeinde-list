# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Cursor, etc.) working on **Oladeinde List**.

## What this is
A mobile-first to-do / project app installable as a PWA. Screens: Home (overview cards + projects), Inbox (Slack/email updates), Tasks, Calendar, Settings. Visual design follows a soft lavender, card-based inspo: purple accent `#6c47ff`, pastel stat cards, rounded 16–28px corners, floating bottom nav with a black "+" button.

## Stack
- React 19 + TypeScript + Vite (rolldown), React Router 7
- Tailwind CSS v4 via `@tailwindcss/vite` (config lives in `src/index.css`, no `tailwind.config.js`)
- Supabase: auth (Google OAuth + email/password), Postgres with RLS, Storage (`avatars` bucket)
- Offline: `vite-plugin-pwa` (service worker) + Dexie/IndexedDB for local-first data
- Drag and drop: `@dnd-kit`; icons: `lucide-react`; dates: `date-fns`
- Hosting: Vercel (`vercel.json` rewrites all routes to `index.html`)

## Commands
```bash
npm install        # install deps
npm run dev        # dev server on http://localhost:5173
npm run build      # type-check (tsc -b) + production build; must pass before committing
npm run lint       # oxlint
```

## Environment
Copy `.env.example` to `.env.local`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable/anon key only)

Never add the Supabase secret / `service_role` key to this repo or any `VITE_` variable — everything prefixed `VITE_` ships to the browser. Server-only secrets (Slack, email, Google client secret) belong in Supabase Edge Function secrets, not here.

## Layout
```
src/
  main.tsx            Router + AuthProvider
  App.tsx             Routes; everything except /login sits behind <RequireAuth>
  index.css           Tailwind import, design tokens, light/dark CSS variables
  lib/
    supabase.ts       Supabase client
    auth.tsx          AuthProvider; caches profile for offline
    auth-context.ts   useAuth(), displayName(), Profile type (import these, not auth.tsx)
    avatar.ts         Resize + upload profile photo to Storage
    theme.ts          useTheme(): light / dark / system, stored in localStorage
  components/         Layout, BottomNav, Avatar, AvatarPicker, PageHeader, RequireAuth
  pages/              One file per route
supabase/schema.sql   Tables, RLS policies, triggers, storage bucket (idempotent; run in SQL Editor)
```

## Conventions
- **Colors:** use the theme tokens (`bg-bg`, `bg-surface`, `bg-surface-2`, `text-ink`, `text-muted`, `border-line`, `bg-accent`, `bg-card-purple|peach|sky|mint`). Don't hard-code hex values in components; add a token in `src/index.css` with both light (`:root`) and dark (`.dark`) values.
- **Dark mode** is class-based (`.dark` on `<html>`); `index.html` applies it before first paint.
- **Imports** include the `.ts`/`.tsx` extension (`allowImportingTsExtensions`).
- **Components:** function components, default export per file; Tailwind classes inline.
- **Data:** every table has `user_id` + RLS "users manage own rows". IDs are UUIDs generated on the client so records can be created offline; deletes are soft (`deleted_at`) so they sync. Any schema change goes in `supabase/schema.sql` and must stay re-runnable (`if not exists`, `drop policy if exists`).
- **Avatars** are stored at `avatars/<user id>/avatar-<timestamp>.<ext>`; uploading removes the user's older files.
- Keep the app usable at 375px wide; content column is `max-w-md`.
- Handle `localStorage` access in try/catch (it can throw in private mode).

## Roadmap
1. ~~Layout, theme, bottom nav~~
2. Home: overview stat cards + Projects section (tabs, edit/delete menu)
3. Tasks: CRUD, complete, drag-and-drop reorder, add-task sheet from the "+" button, stored in Dexie
4. Calendar: month grid with task dots + Today's Task list
5. ~~Auth + profile photo upload~~
6. Offline sync: Dexie <-> Supabase (push local changes, pull by `updated_at`)
7. Integrations: Google Calendar, Slack, email (via Supabase Edge Functions)
