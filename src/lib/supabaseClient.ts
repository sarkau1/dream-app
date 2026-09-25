import { AuthClient } from '@supabase/auth-js'
import { PostgrestClient } from '@supabase/postgrest-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Auth and dream-posting are the only features that need Supabase, and the rest of the site
// must keep working if it's never configured, so we warn instead of throwing and let
// AuthContext/DreamPostContext handle the unconfigured state gracefully.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const NOT_CONFIGURED_ERROR =
  'This site is not connected to Supabase yet. See README.md to set it up.'

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase is not configured. Copy .env.example to .env.local and fill in your project values to enable registration, login, and dream posting. See README.md.',
  )
}

// We only use auth and the database, so instead of @supabase/supabase-js (which also bundles
// storage, realtime and functions clients) this wires the two sub-clients together the same
// way supabase-js's createClient does.
const url = new URL(supabaseUrl || 'https://placeholder.supabase.co')
const key = supabaseAnonKey || 'placeholder-anon-key'

const auth = new AuthClient({
  url: new URL('auth/v1', url).href,
  headers: { Authorization: `Bearer ${key}`, apikey: key },
  // Same key supabase-js uses, so sessions saved before this change stay signed in.
  storageKey: `sb-${url.hostname.split('.')[0]}-auth-token`,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  flowType: 'implicit',
})

// Every database request carries the signed-in user's JWT (falling back to the anon key), which
// is what the Row Level Security policies in supabase/schema.sql check against.
async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit) {
  const { data } = await auth.getSession()
  const headers = new Headers(init?.headers)
  if (!headers.has('apikey')) headers.set('apikey', key)
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${data.session?.access_token ?? key}`)
  }
  return fetch(input, { ...init, headers })
}

const rest = new PostgrestClient(new URL('rest/v1', url).href, { fetch: fetchWithAuth })

export const supabase = {
  auth,
  from: (table: string) => rest.from(table),
}
