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
    db.ts             Dexie (IndexedDB) schema + Task types; the UI reads/writes here
    tasks.ts          addTask/updateTask/deleteTask/restoreTask/toggleComplete + live hooks
    sync.ts           syncNow()/scheduleSync(): push dirty rows, pull by updated_at
    dates.ts          'yyyy-MM-dd' local-date helpers, time formatting
    task-types.ts     To Do / Event / Reminder / Milestone labels, icons, colours
    task-groups.ts    groupTasks(): Overdue / Today / Upcoming / Anytime / Completed
    reminders.ts      Start/end reminders: scheduler, messages, device alerts, bell data
    summary.ts        Home overview numbers
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
- **Tasks are local-first:** components never call Supabase for tasks. Write through `lib/tasks.ts` (it marks rows `dirty` and schedules a sync); read with `useLiveQuery` hooks. `Layout` syncs on open, on reconnect, on return to foreground and every minute.
- **Task rows:** always render tasks with `components/TaskItem.tsx`; use `SortableTaskList` for drag-and-drop. Manual order is the `position` column; `reorderTask()` saves only the moved task (fractional position between neighbours). The Calendar orders a day by time instead.
- **Add/edit/delete UI:** open the sheet with `useTaskSheet().open({ date })` or `open({ task })`; delete with `useTaskSheet().removeTask(id)` so the Undo toast appears.
- **Reminders:** any task with a date + start time reminds at the start ("Dear {first name}, It is time to {notes, or title}.") and at the end time if set ("Dear {first name}, Your reminder "{title}" has ended."). `components/Reminders.tsx` (mounted in `Layout`) runs the scheduler and shows the in-app banner; fired reminders are stored in the local `notifications` table (id `taskId:kind:time`, so each fires once) and listed by `NotificationBell`. System notifications go through the service worker (`public/sw-notify.js` handles taps). They only fire while the app is open or in the background; alerts with the app fully closed need Web Push (not built yet).
- **Avatars** are stored at `avatars/<user id>/avatar-<timestamp>.<ext>`; uploading removes the user's older files.
- **Responsive (must work on Android, iOS, tablet, desktop):**
  - Phones (< `md`, 768px): single column, floating `BottomNav`. Test at 320px and 375px wide, and in landscape.
  - Tablets (`md`): `Sidebar` as an icon rail; content up to `max-w-3xl`.
  - Desktop (`lg`+): labelled `Sidebar`; content up to `max-w-5xl`. Use extra width for multi-column layouts (e.g. `lg:grid-cols-2`), not stretched single columns.
  - Respect notches/home bars with `env(safe-area-inset-*)` (see `Layout.tsx`).
  - Touch targets at least 44px. Form fields stay 16px on touch screens (smaller makes iOS zoom in).
  - Nav items live in `components/nav.ts`; both navs read from it.
  - Use `min-h-dvh`/`h-dvh`, not `100vh` (mobile browser bars).
- Handle `localStorage` access in try/catch (it can throw in private mode).

## Roadmap
1. ~~Layout, theme, bottom nav~~
2. ~~Home: greeting, Overview cards (Today / Planned / Overdue / Completed) with period picker, Up next, progress ring~~ (`lib/summary.ts`)
   - Later: Projects (CRUD, sync, project picker in the task sheet, Projects section on Home)
3. ~~Tasks page: Overdue/Today/Upcoming/Anytime/Completed sections, search, type filter, drag-and-drop reorder~~
4. ~~Calendar: month grid with task dots, tap a day to plan it, add/edit/complete/delete with undo~~
5. ~~Auth + profile photo upload~~
6. ~~Offline sync: Dexie <-> Supabase (push local changes, pull by `updated_at`)~~ (projects still to sync)
7. Integrations: Google Calendar, Slack, email (via Supabase Edge Functions)
