import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export type Profile = { id: string; full_name: string | null; avatar_url: string | null }
export type ProfilePatch = Partial<Pick<Profile, 'full_name' | 'avatar_url'>>

export type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  updateProfile: (patch: ProfilePatch) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function displayName(user: User | null, profile: Profile | null) {
  return profile?.full_name?.trim() || user?.email?.split('@')[0] || 'there'
}
