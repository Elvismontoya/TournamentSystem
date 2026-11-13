import type {
  ComponentProps,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

const controlClass =
  'mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-850 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none';

interface FieldProps {
  id: string;
  label: string;
  /** Optional helper text shown under the control. */
  hint?: string;
  children: ReactNode;
}

export function Field({ id, label, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block font-display text-sm font-medium text-neutral-300">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-neutral-500">
          {hint}
        </p>
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
}

export function Select({ options, className = '', ...props }: SelectProps) {
  return (
    <select defaultValue="" className={`${controlClass} ${className}`} {...props}>
      <option value="" disabled>
        Selecciona…
      </option>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}
