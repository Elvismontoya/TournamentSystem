import { Info, Shuffle } from 'lucide-react';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge.tsx';
import { ButtonLink } from '../../components/ui/ButtonLink.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import type { GroupView, MatchView, SetScore, Settings } from '../../api/types.ts';
import { SectionHeader } from '../../components/ui/SectionHeader.tsx';
import { groupNumberFromQuery, matchesPlayer } from '../../features/groupStage/display.ts';
import { GroupFilterBar, type GroupFilter } from '../../features/groupStage/GroupFilterBar.tsx';
import { GroupPosition, PlayerBib } from '../../features/groupStage/PlayerBadges.tsx';
import { bestOfLabel, setRuleText, walkoverText } from '../../features/tournament/settingsText.ts';
import type { Tournament } from '../../features/tournament/useTournament.ts';

// Example schedule (fixed): every group plays on its own table, one match every 15 min.
const MATCH_DAY = '15 nov';
/** Example schedule: 11:00, then one match every 15 minutes on the group's table. */
function matchTime(matchIndex: number): string {
  const minutes = 11 * 60 + matchIndex * 15;
  return `${String(Math.floor(minutes / 60))}:${String(minutes % 60).padStart(2, '0')}`;
}

/** `winner` is the set winner as computed by the server (null = invalid or incomplete). */
function setInputClass(set: SetScore, side: 0 | 1, winner: 0 | 1 | null): string {
  const base =
    'h-9 w-10 rounded-md border text-center font-display text-sm tabular-nums focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none disabled:opacity-40';
  const complete = set[0] !== null && set[1] !== null;
  if (winner === side)
    return `${base} border-secondary-500/40 bg-secondary-500/15 font-bold text-white`;
  if (complete && winner === null) return `${base} border-red-500/60 bg-red-500/10 text-red-200`;
  return `${base} border-neutral-700 bg-neutral-850 text-neutral-200`;
}

interface MatchCardProps {
  group: GroupView;
  groupIndex: number;
  match: MatchView;
  settings: Settings;
  onChange: Tournament['updateSet'];
  onWalkover: Tournament['setWalkover'];
}

