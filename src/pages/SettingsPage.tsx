import { LogOut, Monitor, Moon, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import AvatarPicker from '../components/AvatarPicker.tsx'
import PageHeader from '../components/PageHeader.tsx'
import { useAuth } from '../lib/auth-context.ts'
import { useTheme, type ThemeChoice } from '../lib/theme.ts'

const options: { value: ThemeChoice; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

function ProfileSection() {
  const { user, profile, updateProfile } = useAuth()
  const [name, setName] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const value = name ?? profile?.full_name ?? ''
  const dirty = name !== null && name.trim() !== (profile?.full_name ?? '')

  async function save(e: FormEvent) {
    e.preventDefault()
    setStatus('saving')
    try {
      await updateProfile({ full_name: value.trim() || null })
      setName(null)
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="rounded-3xl bg-surface p-5">
      <div className="flex items-center gap-4">
        <AvatarPicker size={72} />
        <div className="min-w-0">
          <p className="font-semibold">Profile photo</p>
          <p className="text-sm text-muted">Tap your picture to change it.</p>
        </div>
      </div>

      <form onSubmit={save} className="mt-5 space-y-2">
        <label htmlFor="full-name" className="text-sm font-medium">
          Name
        </label>
        <div className="flex gap-2">
          <input
            id="full-name"
            value={value}
            onChange={(e) => {
              setName(e.target.value)
              setStatus('idle')
            }}
            autoComplete="name"
            className="min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!dirty || status === 'saving'}
            className="rounded-2xl bg-ink px-5 font-semibold text-bg disabled:opacity-40"
          >
            Save
          </button>
        </div>
        {status === 'saved' && <p className="text-sm text-green-600">Saved.</p>}
        {status === 'error' && (
          <p role="alert" className="text-sm text-red-600">
            Couldn&apos;t save. Check your connection and try again.
          </p>
        )}
        <p className="pt-1 text-sm text-muted">{user?.email}</p>
      </form>
    </section>
  )
}

export default function SettingsPage() {
  const { choice, setChoice } = useTheme()
  const { signOut } = useAuth()

  return (
    <>
      <PageHeader title="Settings" />
      <div className="space-y-4">
        <ProfileSection />

        <section className="rounded-3xl bg-surface p-5">
          <h2 className="mb-3 font-semibold">Appearance</h2>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface-2 p-1">
            {options.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setChoice(value)}
                aria-pressed={choice === value}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  choice === value ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 rounded-3xl bg-surface p-4 font-semibold text-red-600"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </>
  )
}
