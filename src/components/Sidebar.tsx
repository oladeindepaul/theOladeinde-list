import { Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { displayName, useAuth } from '../lib/auth-context.ts'
import Avatar from './Avatar.tsx'
import { navItems } from './nav.ts'

/**
 * Tablet and desktop navigation. An icon rail on tablets (md), expanding to a
 * labelled sidebar on desktops (lg). Hidden on phones, which use BottomNav.
 */
export default function Sidebar() {
  const { user, profile } = useAuth()
  const name = displayName(user, profile)

  return (
    <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col overflow-y-auto border-r [scrollbar-width:none] border-line bg-surface py-6 pl-[env(safe-area-inset-left)] md:flex md:w-[88px] lg:w-64">
      <div className="mb-8 flex shrink-0 items-center gap-3 px-5 lg:px-6">
        <img src="/favicon.svg" alt="" className="size-10 shrink-0 rounded-xl" />
        <span className="hidden text-lg font-bold tracking-tight lg:inline">Oladeinde List</span>
      </div>

      {/* Wired up to the add-task sheet in step 3. */}
      <div className="mb-6 shrink-0 px-4 lg:px-5">
        <button
          type="button"
          aria-label="Add task"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink font-semibold text-bg transition-transform active:scale-[0.98]"
        >
          <Plus size={22} strokeWidth={2.25} />
          <span className="hidden lg:inline">New task</span>
        </button>
      </div>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-4 lg:px-5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={label}
            className={({ isActive }) =>
              `flex h-12 items-center justify-center gap-3 rounded-2xl px-3 font-medium transition-colors lg:justify-start ${
                isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-2 hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} className="shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <NavLink
        to="/settings"
        title={name}
        className="mx-4 mt-4 flex shrink-0 items-center justify-center gap-3 rounded-2xl p-2 hover:bg-surface-2 lg:mx-5 lg:justify-start"
      >
        <Avatar name={name} src={profile?.avatar_url} size={40} />
        <span className="hidden min-w-0 lg:block">
          <span className="block truncate text-sm font-semibold">{name}</span>
          <span className="block truncate text-xs text-muted">{user?.email}</span>
        </span>
      </NavLink>
    </aside>
  )
}
