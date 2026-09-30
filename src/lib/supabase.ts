import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabaseConfigured = Boolean(url && key)

// Placeholders keep the app from crashing when env vars are missing; the login
// page shows a setup message instead.
export const supabase = createClient(url || 'http://localhost', key || 'missing-key')
