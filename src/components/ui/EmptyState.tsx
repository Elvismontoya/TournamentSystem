import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  text: string;
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, text, children }: EmptyStateProps) {
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-neutral-700 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-primary-500/15 text-primary-300">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <p className="font-display font-medium text-white">{title}</p>
      <p className="max-w-sm text-sm text-neutral-400">{text}</p>
      {children && <div className="mt-2 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
