import {
  CalendarDays,
  Check,
  Lock,
  Pencil,
  Swords,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { Player, Settings, TournamentView } from '../../api/types.ts';
import { ButtonLink } from '../../components/ui/ButtonLink.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { PlayerBib } from '../../features/groupStage/PlayerBadges.tsx';
import { setupSteps, startStat, type SetupStep } from '../../features/tournament/progress.ts';
import {
  bestOfLabel,
  dateRangeText,
  matchRuleText,
  scoringText,
} from '../../features/tournament/settingsText.ts';
import type { Tournament } from '../../features/tournament/useTournament.ts';

// Tournament overview: progress from registration to the champion, key figures and the
// settings. Everything comes from the API's view.
/** Rows of "Detalles del torneo"; settings left empty are skipped. */
function detailsOf(settings: Settings): [string, string][] {
  const rows: [string, string | null][] = [
    ['Deporte', settings.sport],
    ['Modalidad', settings.modalities.join(', ')],
    ['Categorías', settings.categories.join(', ')],
    ['Fechas', dateRangeText(settings)],
    ['Lugar', settings.location],
    ['Formato', settings.format],
    [
      'Grupos',
      `De ${String(settings.defaultGroupSize)} · clasifica${settings.qualifiersPerGroup === 1 ? ' el 1.º' : 'n 1.º y 2.º'} de cada grupo`,
    ],
    ['Partidos', matchRuleText(settings)],
    ['Llaves', bestOfLabel(settings.knockoutSetsPerMatch)],
    ['Puntuación', scoringText(settings)],
    [
      'Desempate',
      settings.scoring === 'points'
        ? 'Puntos → Entre empatados: puntos, sets, puntos de juego → Sorteo'
        : 'Puntos → Entre empatados: puntos, sets → Sorteo',
    ],
  ];
  return rows.filter((row): row is [string, string] => Boolean(row[1]));
}

function statsOf(view: TournamentView): {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}[] {
  const { players, groupStage, knockout } = view;
  const played = (groupStage?.played ?? 0) + (knockout?.played ?? 0);
  const total = (groupStage?.total ?? 0) + (knockout?.playable ?? 0);
  const withoutGroup = groupStage?.withoutGroup.length ?? 0;
  return [
    {
      label: 'Participantes',
      value: String(players.length),
      detail: !groupStage
        ? 'inscritos · sin límite de cupos'
        : withoutGroup > 0
          ? `inscritos · ${String(withoutGroup)} sin grupo`
          : 'inscritos · todos en un grupo',
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

/** The tournament's winner, with a link to the full final ranking. */
function ChampionCard({ champion }: { champion: Player }) {
  return (
    <Card className="flex flex-wrap items-center gap-4 border-tertiary-500/40 bg-tertiary-500/5">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tertiary-500/15">
        <Trophy className="size-7 text-tertiary-300" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-neutral-400">Campeón del torneo</p>
        <p className="flex items-center gap-2 font-display text-xl font-semibold text-white">
          <PlayerBib value={champion.bib} />
          {champion.name}
        </p>
        {champion.delegation && <p className="text-sm text-neutral-500">{champion.delegation}</p>}
      </div>
      <ButtonLink to="clasificacion" variant="soft" className="ml-auto shrink-0">
        Ver clasificación final
      </ButtonLink>
    </Card>
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
      {/* Champion, once the tournament is over (final and 3rd place decided) */}
      {view.knockout?.finished && view.knockout.champion && (
        <ChampionCard champion={view.knockout.champion} />
      )}

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
  );
}
