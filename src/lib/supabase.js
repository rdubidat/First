// Supabase client. Live mode activates when both env vars are present at
// build time; otherwise the app runs in zero-setup demo mode (localStorage).

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey) : null

export function isLiveMode() {
  return supabase !== null
}
