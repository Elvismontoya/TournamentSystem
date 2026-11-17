import { LoaderCircle, Printer } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Outlet, useParams, useSearchParams } from 'react-router-dom';
import { useTournament } from '../../features/tournament/useTournament.ts';

// Print pages (opened in a new tab): a white sheet with only what goes on paper. The bar
// with the buttons isn't printed. The print dialog opens by itself once the data is in.

export function PrintLayout() {
  const { slug = '' } = useParams();
  const [search] = useSearchParams();
  const state = useTournament(slug, search.get('competencia'));
  const printed = useRef(false);

  useEffect(() => {
    if (state.status !== 'ready' || printed.current) return;
    printed.current = true;
    // Let the sheet lay out first.
    const timer = setTimeout(() => {
      window.print();
    }, 400);
    return () => {
      clearTimeout(timer);
    };
  }, [state.status]);

  if (state.status === 'loading') {
    return (
      <p className="flex items-center justify-center gap-2 py-24 text-neutral-500">
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        Preparando la planilla…
      </p>
    );
  }
  if (state.status === 'error') {
    return <p className="py-24 text-center text-red-600">{state.message}</p>;
  }

  return (
    <div className="print-page min-h-svh bg-neutral-200 pb-10 text-black print:bg-white print:pb-0">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-neutral-300 bg-white px-6 py-3">
        <p className="text-sm text-neutral-600">
          {state.tournament.view.name} · {state.tournament.view.category}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              window.close();
            }}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => {
              window.print();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            <Printer className="size-4" aria-hidden="true" />
            Imprimir
          </button>
        </div>
      </div>
      <Outlet context={state.tournament} />
    </div>
  );
}

/** A printed sheet: A4 width on screen (with a shadow), the page itself on paper. */
export function Sheet({
  landscape = false,
  children,
}: {
  landscape?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`sheet mx-auto mt-6 bg-white p-[10mm] font-sans text-[11px] leading-tight text-black shadow-lg print:mt-0 print:p-0 print:shadow-none ${
        landscape ? 'w-[297mm]' : 'w-[210mm]'
      }`}
    >
      {children}
    </div>
  );
}
