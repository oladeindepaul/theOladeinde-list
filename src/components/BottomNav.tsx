import { Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { navItems, type NavItem } from './nav.ts'

function Tab({ to, label, icon: Icon }: NavItem) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      aria-label={label}
      className={({ isActive }) =>
        `grid size-12 place-items-center rounded-2xl transition-colors ${
          isActive ? 'text-accent' : 'text-muted hover:text-ink'
        }`
      }
    >
      {({ isActive }) => (
        <Icon
          size={24}
          strokeWidth={isActive ? 2.25 : 1.75}
          fill={isActive ? 'currentColor' : 'none'}
          fillOpacity={0.15}
        />
      )}
    </NavLink>
  )
}

/** Phone navigation. Hidden from tablet width up, where the Sidebar takes over. */
export default function BottomNav() {
  const [home, inbox, tasks, calendar] = navItems
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-xl px-[max(1rem,env(safe-area-inset-left))] pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="flex items-center justify-between rounded-[28px] bg-surface px-3 py-2.5 shadow-[0_8px_30px_rgba(40,20,120,0.10)] min-[380px]:px-4 min-[380px]:py-3">
        <Tab {...home} />
        <Tab {...inbox} />
        {/* Wired up to the add-task sheet in step 3. */}
        <button
          type="button"
          aria-label="Add task"
          className="grid size-14 place-items-center rounded-2xl bg-ink text-bg transition-transform active:scale-95"
        >
          <Plus size={28} strokeWidth={2.25} />
        </button>
        <Tab {...tasks} />
        <Tab {...calendar} />
      </div>
    </nav>
  )
}
