import { Camera, LoaderCircle } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { displayName, useAuth } from '../lib/auth-context.ts'
import { uploadAvatar } from '../lib/avatar.ts'
import Avatar from './Avatar.tsx'

/** The user's avatar; tapping it opens the file picker to upload a new photo. */
export default function AvatarPicker({ size = 48 }: { size?: number }) {
  const { user, profile, updateProfile } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    setBusy(true)
    setError(null)
    try {
      const url = await uploadAvatar(user.id, file)
      await updateProfile({ avatar_url: url })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const badge = Math.max(18, Math.round(size * 0.38))

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="Change profile photo"
        className="relative block rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Avatar name={displayName(user, profile)} src={profile?.avatar_url} size={size} />
        {busy && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-white">
            <LoaderCircle size={size * 0.4} className="animate-spin" />
          </span>
        )}
        <span
          className="absolute -right-0.5 -bottom-0.5 grid place-items-center rounded-full border-2 border-bg bg-accent text-white"
          style={{ width: badge, height: badge }}
        >
          <Camera size={badge * 0.55} strokeWidth={2.25} />
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onPick} />
      {error && (
        <p role="alert" className="absolute top-full left-0 z-10 mt-2 w-60 rounded-xl bg-red-600 px-3 py-2 text-xs text-white shadow-lg">
          {error}
        </p>
      )}
    </div>
  )
}
