import type { InputHTMLAttributes, ReactNode } from 'react'
import { errorTextClass, inputClass, labelClass } from '../styles/ui'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'onChange'> & {
  id: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  /** Shown to the right of the label, e.g. a "Forgot password?" link. */
  labelAside?: ReactNode
  /** Small text under the field. */
  hint?: ReactNode
  /** Keep the label for screen readers only, when a heading already says what the field is. */
  hideLabel?: boolean
}

/** A labelled text input in the shared style. Passes every other prop through to the input. */
export default function TextField({
  id,
  label,
  value,
  onChange,
  labelAside,
  hint,
  hideLabel = false,
  ...inputProps
}: TextFieldProps) {
  const labelElement = (
    <label htmlFor={id} className={hideLabel ? 'sr-only' : labelClass}>
      {label}
    </label>
  )
  return (
    <div>
      {labelAside ? (
        <div className="flex items-baseline justify-between gap-3">
          {labelElement}
          {labelAside}
        </div>
      ) : (
        labelElement
      )}
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        {...inputProps}
      />
      {hint && <p className="mt-1 text-xs text-moon-500">{hint}</p>}
    </div>
  )
}

/** A form's error line; renders nothing without a message. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className={errorTextClass}>
      {message}
    </p>
  )
}
