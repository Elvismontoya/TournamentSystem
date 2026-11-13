import {
  CalendarDays,
  ChevronRight,
  LoaderCircle,
  RotateCw,
  ServerCrash,
  TriangleAlert,
  X,
  Eye,
  LayoutDashboard,
  ListOrdered,
  MapPin,
  Network,
  Rocket,
  Settings,
  Share2,
  Table2,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge.tsx';
import { Button } from '../components/ui/Button.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { STATUS_LABEL, tournamentStatus } from '../features/tournament/progress.ts';
import { dateRangeText } from '../features/tournament/settingsText.ts';
import { useTournament } from '../features/tournament/useTournament.ts';

// The dashboard works for any sport. Everything comes from the API (TournamentSystem-backend);
// the header details are the ones saved in Configuración.

const SECTIONS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '.', label: 'Resumen', icon: LayoutDashboard },
  { to: 'participantes', label: 'Participantes', icon: Users },
  { to: 'grupos', label: 'Grupos', icon: ListOrdered },
  { to: 'partidos', label: 'Partidos', icon: CalendarDays },
  { to: 'llaves', label: 'Llaves', icon: Network },
  { to: 'configuracion', label: 'Configuración', icon: Settings },
];

const STATUS_TONE = {
  draft: 'neutral',
  registration: 'primary',
  playing: 'secondary',
  finished: 'tertiary',
} as const;

function Meta({ icon: Icon, children }: { icon: LucideIcon; children: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="size-4 text-neutral-500" aria-hidden="true" />
      {children}
    </span>
  );
}

export function TournamentLayout() {
  const { slug = '' } = useParams();
  // Loaded once here and shared by every section (Outlet context).
  const state = useTournament(slug);

  if (state.status === 'loading') {
    return (
      <div className="page-container flex items-center justify-center gap-3 py-24 text-neutral-400">
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        Cargando torneo…
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="page-container py-16">
        <EmptyState icon={ServerCrash} title="No se pudo cargar el torneo" text={state.message}>
          <Button variant="soft" onClick={state.retry}>
            <RotateCw className="size-4" aria-hidden="true" />
            Reintentar
          </Button>
        </EmptyState>
      </div>
    );
  }

  const { tournament } = state;
  const { name, settings } = tournament.view;
  const status = tournamentStatus(tournament.view);
  const details: [LucideIcon, string | null][] = [
    [Table2, settings.sport],
    [User, settings.category],
    [ListOrdered, settings.format],
    [CalendarDays, dateRangeText(settings)],
    [MapPin, settings.location],
  ];

  return (
    <div className="page-container py-8">
      <nav aria-label="Ruta de navegación" className="flex items-center gap-1 text-sm">
        <Link to="/mis-torneos" className="text-neutral-400 hover:text-white">
          Mis torneos
        </Link>
        <ChevronRight className="size-4 text-neutral-600" aria-hidden="true" />
        <span aria-current="page" className="text-neutral-200">
          {name}
        </span>
      </nav>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold sm:text-3xl">{name}</h1>
            <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-400">
            {details.map(
              ([icon, text]) =>
                text && (
                  <Meta key={text} icon={icon}>
                    {text}
                  </Meta>
                ),
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outlined">
            <Eye className="size-4" aria-hidden="true" />
            Vista previa
          </Button>
          <Button variant="outlined">
            <Share2 className="size-4" aria-hidden="true" />
            Compartir
          </Button>
          <Button>
            <Rocket className="size-4" aria-hidden="true" />
            Publicar torneo
          </Button>
        </div>
      </header>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:gap-8 2xl:gap-12">
        <nav
          aria-label="Secciones del torneo"
          className="-mx-4 flex shrink-0 gap-1 overflow-x-auto border-b border-neutral-800 px-4 pb-3 sm:-mx-6 sm:px-6 lg:sticky lg:top-24 lg:mx-0 lg:w-56 lg:flex-col 2xl:w-64 lg:self-start lg:overflow-visible lg:border-0 lg:p-0"
        >
          {SECTIONS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 font-display text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`
              }
            >
              <Icon className="size-4.5 shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {tournament.actionError && (
            <p
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{tournament.actionError}</span>
              <button
                type="button"
                onClick={tournament.dismissActionError}
                aria-label="Cerrar aviso"
                className="rounded p-0.5 text-red-300 hover:bg-red-500/20"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </p>
          )}
          <Outlet context={tournament} />
        </div>
      </div>
    </div>
  );
}
