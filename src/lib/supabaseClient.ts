import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Auth and dream-posting are the only features that need Supabase — every other route
// (games, atlas, forum, journal, learn) must keep working even if it's never configured, so
// we warn instead of throwing and let AuthContext/DreamPostContext handle the unconfigured
// state gracefully.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase is not configured. Copy .env.example to .env.local and fill in your project values to enable registration, login, and dream posting. See README.md.',
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
)
