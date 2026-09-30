import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import AvatarPicker from '../components/AvatarPicker.tsx'
import { displayName, useAuth } from '../lib/auth-context.ts'

export default function HomePage() {
  const { user, profile } = useAuth()

  return (
    <>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AvatarPicker size={52} />
          <Link to="/settings">
            <p className="text-sm text-muted">Welcome</p>
            <p className="text-lg leading-tight font-semibold">{displayName(user, profile)}</p>
          </Link>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid size-12 place-items-center rounded-full border border-line bg-surface"
        >
          <Bell size={22} strokeWidth={1.75} />
        </button>
      </header>

      <p className="mt-10 text-muted">Overview cards and projects come next (step 2).</p>
    </>
  )
}
