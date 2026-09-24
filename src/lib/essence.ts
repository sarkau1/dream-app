import type { DreamPost } from '../types/dream'

export const ESSENCE_LUCID_DREAM = 25

/**
 * Dream Essence is derived from the user's own dreams rather than stored as a counter, so it
 * follows the account across devices, can't be edited client-side, and deleting a dream takes
 * its essence back (no create/delete farming).
 */
export function essenceFromDreams(dreams: DreamPost[]): number {
  return dreams.filter((dream) => dream.mood === 'Lucid').length * ESSENCE_LUCID_DREAM
}
