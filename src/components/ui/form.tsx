import type {
  ComponentProps,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

const controlClass =
  'mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-850 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/30';

/** Red asterisk after the label of a required field. */
export function RequiredMark() {
  return (
    <span className="ml-0.5 text-red-400" aria-hidden="true">
      *
    </span>
  );
}

interface FieldProps {
  id: string;
  label: string;
  /** Required field: a red * after the label. */
  required?: boolean;
  /** Optional helper text shown under the control. */
  hint?: string;
  /**
   * What is wrong with the value, shown in red under the control (instead of the hint).
   * Give the control aria-invalid and aria-describedby `${id}-error` too.
   */
  error?: string;
  children: ReactNode;
}

export function Field({ id, label, required, hint, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block font-display text-sm font-medium text-neutral-300">
        {label}
        {required && <RequiredMark />}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-300">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1 text-xs text-neutral-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function Textarea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${controlClass} ${className}`} {...props} />;
}

export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return <input className={`${controlClass} ${className}`} {...props} />;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: string[];
  /** Options shown but not selectable (e.g. "(próximamente)"). */
  disabledOptions?: string[];
}

export function Select({ options, disabledOptions = [], className = '', ...props }: SelectProps) {
  return (
    <select
      // Uncontrolled selects start on the placeholder; controlled ones (value) must not get both.
      {...(props.value === undefined ? { defaultValue: '' } : {})}
      className={`${controlClass} ${className}`}
      {...props}
    >
      <option value="" disabled>
        Selecciona…
      </option>
      {options.map((option) => (
        <option key={option} value={option} disabled={disabledOptions.includes(option)}>
          {disabledOptions.includes(option) ? `${option} (próximamente)` : option}
        </option>
      ))}
    </select>
  );
}
