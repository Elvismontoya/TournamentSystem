import {
  CalendarDays,
  Check,
  Lock,
  Network,
  Pencil,
  Shuffle,
  Swords,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { Settings, TournamentView } from '../../api/types.ts';
import { Badge } from '../../components/ui/Badge.tsx';
import { ButtonLink } from '../../components/ui/ButtonLink.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { PlayerBib } from '../../features/groupStage/PlayerBadges.tsx';
import {
  setupSteps,
  startStat,
  upcomingMatches,
  type SetupStep,
} from '../../features/tournament/progress.ts';
import {
  bestOfLabel,
  dateRangeText,
  matchRuleText,
  scoringText,
} from '../../features/tournament/settingsText.ts';
import type { Tournament } from '../../features/tournament/useTournament.ts';

// Tournament overview: progress from registration to the champion, key figures, the next
// matches to play and the settings. Everything comes from the API's view.

/** How many upcoming matches to list. */
const UPCOMING_LIMIT = 6;

/** Rows of "Detalles del torneo"; settings left empty are skipped. */
function detailsOf(settings: Settings): [string, string][] {
  const rows: [string, string | null][] = [
    ['Deporte', settings.sport],
    ['Categoría', settings.category],
    ['Fechas', dateRangeText(settings)],
    ['Lugar', settings.location],
    ['Formato', settings.format],
    [
      'Grupos',
      `De ${String(settings.defaultGroupSize)} · clasifican ${String(settings.qualifiersPerGroup)} por grupo`,
    ],
    ['Partidos', matchRuleText(settings)],
    ['Llaves', bestOfLabel(settings.knockoutSetsPerMatch)],
    ['Puntuación', scoringText(settings)],
    ['Desempate', 'Puntos → Entre empatados: puntos, sets, puntos de juego → Sorteo'],
  ];
  return rows.filter((row): row is [string, string] => Boolean(row[1]));
}

function statsOf(view: TournamentView): {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}[] {
  const { players, settings, groupStage, knockout } = view;
  const free = settings.capacity - players.length;
  const played = (groupStage?.played ?? 0) + (knockout?.played ?? 0);
  const total = (groupStage?.total ?? 0) + (knockout?.playable ?? 0);
  return [
    {
      label: 'Participantes',
      value: String(players.length),
      detail:
        free > 0
          ? `de ${String(settings.capacity)} cupos · quedan ${String(free)}`
          : `de ${String(settings.capacity)} cupos · completo`,
      icon: Users,
    },
    {
      label: 'Partidos jugados',
      value: String(played),
      detail: groupStage ? `de ${String(total)} definidos (grupos y llaves)` : 'aún sin sorteo',
      icon: Swords,
    },
    { label: 'Inicio', ...startStat(view), icon: CalendarDays },
  ];
}

function StepMarker({ state, index }: { state: SetupStep['state']; index: number }) {
  if (state === 'done') {
    return (
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary-500 text-secondary-950">
        <Check className="size-4" aria-hidden="true" />
      </span>
    );
  }
  if (state === 'locked') {
    return (
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-neutral-800 text-neutral-500">
        <Lock className="size-3.5" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-600 font-display text-sm font-bold text-white ring-4 ring-primary-600/20">
      {index + 1}
    </span>
  );
}

/** Next matches, the champion, or what to do to get matches. */
function Upcoming({ view }: { view: TournamentView }) {
  const { players, settings, groupStage, knockout } = view;

  if (knockout?.champion) {
    const { champion } = knockout;
    return (
      <Card className="flex items-center gap-4 border-tertiary-500/40 bg-tertiary-500/5">
        <Trophy className="size-8 shrink-0 text-tertiary-300" aria-hidden="true" />
        <div>
          <p className="text-sm text-neutral-400">Campeón</p>
          <p className="flex items-center gap-2 font-display text-xl font-semibold text-white">
            <PlayerBib value={champion.bib} />
            {champion.name}
          </p>
          <p className="text-sm text-neutral-500">{champion.delegation}</p>
        </div>
      </Card>
    );
  }

  const matches = upcomingMatches(view);
  if (matches.length > 0) {
    return (
      <Card className="p-0">
        <ul className="divide-y divide-neutral-800">
          {matches.slice(0, UPCOMING_LIMIT).map((match) => (
            <li key={match.key} className="flex items-center gap-3 px-5 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-xs text-neutral-500">
                  {match.label}
                  {match.started && <Badge tone="tertiary">En juego</Badge>}
                </p>
                <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <PlayerBib value={match.players[0].bib} />
                    <span className="truncate text-neutral-100">{match.players[0].name}</span>
                  </span>
                  <span className="text-xs text-neutral-600">vs</span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <PlayerBib value={match.players[1].bib} />
                    <span className="truncate text-neutral-100">{match.players[1].name}</span>
                  </span>
                </p>
              </div>
              <ButtonLink to={match.to} variant="ghost" className="h-8 shrink-0 px-3 text-xs">
                Cargar
              </ButtonLink>
            </li>
          ))}
        </ul>
        {matches.length > UPCOMING_LIMIT && (
          <p className="border-t border-neutral-800 px-5 py-3 text-xs text-neutral-500">
            Y {matches.length - UPCOMING_LIMIT} partidos más.
          </p>
        )}
      </Card>
    );
  }

  // No match waiting for a result: tell what unlocks the next ones.
  if (!groupStage) {
    const enough = players.length >= settings.minGroupSize;
    return (
      <EmptyState
        icon={enough ? Shuffle : Users}
        title="Todavía no hay partidos"
        text={
          enough
            ? 'Los partidos de cada grupo se generan al sortear los grupos.'
            : `Inscribe al menos ${String(settings.minGroupSize)} participantes para poder sortear los grupos.`
        }
      >
        <ButtonLink to={enough ? 'grupos' : 'participantes'} variant="soft">
          {enough ? 'Sortear grupos' : 'Añadir participantes'}
        </ButtonLink>
      </EmptyState>
    );
  }
  return (
    <EmptyState
      icon={Network}
      title={knockout ? 'Esperando a los clasificados' : 'Fase de grupos terminada'}
      text={
        knockout
          ? 'Los partidos de llaves aparecen cuando sus dos jugadores están definidos.'
          : 'Sortea las llaves para seguir con el cuadro principal.'
      }
    >
      <ButtonLink to="llaves" variant="soft">
        {knockout ? 'Ver llaves' : 'Sortear llaves'}
      </ButtonLink>
    </EmptyState>
  );
}

export function OverviewPage() {
  const { view } = useOutletContext<Tournament>();
  const details = detailsOf(view.settings);
  const steps = setupSteps(view);
  const stats = statsOf(view);
  const completed = steps.filter((step) => step.state === 'done').length;
  const progress = Math.round((completed / steps.length) * 100);
  const finished = completed === steps.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Progress: from registration to the champion */}
      <Card className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              {finished ? 'Torneo terminado' : 'Avance del torneo'}
            </h2>
            <p className="text-sm text-neutral-400">
              {finished
                ? 'Todos los partidos están jugados y hay campeón.'
                : 'Del registro de participantes al campeón. El paso resaltado es el siguiente.'}
            </p>
          </div>
          <p className="font-display text-sm text-neutral-300">
            {completed} de {steps.length} pasos
          </p>
        </div>

        <div
          className="h-1.5 overflow-hidden rounded-full bg-neutral-800"
          role="progressbar"
          aria-label="Avance del torneo"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-secondary-500 transition-[width]"
            style={{ width: `${String(progress)}%` }}
          />
        </div>

        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className={`flex gap-4 rounded-xl border p-4 ${
                step.state === 'current'
                  ? 'border-primary-500/50 bg-primary-500/5'
                  : 'border-neutral-800'
              }`}
            >
              <StepMarker state={step.state} index={index} />
              <div className="min-w-0">
                <p
                  className={`font-display font-medium ${
                    step.state === 'locked' ? 'text-neutral-500' : 'text-white'
                  }`}
                >
                  {step.title}
                </p>
                <p className="mt-0.5 text-sm text-neutral-400">{step.text}</p>
                {step.action && (
                  <ButtonLink to={step.action.to} className="mt-3 h-8 px-3 text-xs">
                    {step.action.label}
                  </ButtonLink>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {/* Key figures */}
      <section aria-label="Cifras del torneo" className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                {label}
              </p>
              <Icon className="size-4 text-neutral-500" aria-hidden="true" />
            </div>
            <p className="font-display text-3xl font-bold text-white">{value}</p>
            <p className="text-xs text-neutral-500">{detail}</p>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Upcoming matches */}
        <section aria-labelledby="upcoming-heading" className="flex flex-col gap-3">
          <h2 id="upcoming-heading" className="text-lg font-semibold">
            {view.knockout?.champion ? 'Resultado final' : 'Próximos partidos'}
          </h2>
          <Upcoming view={view} />
        </section>

        {/* Tournament details */}
        <section aria-labelledby="details-heading" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 id="details-heading" className="text-lg font-semibold">
              Detalles del torneo
            </h2>
            <ButtonLink to="configuracion" variant="ghost" className="h-8 px-3 text-xs">
              <Pencil className="size-3.5" aria-hidden="true" />
              Editar
            </ButtonLink>
          </div>
          <Card className="p-0">
            <dl className="divide-y divide-neutral-800 text-sm">
              {details.map(([term, description]) => (
                <div key={term} className="grid grid-cols-[7.5rem_1fr] gap-3 px-5 py-3">
                  <dt className="text-neutral-500">{term}</dt>
                  <dd className="text-neutral-100">{description}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </section>
      </div>
    </div>
  );
}
