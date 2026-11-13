export type ButtonVariant = 'primary' | 'soft' | 'secondary' | 'outlined' | 'ghost';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-500',
  soft: 'bg-primary-200 text-primary-950 hover:bg-primary-100',
  secondary: 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700',
  outlined: 'border border-neutral-700 text-neutral-100 hover:bg-neutral-800',
  ghost: 'text-neutral-300 hover:bg-neutral-800 hover:text-white',
};

/** Shared classes so <Button> and <ButtonLink> look identical. */
export function buttonClass(variant: ButtonVariant, extra = ''): string {
  return `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-display text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${extra}`;
}
