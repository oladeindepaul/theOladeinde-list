import { Eye, EyeOff, LoaderCircle, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context.ts'
import { supabase, supabaseConfigured } from '../lib/supabase.ts'

type Mode = 'signin' | 'signup'

const inputClass =
  'w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-base outline-none placeholder:text-muted focus:border-accent'

type PasswordInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete: string
}

/** Password field that hides the text as dots, with an eye button to show or hide it. */
function PasswordInput({ value, onChange, placeholder, autoComplete }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye

  return (
    <div className="relative">
      <input
        className={`${inputClass} pr-14`}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        minLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute top-1/2 right-2 grid size-10 -translate-y-1/2 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-ink"
      >
        <Icon size={20} />
      </button>
    </div>
  )
}

export default function LoginPage() {
  const { session, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  if (!loading && session) return <Navigate to="/" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() }, emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        // No session means Supabase wants the email confirmed first.
        if (!data.session) setCheckEmail(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-[max(1.5rem,env(safe-area-inset-left))] py-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="mb-8 text-center">
        <img src="/favicon.svg" alt="" className="mx-auto mb-5 size-16" />
        <h1 className="text-3xl font-bold tracking-tight">Oladeinde List</h1>
        <p className="mt-2 text-muted">Tasks, projects and your calendar in one place.</p>
      </div>

      {!supabaseConfigured ? (
        <p role="alert" className="rounded-2xl bg-red-600/10 p-4 text-sm text-red-600">
          Supabase isn&apos;t configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local (or
          your Vercel environment variables) and restart.
        </p>
      ) : checkEmail ? (
        <div className="rounded-3xl bg-surface p-6 text-center">
          <MailCheck className="mx-auto mb-3 text-accent" size={36} />
          <h2 className="text-lg font-semibold">Check your email</h2>
          <p className="mt-2 text-sm text-muted">
            We sent a confirmation link to <span className="font-medium text-ink">{email}</span>. Open it to finish
            signing up.
          </p>
          <button
            type="button"
            onClick={() => {
              setCheckEmail(false)
              switchMode('signin')
            }}
            className="mt-5 text-sm font-semibold text-accent"
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <div className="rounded-3xl bg-surface p-6 shadow-[0_8px_30px_rgba(40,20,120,0.06)]">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1" role="tablist">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`rounded-xl py-2 text-sm font-semibold transition-colors ${
                  mode === m ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' && (
              <input
                className={inputClass}
                placeholder="Full name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <input
              className={inputClass}
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder={mode === 'signup' ? 'Password (at least 6 characters)' : 'Password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 font-semibold text-white transition-opacity disabled:opacity-60"
            >
              {busy && <LoaderCircle size={18} className="animate-spin" />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
