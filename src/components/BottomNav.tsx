import { CalendarDays, FileText, House, MessageCircleMore, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

type TabDef = { to: string; label: string; icon: LucideIcon }

const tabs: TabDef[] = [
  { to: '/', label: 'Home', icon: House },
  { to: '/inbox', label: 'Inbox', icon: MessageCircleMore },
  { to: '/tasks', label: 'Tasks', icon: FileText },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
]

function Tab({ to, label, icon: Icon }: TabDef) {
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

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between rounded-[28px] bg-surface px-4 py-3 shadow-[0_8px_30px_rgba(40,20,120,0.10)]">
        <Tab {...tabs[0]} />
        <Tab {...tabs[1]} />
        {/* Wired up to the add-task sheet in step 3. */}
        <button
          type="button"
          aria-label="Add task"
          className="grid size-14 place-items-center rounded-2xl bg-ink text-bg transition-transform active:scale-95"
        >
          <Plus size={28} strokeWidth={2.25} />
        </button>
        <Tab {...tabs[2]} />
        <Tab {...tabs[3]} />
      </div>
    </nav>
  )
}
