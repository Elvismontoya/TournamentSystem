import type { ReactNode } from 'react';

type Tone = 'neutral' | 'primary' | 'secondary' | 'tertiary';

const TONES: Record<Tone, string> = {
  neutral: 'bg-neutral-800 text-neutral-300',
  primary: 'bg-primary-500/15 text-primary-300',
  secondary: 'bg-secondary-500/15 text-secondary-400',
  tertiary: 'bg-tertiary-500/15 text-tertiary-400',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 font-display text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
