import { Printer } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { printInPage, printUrl } from './printing.ts';

/**
 * Prints a print page (planilla or bracket) of the competition shown, right here: the
 * browser's print dialog opens over the current page, no new tab.
 */
export function PrintLink({
  competition,
  path,
  label,
  compact = false,
}: {
  /** Competition key ("Sub 19 · Femenino"). */
  competition: string;
  /** Page inside /imprimir ("grupo/0", "partido/1/3", "llaves/completa"). */
  path: string;
  label: string;
  /** Icon only (the label goes to screen readers and the tooltip). */
  compact?: boolean;
}) {
  const { slug = '' } = useParams();
  return (
    <button
      type="button"
      title={label}
      onClick={() => {
        printInPage(printUrl(slug, competition, path));
      }}
      className={
        compact
          ? 'grid size-8 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white'
          : 'inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-700 px-3 font-display text-sm font-medium text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white'
      }
    >
      <Printer className="size-4" aria-hidden="true" />
      {compact ? <span className="sr-only">{label}</span> : label}
    </button>
  );
}
