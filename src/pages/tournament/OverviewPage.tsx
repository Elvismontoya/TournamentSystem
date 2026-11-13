import { CalendarDays, Check, Lock, Pencil, Swords, Users, type LucideIcon } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { Settings } from '../../api/types.ts';
import { ButtonLink } from '../../components/ui/ButtonLink.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import {
  bestOfLabel,
  dateRangeText,
  matchRuleText,
  scoringText,
} from '../../features/tournament/settingsText.ts';
import type { Tournament } from '../../features/tournament/useTournament.ts';

// Mockup: the checklist, stats and upcoming matches are fixed example content. "Detalles del
// torneo" shows the real settings (Configuración).

interface SetupStep {
  title: string;
  text: string;
  state: 'done' | 'current' | 'locked';
  action?: { label: string; to: string };
}

const SETUP_STEPS: SetupStep[] = [
  { title: 'Crear el torneo', text: 'Deporte, formato y fechas definidos.', state: 'done' },
  {
    title: 'Inscribir participantes',
    text: '16 de 16 inscritos. El ranking ordena las cabezas de serie.',
    state: 'done',
  },
  {
    title: 'Sortear los grupos',
    text: 'Los 4 primeros del ranking encabezan los grupos; el resto se reparte al azar.',
    state: 'current',
    action: { label: 'Sortear grupos', to: 'grupos' },
  },
  {
    title: 'Publicar y compartir',
    text: 'Activa la página pública y comparte el enlace o el código QR.',
    state: 'locked',
  },
];

const STATS: { label: string; value: string; detail: string; icon: LucideIcon }[] = [
  { label: 'Participantes', value: '16', detail: 'de 16 cupos', icon: Users },
  { label: 'Partidos jugados', value: '0', detail: 'aún sin sorteo', icon: Swords },
  { label: 'Días para el inicio', value: '3', detail: '15 nov 2026', icon: CalendarDays },
];

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

export function OverviewPage() {
  const { view } = useOutletContext<Tournament>();
  const details = detailsOf(view.settings);
  const completed = SETUP_STEPS.filter((step) => step.state === 'done').length;
  const progress = Math.round((completed / SETUP_STEPS.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Setup checklist */}
      <Card className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Configura tu torneo</h2>
            <p className="text-sm text-neutral-400">
              Completa estos pasos para dejar el torneo listo para jugar.
            </p>
          </div>
          <p className="font-display text-sm text-neutral-300">
            {completed} de {SETUP_STEPS.length} pasos
          </p>
        </div>

        <div
          className="h-1.5 overflow-hidden rounded-full bg-neutral-800"
          role="progressbar"
          aria-label="Progreso de configuración"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-secondary-500"
            style={{ width: `${String(progress)}%` }}
          />
        </div>

        <ol className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          {SETUP_STEPS.map((step, index) => (
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
                  } ${step.state === 'done' ? 'line-through decoration-neutral-600' : ''}`}
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

      {/* Stats */}
      <section aria-label="Resumen" className="grid gap-4 sm:grid-cols-3">
        {STATS.map(({ label, value, detail, icon: Icon }) => (
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
            Próximos partidos
          </h2>
          <EmptyState
            icon={CalendarDays}
            title="Todavía no hay partidos"
            text="Los partidos aparecerán aquí cuando inscribas jugadores y sortees los grupos."
          >
            <ButtonLink to="participantes" variant="soft">
              Añadir participantes
            </ButtonLink>
          </EmptyState>
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
