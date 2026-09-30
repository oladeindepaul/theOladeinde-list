import { CalendarDays, FileText, House, MessageCircleMore, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItem = { to: string; label: string; icon: LucideIcon }

// Bottom nav (phones) shows the first four; the sidebar (tablet/desktop) shows all.
export const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: House },
  { to: '/inbox', label: 'Inbox', icon: MessageCircleMore },
  { to: '/tasks', label: 'Tasks', icon: FileText },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/settings', label: 'Settings', icon: Settings },
]
