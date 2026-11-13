import { CalendarDays, ChevronRight, Plus, Table2, Users } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import type { AppLayoutContext } from '../../layouts/AppLayout.tsx';

// Mockup: one fixed example tournament so the dashboard can be reached.

export function TournamentsPage() {
  const { openCreateTournament } = useOutletContext<AppLayoutContext>();

  return (
    <div className="page-container flex flex-col gap-8 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Mis torneos</h1>
          <p className="mt-1 text-sm text-neutral-400">Administra tus torneos desde aquí.</p>
        </div>
        <Button onClick={openCreateTournament}>
          <Plus className="size-4" aria-hidden="true" />
          Crear torneo
        </Button>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        <li>
          <Link
            to="/torneos/open-nacional-2026"
            className="group flex h-full flex-col gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 transition-colors hover:border-primary-500/50"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary-500/15 text-primary-300">
                <Table2 className="size-5" aria-hidden="true" />
              </span>
              <Badge>Borrador</Badge>
            </div>
            <div>
              <p className="font-display font-semibold text-white">Open Nacional 2026</p>
              <p className="text-sm text-neutral-400">
                Individual masculino · Grupos + eliminación
              </p>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-neutral-800 pt-4 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                15 nov 2026
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden="true" />
                16 / 16
              </span>
              <ChevronRight
                className="size-4 text-neutral-600 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-300"
                aria-hidden="true"
              />
            </div>
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={openCreateTournament}
            className="grid h-full min-h-44 w-full place-items-center rounded-2xl border border-dashed border-neutral-700 p-5 text-neutral-400 transition-colors hover:border-primary-500/50 hover:text-white"
          >
            <span className="flex flex-col items-center gap-2 font-display text-sm font-medium">
              <Plus className="size-6" aria-hidden="true" />
              Nuevo torneo
            </span>
          </button>
        </li>
      </ul>
    </div>
  );
}
