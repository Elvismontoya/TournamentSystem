// Where the tournament stands, derived from the API's view (no extra requests): status,
// setup steps, the start countdown and the next matches to play. Display only: the rules
// (who won, who advances) are already decided by the server.

import type { Player, TournamentView } from '../../api/types.ts';
import { dateRangeText } from './settingsText.ts';

/* ---------- Status ---------- */

export type TournamentStatus = 'draft' | 'registration' | 'playing' | 'finished';

export const STATUS_LABEL: Record<TournamentStatus, string> = {
  draft: 'Borrador',
  registration: 'Inscripciones',
  playing: 'En curso',
  finished: 'Finalizado',
};

/** Borrador (nobody registered) → Inscripciones → En curso (first result) → Finalizado (champion). */
export function tournamentStatus({
  players,
  groupStage,
  knockout,
}: TournamentView): TournamentStatus {
  if (knockout?.champion) return 'finished';
  if (groupStage?.hasResults || knockout?.hasResults) return 'playing';
  if (players.length > 0) return 'registration';
  return 'draft';
}

/* ---------- Setup steps ---------- */

export interface SetupStep {
  title: string;
  text: string;
  /** done; current = the next thing to do; locked = waits for an earlier step. */
  state: 'done' | 'current' | 'locked';
  /** Section to go to (relative to the tournament). */
  action?: { label: string; to: string };
}

/** Steps from registration to the champion. The first one not done is the current one. */
export function setupSteps(view: TournamentView): SetupStep[] {
  const { players, settings, groupStage, knockout } = view;
  const enough = players.length >= settings.minGroupSize;
  const groupsDone =
    groupStage !== null && groupStage.total > 0 && groupStage.played === groupStage.total;

  const steps: (Omit<SetupStep, 'state'> & { done: boolean })[] = [
    {
      title: 'Inscribir participantes',
      text: enough
        ? `${String(players.length)} de ${String(settings.capacity)} inscritos.`
        : `Se necesitan al menos ${String(settings.minGroupSize)} para sortear (hay ${String(players.length)}).`,
      done: enough || groupStage !== null,
      action: { label: 'Añadir participantes', to: 'participantes' },
    },
    {
      title: 'Sortear los grupos',
      text: groupStage
        ? `${String(groupStage.groups.length)} grupos sorteados.`
        : settings.seeded
          ? 'Los mejores del ranking encabezan los grupos; el resto se reparte al azar.'
          : 'Todos los jugadores se reparten al azar.',
      done: groupStage !== null,
      action: { label: 'Sortear grupos', to: 'grupos' },
    },
    {
      title: 'Jugar la fase de grupos',
      text: groupStage
        ? `${String(groupStage.played)} de ${String(groupStage.total)} partidos jugados.`
        : 'Carga los resultados set por set; las tablas se calculan solas.',
      done: groupsDone,
      action: { label: 'Cargar resultados', to: 'partidos' },
    },
    {
      title: 'Sortear las llaves',
      text: knockout
        ? `Cuadro de ${String(knockout.size)} armado.`
        : `Pasan los ${String(settings.qualifiersPerGroup)} primeros de cada grupo al cuadro principal.`,
      done: knockout !== null,
      action: { label: 'Sortear llaves', to: 'llaves' },
    },
    {
      title: 'Jugar las llaves',
      text: knockout?.champion
        ? `Campeón: ${knockout.champion.name}.`
        : knockout
          ? `${String(knockout.played)} de ${String(knockout.playable)} partidos jugados.`
          : 'El ganador de cada partido pasa solo a la ronda siguiente.',
      done: Boolean(knockout?.champion),
      action: { label: 'Ir a las llaves', to: 'llaves' },
    },
  ];

  const current = steps.findIndex((step) => !step.done);
  return steps.map(({ done, ...step }, index) => ({
    ...step,
    state: done ? 'done' : index === current ? 'current' : 'locked',
    action: index === current ? step.action : undefined,
  }));
}

/* ---------- Dates ---------- */

/** Today as YYYY-MM-DD in the viewer's time zone. */
function todayIso(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${String(now.getFullYear())}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). */
function daysBetween(from: string, to: string): number {
  const day = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / day);
}

/** The "Inicio" stat: days to go, ongoing or over (by dates, or by the champion). */
export function startStat(view: TournamentView): { value: string; detail: string } {
  const { settings, knockout } = view;
  const range = dateRangeText(settings);
  if (knockout?.champion) return { value: 'Finalizado', detail: range ?? 'Ya hay campeón' };
  if (!settings.startDate) return { value: '—', detail: 'Sin fecha de inicio (Configuración)' };

  const today = todayIso();
  const toStart = daysBetween(today, settings.startDate);
  if (toStart > 1) return { value: `${String(toStart)} días`, detail: range ?? '' };
  if (toStart === 1) return { value: 'Mañana', detail: range ?? '' };
  if (toStart === 0) return { value: 'Hoy', detail: range ?? '' };

  const end = settings.endDate ?? settings.startDate;
  if (daysBetween(today, end) >= 0) {
    const day = -toStart + 1;
    const length = daysBetween(settings.startDate, end) + 1;
    return { value: 'En curso', detail: `Día ${String(day)} de ${String(length)}` };
  }
  return { value: 'Terminó', detail: range ?? '' };
}

/* ---------- Next matches ---------- */

export interface UpcomingMatch {
  key: string;
  /** "Grupo 2 · Partido 3", "Cuartos de final · 2". */
  label: string;
  players: [Player, Player];
  /** Some score entered already. */
  started: boolean;
  /** Section where its result is entered. */
  to: string;
}

/**
 * Matches still to finish, in the order they would be played: group matches by round
 * (every group's 1st match, then every group's 2nd…), then knockout matches with both players.
 */
export function upcomingMatches({ groupStage, knockout }: TournamentView): UpcomingMatch[] {
  const group: { order: number; match: UpcomingMatch }[] = (groupStage?.groups ?? []).flatMap(
    (current, groupIndex) =>
      current.matches
        .filter((match) => !match.summary.finished)
        .map((match) => ({
          order: match.index * 1000 + groupIndex,
          match: {
            key: `g-${String(groupIndex)}-${String(match.index)}`,
            label: `Grupo ${current.name} · Partido ${String(match.index + 1)}`,
            players: [current.players[match.players[0]], current.players[match.players[1]]] as [
              Player,
              Player,
            ],
            started: match.summary.started,
            to: 'partidos',
          },
        })),
  );
  group.sort((a, b) => a.order - b.order);

  const bracket: UpcomingMatch[] = (knockout?.rounds ?? []).flat().flatMap((match) => {
    const [a, b] = match.entrants;
    if (!match.playable || match.summary.finished) return [];
    if (a.kind !== 'player' || b.kind !== 'player') return [];
    return [
      {
        key: `k-${String(match.round)}-${String(match.index)}`,
        label: `${match.roundName} · ${String(match.index + 1)}`,
        players: [a.player, b.player],
        started: match.summary.started,
        to: 'llaves',
      },
    ];
  });

  return [...group.map(({ match }) => match), ...bracket];
}