function MatchCard({ group, groupIndex, match, settings, onChange, onWalkover }: MatchCardProps) {
  const [choosingWalkover, setChoosingWalkover] = useState(false);
  const { index: matchIndex, summary } = match;
  const [first, second] = match.players;
  const sides = [
    { index: first, player: group.players[first] },
    { index: second, player: group.players[second] },
  ] as const;
  const { sets } = match.result;

  let status = <Badge>Pendiente</Badge>;
  if (summary.walkover) status = <Badge tone="tertiary">W.O.</Badge>;
  else if (summary.finished) status = <Badge tone="secondary">Finalizado</Badge>;
  else if (summary.started) status = <Badge tone="tertiary">En juego</Badge>;

  const setWalkover = (absent: 0 | 1 | null) => {
    onWalkover(groupIndex, matchIndex, absent);
    setChoosingWalkover(false);
  };

  return (
    <li className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-primary-500/15 px-2 py-0.5 font-display text-sm font-bold text-primary-300">
            {first + 1}-{second + 1}
          </span>
          <span className="text-xs text-neutral-400">
            {MATCH_DAY} · {matchTime(matchIndex)} · Mesa {groupIndex + 1}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {summary.walkover ? (
            <button
              type="button"
              onClick={() => {
                setWalkover(null);
              }}
              className="rounded-md px-2 py-0.5 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              Deshacer W.O.
            </button>
          ) : (
            <button
              type="button"
              aria-expanded={choosingWalkover}
              onClick={() => {
                setChoosingWalkover((open) => !open);
              }}
              title="Registrar que un jugador no se presentó"
              className="rounded-md border border-neutral-700 px-2 py-0.5 font-display text-xs font-semibold text-neutral-300 hover:border-tertiary-500/60 hover:text-tertiary-300"
            >
              W.O.
            </button>
          )}
          {status}
        </div>
      </div>

      {choosingWalkover && !summary.walkover && (
        <div className="mt-3 rounded-xl border border-tertiary-500/40 bg-tertiary-500/10 p-3">
          <p className="text-sm font-medium text-tertiary-200">¿Quién no se presentó?</p>
          <p className="mt-0.5 text-xs text-neutral-400">{walkoverText(settings)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sides.map(({ player }, side) => (
              <button
                key={player.id}
                type="button"
                onClick={() => {
                  setWalkover(side === 0 ? 0 : 1);
                }}
                className="rounded-lg border border-tertiary-500/50 px-3 py-1.5 text-sm text-neutral-100 hover:bg-tertiary-500/20"
              >
                {player.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setChoosingWalkover(false);
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-neutral-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Partido {first + 1}-{second + 1} del grupo {group.name}
          </caption>
          <thead>
            <tr className="font-display text-xs text-neutral-500">
              <th scope="col" className="pb-1 text-left font-medium">
                Jugador
              </th>
              {sets.map((_, setIndex) => (
                <th key={setIndex} scope="col" className="px-0.5 pb-1 font-medium">
                  S{setIndex + 1}
                </th>
              ))}
              <th scope="col" className="pb-1 pl-2 text-right font-medium">
                Sets
              </th>
            </tr>
          </thead>
          <tbody>
            {sides.map(({ index, player }, side) => {
              const isWinner = summary.winner === side;
              return (
                <tr key={player.id}>
                  <th scope="row" className="w-full min-w-36 py-1 pr-2 text-left font-normal">
                    <span className="flex items-center gap-2">
                      <GroupPosition value={index + 1} />
                      <PlayerBib value={player.bib} />
                      <span className="flex min-w-0 flex-col leading-tight">
                        <span
                          className={`truncate ${isWinner ? 'font-semibold text-white' : 'text-neutral-200'}`}
                        >
                          {player.name}
                        </span>
                        <span className="truncate text-xs text-neutral-500">
                          {player.delegation}
                        </span>
                      </span>
                    </span>
                  </th>
                  {summary.walkover && (
                    <td colSpan={sets.length} className="px-1 py-1 text-center">
                      {isWinner ? (
                        <span className="text-xs font-medium whitespace-nowrap text-secondary-400">
                          Gana por W.O.
                        </span>
                      ) : (
                        <span className="rounded bg-tertiary-500/15 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-tertiary-300">
                          No se presentó
                        </span>
                      )}
                    </td>
                  )}
                  {!summary.walkover &&
                    sets.map((set, setIndex) => {
                      const disabled =
                        summary.finished && setIndex >= summary.decidedSets && set[side] === null;
                      return (
                        <td key={setIndex} className="px-0.5 py-1 text-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={set[side] ?? ''}
                            disabled={disabled}
                            aria-label={`${player.name}, set ${String(setIndex + 1)}`}
                            onChange={(event) => {
                              const digits = event.target.value.replace(/\D/g, '');
                              onChange(
                                groupIndex,
                                matchIndex,
                                setIndex,
                                side === 0 ? 0 : 1,
                                digits === '' ? null : Number(digits),
                              );
                            }}
                            className={setInputClass(
                              set,
                              side === 0 ? 0 : 1,
                              match.setWinners[setIndex] ?? null,
                            )}
                          />
                        </td>
                      );
                    })}
                  <td
                    className={`py-1 pl-2 text-right font-display text-xl font-bold tabular-nums ${
                      isWinner ? 'text-white' : 'text-neutral-500'
                    }`}
                  >
                    {summary.sets[side]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </li>
  );
}

export function MatchesPage() {
  const { view, updateSet, setWalkover } = useOutletContext<Tournament>();
  const [filter, setFilter] = useState<GroupFilter>('all');
  const [query, setQuery] = useState('');
  const groups = view.groupStage?.groups;

  if (!groups) {
    return (
      <div className="flex flex-col gap-6">
        <SectionHeader title="Partidos" text="Carga los resultados de cada partido, set por set." />
        <EmptyState
          icon={Shuffle}
          title="Primero sortea los grupos"
          text="Los partidos de cada grupo se generan al hacer el sorteo, en el orden 1-3, 2-4, 1-2, 3-4, 1-4, 2-3."
        >
          <ButtonLink to="../grupos" relative="path" variant="soft">
            Ir a grupos
          </ButtonLink>
        </EmptyState>
      </div>
    );
  }

  // Groups allowed by the buttons and the search. A group number search shows all of that
  // group's matches; a name search shows only the matches of the searched player.
  const groupNumber = groupNumberFromQuery(query);
  const visibleGroups = groups
    .map((group, groupIndex) => ({
      group,
      groupIndex,
      matches: group.matches.filter(({ players: [first, second] }) =>
        groupNumber !== null
          ? group.name === groupNumber
          : [group.players[first], group.players[second]].some((player) =>
              matchesPlayer(player, query),
            ),
      ),
    }))
    .filter(
      ({ groupIndex, matches }) =>
        (filter === 'all' || filter === groupIndex) && matches.length > 0,
    );

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Partidos"
        text="Fase de grupos · escribe los puntos de cada set; el ganador, la tabla y las posiciones se calculan solos."
      >
        <ButtonLink to="../grupos" relative="path" variant="outlined">
          Ver tablas de grupos
        </ButtonLink>
      </SectionHeader>

      <GroupFilterBar
        groups={groups}
        value={filter}
        onChange={setFilter}
        query={query}
        onQueryChange={setQuery}
      />

      {visibleGroups.length === 0 && (
        <p className="rounded-2xl border border-dashed border-neutral-700 px-5 py-8 text-center text-sm text-neutral-400">
          Ningún partido coincide con «{query}» en este filtro.
        </p>
      )}

      {/* One group after another (Grupo 1 with its matches, then Grupo 2…); matches in two columns. */}
      <div className="flex flex-col gap-8">
        {visibleGroups.map(({ group, groupIndex, matches }) => (
          <section
            key={group.name}
            aria-labelledby={`matches-group-${group.name}`}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 id={`matches-group-${group.name}`} className="text-lg font-semibold">
                Grupo {group.name}
              </h3>
              <span className="text-sm text-neutral-400 tabular-nums">
                {group.finished} de {group.total} partidos
              </span>
            </div>
            <ol className="grid gap-4 xl:grid-cols-2">
              {matches.map((match) => (
                <MatchCard
                  key={`${group.name}-${String(match.index)}`}
                  group={group}
                  groupIndex={groupIndex}
                  match={match}
                  settings={view.settings}
                  onChange={updateSet}
                  onWalkover={setWalkover}
                />
              ))}
            </ol>
          </section>
        ))}
      </div>

      <p className="flex items-start gap-2 text-sm text-neutral-400">
        <Info className="mt-0.5 size-4 shrink-0 text-primary-300" aria-hidden="true" />
        {setRuleText(view.settings)} · {bestOfLabel(view.settings.setsPerMatch).toLowerCase()}: gana
        quien llega a {view.settings.setsToWin} {view.settings.setsToWin === 1 ? 'set' : 'sets'}. Un
        set inválido se marca en rojo.
      </p>
    </div>
  );
}
