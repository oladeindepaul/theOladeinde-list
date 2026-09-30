import { LoaderCircle, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context.ts'
import { supabase, supabaseConfigured } from '../lib/supabase.ts'

type Mode = 'signin' | 'signup'

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

const inputClass =
  'w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-base outline-none placeholder:text-muted focus:border-accent'

export default function LoginPage() {
  const { session, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<'google' | 'email' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  if (!loading && session) return <Navigate to="/" replace />

  async function signInWithGoogle() {
    setError(null)
    setBusy('google')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    // On success the browser leaves for Google, so we only get here on failure.
    if (error) {
      setError(error.message)
      setBusy(null)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy('email')
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
      setBusy(null)
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
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={busy !== null}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-line bg-surface py-3.5 font-semibold transition-colors hover:bg-surface-2 disabled:opacity-60"
          >
            {busy === 'google' ? <LoaderCircle size={20} className="animate-spin" /> : <GoogleLogo />}
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            or with email
            <span className="h-px flex-1 bg-line" />
          </div>

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
            <input
              className={inputClass}
              type="password"
              placeholder={mode === 'signup' ? 'Password (at least 6 characters)' : 'Password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy !== null}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 font-semibold text-white transition-opacity disabled:opacity-60"
            >
              {busy === 'email' && <LoaderCircle size={18} className="animate-spin" />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
