// Shared Tailwind class strings, so every form, button and card looks and behaves the same.
//
// Mobile notes baked in here:
// - Inputs are text-base (16px) below `sm`: iOS Safari zooms the page into any smaller field.
// - Buttons are at least 44px tall (min-h-11), the smallest comfortable tap target.

/** The look of a text field, without layout; for fields that sit in a row. */
export const fieldClass =
  'block rounded-xl border border-midnight-700 bg-midnight-900/70 px-3.5 py-2.5 text-base text-moon-100 placeholder:text-moon-500 transition-colors focus:border-nebula-400 focus:outline-none focus:ring-2 focus:ring-nebula-400/30 sm:text-sm'

/** A full-width text input or textarea under its label. */
export const inputClass = `mt-1 w-full ${fieldClass}`

export const labelClass = 'block text-sm font-medium text-moon-300'

const buttonBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'

/** The one main action on a page or form. */
export const primaryButtonClass = `${buttonBase} bg-nebula-500 text-white shadow-lg shadow-nebula-500/20 hover:bg-nebula-400`

/** Everything else: cancel, log in, load more. */
export const secondaryButtonClass = `${buttonBase} border border-midnight-700 text-moon-300 hover:border-midnight-600 hover:bg-midnight-800/60 hover:text-moon-100`

/** Destructive actions. */
export const dangerButtonClass = `${buttonBase} bg-rose-500 text-white hover:bg-rose-400`

/** The first, reversible step towards a destructive action (e.g. "Delete..." that opens a confirm). */
export const dangerOutlineButtonClass = `${buttonBase} border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200`

/** A panel: dream cards, form sections, stats. */
export const cardClass = 'rounded-2xl border border-midnight-700/80 bg-midnight-900/60'

export const errorTextClass = 'text-sm text-rose-400'
