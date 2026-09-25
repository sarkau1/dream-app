import {
  MAX_BODY_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_SYMBOLS,
  MAX_TITLE_LENGTH,
} from '../types/dream'

// Check constraints from supabase/schema.sql, by name, in words a dreamer understands.
const CONSTRAINT_MESSAGES: Record<string, string> = {
  dreams_title_length: `The title can be up to ${MAX_TITLE_LENGTH} characters.`,
  dreams_body_length: `The dream can be up to ${MAX_BODY_LENGTH.toLocaleString()} characters.`,
  dreams_mood_known: 'That mood isn’t one of the options.',
  dreams_symbols_count: `A dream can have up to ${MAX_SYMBOLS} signs.`,
  dreams_dreamt_on_not_future: 'The dream’s date can’t be in the future.',
  profiles_display_name_length: `Display names can be up to ${MAX_DISPLAY_NAME_LENGTH} characters.`,
}

const OUTDATED_SCHEMA =
  'The database is missing a recent update. Re-run supabase/schema.sql in the Supabase SQL editor.'

/**
 * Turns an error message from Supabase (or fetch) into something to show on screen. Messages
 * that are already meant for people, like "Invalid login credentials", pass through unchanged.
 */
export function friendlyError(message: string): string {
  for (const [constraint, text] of Object.entries(CONSTRAINT_MESSAGES)) {
    if (message.includes(constraint)) return text
  }
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
    return 'Can’t reach the server. Check your connection and try again.'
  }
  if (/row-level security/i.test(message)) return 'You don’t have permission to do that.'
  if (/JSON object requested|multiple \(or no\) rows/i.test(message)) {
    return 'That couldn’t be found. It may have been deleted.'
  }
  // PostgREST's wording when a table, view or function in schema.sql hasn't been created yet.
  if (/schema cache|does not exist/i.test(message)) return OUTDATED_SCHEMA
  if (/JWT expired|invalid JWT/i.test(message)) return 'Your session expired. Log in again.'
  return message
}
