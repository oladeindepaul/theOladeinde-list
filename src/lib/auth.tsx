import type { Session, User } from '@supabase/supabase-js'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type Profile, type ProfilePatch } from './auth-context.ts'
import { supabase } from './supabase.ts'

// The last-known profile is cached so the name and photo still show offline.
const cacheKey = (id: string) => `profile:${id}`

function readCachedProfile(id: string): Profile | null {
  try {
    const raw = localStorage.getItem(cacheKey(id))
    return raw ? (JSON.parse(raw) as Profile) : null
  } catch {
    return null
  }
}

function cacheProfile(p: Profile) {
  try {
    localStorage.setItem(cacheKey(p.id), JSON.stringify(p))
  } catch {
    // Not critical.
  }
}

function profileFromMetadata(user: User): Profile {
  const meta = user.user_metadata ?? {}
  return {
    id: user.id,
    full_name: meta.full_name ?? meta.name ?? null,
    avatar_url: meta.avatar_url ?? meta.picture ?? null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => subscription.unsubscribe()
  }, [])

  const user = session?.user ?? null

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const fallback = readCachedProfile(user.id) ?? profileFromMetadata(user)
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        const next = error || !data ? fallback : (data as Profile)
        setProfile(next)
        if (data) cacheProfile(next)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  // Until the fetch lands, show the cached profile or what was given at sign-up.
  const currentProfile = !user
    ? null
    : profile?.id === user.id
      ? profile
      : (readCachedProfile(user.id) ?? profileFromMetadata(user))

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      if (!user) throw new Error('Not signed in')
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...patch })
        .select('id, full_name, avatar_url')
        .single()
      if (error) throw error
      setProfile(data as Profile)
      cacheProfile(data as Profile)
    },
    [user],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, profile: currentProfile, loading, updateProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
