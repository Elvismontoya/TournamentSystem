import { CalendarDays, ChevronRight, LoaderCircle, Plus, Table2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ApiError } from '../../api/client.ts';
import { tournamentsApi } from '../../api/tournaments.ts';
import type { TournamentSummary } from '../../api/types.ts';
import { Button } from '../../components/ui/Button.tsx';
import type { AppLayoutContext } from '../../layouts/AppLayout.tsx';

// The organizer's tournaments, from the API (GET /torneos).

const shortDate = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

function TournamentCard({ tournament }: { tournament: TournamentSummary }) {
  const { id, name, sport, format, modalities, categories, startDate, registered } = tournament;
  return (
    <Link
      to={`/torneos/${encodeURIComponent(id)}`}
      className="group flex h-full flex-col gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 transition-colors hover:border-primary-500/50"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary-500/15 text-primary-300">
          <Table2 className="size-5" aria-hidden="true" />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-secondary-500 to-secondary-400 px-3 py-1 font-display text-xs font-semibold text-neutral-950 shadow-md shadow-secondary-500/30">
          <Table2 className="size-3.5" aria-hidden="true" />
          {sport}
        </span>
      </div>
      <div>
        <p className="font-display font-semibold text-white">{name}</p>
        <p className="text-sm text-neutral-400">{[modalities.join(', '), format].join(' · ')}</p>
        <p className="mt-1 text-xs text-neutral-500">{categories.join(' · ')}</p>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-neutral-800 pt-4 text-xs text-neutral-400">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {startDate ? shortDate.format(new Date(`${startDate}T00:00:00Z`)) : 'Sin fecha'}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" aria-hidden="true" />
          {registered} {registered === 1 ? 'inscrito' : 'inscritos'}
        </span>
        <ChevronRight
          className="size-4 text-neutral-600 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-300"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; tournaments: TournamentSummary[] };

export function TournamentsPage() {
  const { openCreateTournament } = useOutletContext<AppLayoutContext>();
  const [state, setState] = useState<ListState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    tournamentsApi.list().then(
      (tournaments) => {
        if (active) setState({ status: 'ready', tournaments });
      },
      (error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            message:
              error instanceof ApiError ? error.message : 'No se pudieron cargar los torneos.',
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, []);

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

      {state.status === 'loading' && (
        <p className="flex items-center gap-2 text-sm text-neutral-400">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Cargando torneos…
        </p>
      )}
      {state.status === 'error' && (
        <p role="alert" className="text-sm text-red-300">
          {state.message}
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {state.status === 'ready' &&
          state.tournaments.map((tournament) => (
            <li key={tournament.id}>
              <TournamentCard tournament={tournament} />
            </li>
          ))}
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
