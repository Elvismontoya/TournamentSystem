import { CalendarDays, Info, LoaderCircle, Pencil, Shuffle, Trophy, Tv } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ApiError } from '../../api/client.ts';
import type { DrawPreview, GroupView, Player } from '../../api/types.ts';
import { Badge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { ButtonLink } from '../../components/ui/ButtonLink.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { SectionHeader } from '../../components/ui/SectionHeader.tsx';
import {
  groupMatchesQuery,
  groupNumberFromQuery,
  matchesPlayer,
} from '../../features/groupStage/display.ts';
import { GroupEditor } from '../../features/groupStage/GroupEditor.tsx';
import { GroupFilterBar, type GroupFilter } from '../../features/groupStage/GroupFilterBar.tsx';
import { GroupPosition, PlayerBib } from '../../features/groupStage/PlayerBadges.tsx';
import { TieBreakPanel } from '../../features/groupStage/TieBreakPanel.tsx';
import type { Tournament } from '../../features/tournament/useTournament.ts';

/** "4 grupos de 4" or "5 grupos: 1 de 4 y 4 de 3". */
function describeSizes(sizes: number[]): string {
  const counts = new Map<number, number>();
  for (const size of sizes) counts.set(size, (counts.get(size) ?? 0) + 1);
  const total = `${String(sizes.length)} ${sizes.length === 1 ? 'grupo' : 'grupos'}`;
  if (counts.size === 1) return `${total} de ${String(sizes[0] ?? 0)}`;
  const parts = [...counts.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([size, count]) => `${String(count)} de ${String(size)}`);
  return `${total}: ${parts.join(' y ')}`;
}

/** Match order text, e.g. "1-3, 2-4, 1-2, 3-4, 1-4, 2-3". */
function orderText(pairs: [number, number][]): string {
  return pairs.map(([a, b]) => `${String(a + 1)}-${String(b + 1)}`).join(', ');
}

/* ---------- Before the draw ---------- */

function DrawSetup({
  tournament,
  onDrawn,
  initialSize,
  onCancel,
}: {
  tournament: Tournament;
  /** Called once the server has drawn the groups. */
  onDrawn?: () => void;
  initialSize: number;
  /** Present when redrawing: goes back to the current groups without changes. */
  onCancel?: () => void;
}) {
  const { view, previewDraw, drawGroups } = tournament;
  const { minGroupSize, maxGroupSize, qualifiersPerGroup } = view.settings;
  const sizeOptions = Array.from(
    { length: maxGroupSize - minGroupSize + 1 },
    (_, index) => minGroupSize + index,
  );
  const [groupSize, setGroupSize] = useState(initialSize);
  // Sizes, seeds and match order for the chosen size, as the server will draw them.
  const [preview, setPreview] = useState<DrawPreview | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerCount = view.players.length;

  useEffect(() => {
    let active = true;
    previewDraw(groupSize).then(
      (result) => {
        if (active) setPreview(result);
      },
      (failure: unknown) => {
        if (active) setError(failure instanceof ApiError ? failure.message : 'Error inesperado.');
      },
    );
    return () => {
      active = false;
    };
    // previewDraw is recreated on every render; the preview only depends on the size and
    // on how many players are registered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupSize, playerCount]);

  const current = preview?.groupSize === groupSize ? preview : null;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title={onCancel ? 'Volver a sortear grupos' : 'Grupos'}
        text={
          onCancel
            ? 'Elige de nuevo los jugadores por grupo. Los grupos actuales se reemplazan solo al sortear.'
            : 'Sortea los grupos para empezar la fase de grupos.'
        }
      />

      <Card className="flex flex-col gap-6">
        <div>
          <h3 className="font-semibold">Jugadores por grupo</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Ningún grupo pasa de este tamaño: si no da exacto, algunos quedan con uno menos (y solo
            si eso dejara grupos de menos de {minGroupSize}, alguno queda con uno más).
          </p>
          <div role="group" aria-label="Jugadores por grupo" className="mt-3 flex flex-wrap gap-2">
            {sizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                aria-pressed={groupSize === size}
                onClick={() => {
                  setGroupSize(size);
                }}
                className={`min-w-12 rounded-lg px-4 py-2 font-display text-sm font-semibold ${
                  groupSize === size
                    ? 'bg-primary-200 text-primary-950'
                    : 'bg-neutral-850 text-neutral-300 hover:text-white'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['Jugadores', String(playerCount)],
            ['Grupos', current ? describeSizes(current.sizes) : '…'],
            ['Clasifican', `${String(qualifiersPerGroup)} por grupo`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-neutral-850 px-4 py-3">
              <p className="font-display text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                {label}
              </p>
              <p className="mt-1 font-display text-xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-semibold">Cabezas de serie</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Los {current?.groupCount ?? '…'} primeros del ranking encabezan un grupo cada uno
            (jugador 1 del grupo). El resto se reparte al azar.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(current?.seeds ?? []).map((player, index) => (
              <li
                key={player.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-800 px-4 py-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-tertiary-500/15 font-display font-bold text-tertiary-300">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{player.name}</p>
                  <p className="text-xs text-neutral-500">
                    Grupo {index + 1} · ranking {player.ranking ?? '—'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-neutral-800 pt-5">
          <div className="text-sm text-neutral-400">
            <p>Al sortear se generan los partidos de cada grupo en este orden:</p>
            <ul className="mt-1 flex flex-col gap-0.5">
              {(current?.orders ?? []).map(({ size, pairs }) => (
                <li key={size}>
                  <span className="font-medium text-neutral-200">Grupo de {size}:</span>{' '}
                  {orderText(pairs)}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button
              disabled={drawing || !current}
              onClick={() => {
                setDrawing(true);
                setError(null);
                drawGroups(groupSize).then(
                  () => {
                    setDrawing(false);
                    onDrawn?.();
                  },
                  (failure: unknown) => {
                    setDrawing(false);
                    setError(failure instanceof ApiError ? failure.message : 'Error inesperado.');
                  },
                );
              }}
            >
              {drawing ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Shuffle className="size-4" aria-hidden="true" />
              )}
              Sortear grupos
            </Button>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        )}
      </Card>
    </div>
  );
}

/* ---------- After the draw: group matrix ---------- */

/** Result of the player in `row` against the one in `col` (positions inside the group). */
function ResultCell({ group, row, col }: { group: GroupView; row: number; col: number }) {
  const match = group.matches.find(
    ({ players: [a, b] }) => (a === row && b === col) || (a === col && b === row),
  );
  if (!match) return null;
  const { summary } = match;
  if (!summary.finished) return <span className="text-neutral-700">·</span>;

  const side = match.players[0] === row ? 0 : 1;
  const mine = summary.sets[side];
  const theirs = summary.sets[side === 0 ? 1 : 0];
  const won = mine > theirs;
  return (
    <span className="flex flex-col items-center leading-tight">
      <span
        className={`font-display font-semibold tabular-nums ${won ? 'text-white' : 'text-neutral-500'}`}
      >
        {mine}-{theirs}
      </span>
      {summary.walkover ? (
        <span
          title={won ? 'Ganó por W.O. (el rival no se presentó)' : 'No se presentó (W.O.)'}
          className="font-display text-[10px] font-bold text-tertiary-400"
        >
          W.O.
        </span>
      ) : (
        <span className="text-[9px] tracking-tighter whitespace-nowrap text-neutral-500 tabular-nums">
          {match.notation[side].replaceAll(', ', ',')}
        </span>
      )}
    </span>
  );
}

function GroupMatrix({
  group,
  groupIndex,
  groups,
  players,
  seedIds,
  qualifiersPerGroup,
  minSize,
  maxSize,
  query,
  onSavePlayers,
}: {
  group: GroupView;
  groupIndex: number;
  groups: GroupView[];
  /** Every registered player, to look them up by Nr. when editing. */
  players: Player[];
  /** Ids of the seeded players (top of the ranking, one per group). */
  seedIds: string[];
  qualifiersPerGroup: number;
  minSize: number;
  maxSize: number;
  /** Player search text; matching names are highlighted. */
  query: string;
  onSavePlayers: (playerIds: string[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  // Table, tie-breaks and qualification are computed by the server.
  const { rows: standings, ties } = group.table;
  const { finished, total, complete, qualificationPending } = group;
  const qualified = group.qualifiers.filter((player) => player !== null);

  // A tie of 3+ players in a finished group is flagged in orange with its calculation.
  const multiTie = complete ? ties.find((tie) => tie.players.length >= 3) : undefined;
  const tiedIds = new Set(multiTie?.players.map((entry) => entry.row.player.id));

  return (
    <section
      aria-labelledby={`group-${group.name}`}
      className={`overflow-hidden rounded-2xl border bg-neutral-900 ${
        multiTie ? 'border-tertiary-500/70 ring-1 ring-tertiary-500/30' : 'border-neutral-800'
      }`}
    >
      <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h3 id={`group-${group.name}`} className="text-lg font-semibold">
          Grupo {group.name}
        </h3>
        <span className="ml-auto" />
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(true);
            }}
            aria-label={`Editar jugadores del grupo ${group.name}`}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Editar
          </button>
        )}
        {editing ? (
          <Badge tone="primary">Editando</Badge>
        ) : multiTie ? (
          <Badge tone="tertiary">
            {multiTie.players.length === 3
              ? 'Triple empate'
              : `Empate de ${String(multiTie.players.length)}`}
          </Badge>
        ) : complete ? (
          <Badge tone="secondary">Completo</Badge>
        ) : (
          <Badge>
            {finished} de {total} partidos
          </Badge>
        )}
      </header>

      {editing ? (
        <div className="border-t border-neutral-800">
          <GroupEditor
            group={group}
            groupIndex={groupIndex}
            groups={groups}
            players={players}
            minSize={minSize}
            maxSize={maxSize}
            onSave={async (playerIds) => {
              await onSavePlayers(playerIds);
              setEditing(false);
            }}
            onCancel={() => {
              setEditing(false);
            }}
          />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table
              className="w-full table-fixed text-sm"
              // Player column keeps ~13rem for name + badges; one 3.75rem column per rival.
              style={{ minWidth: `${String(13 + group.players.length * 3.75 + 5)}rem` }}
            >
              <caption className="sr-only">
                Resultados del grupo {group.name}: cada fila es un jugador y cada columna su rival
              </caption>
              <thead>
                <tr className="border-y border-neutral-800 font-display text-xs text-neutral-500">
                  <th scope="col" className="py-2 pl-4 text-left font-medium">
                    Jugador
                  </th>
                  {group.players.map((player, index) => (
                    <th
                      key={player.id}
                      scope="col"
                      className="w-[3.75rem] py-2 text-center font-medium"
                    >
                      <abbr title={`Contra ${player.name}`} className="no-underline">
                        {index + 1}
                      </abbr>
                    </th>
                  ))}
                  <th scope="col" className="w-9 py-2 text-center font-medium">
                    Pts
                  </th>
                  <th scope="col" className="w-11 py-2 pr-2 text-right font-medium">
                    <abbr title="Posición" className="no-underline">
                      Pos.
                    </abbr>
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, rowIndex) => {
                  const qualifies =
                    row.played > 0 &&
                    row.position <= qualifiersPerGroup &&
                    !(qualificationPending && row.tieUnresolved);
                  const inTie = tiedIds.has(row.player.id);
                  return (
                    <tr key={row.player.id} className="border-b border-neutral-800/60">
                      <th
                        scope="row"
                        className={`border-l-2 py-2 pr-1 pl-3 text-left font-normal ${
                          qualifies ? 'border-secondary-500' : 'border-transparent'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          <GroupPosition value={row.number} />
                          <PlayerBib value={row.player.bib} />
                          <span className="flex min-w-0 flex-col leading-tight">
                            <span className="flex min-w-0 items-center gap-1.5">
                              <span
                                className={`truncate ${
                                  query.trim() && matchesPlayer(row.player, query)
                                    ? 'rounded bg-tertiary-500/20 px-1 font-semibold text-tertiary-200'
                                    : 'text-neutral-100'
                                }`}
                                title={row.player.name}
                              >
                                {row.player.name}
                              </span>
                              {seedIds.includes(row.player.id) && (
                                <span
                                  title="Cabeza de serie"
                                  className="shrink-0 rounded bg-tertiary-500/15 px-1 font-display text-[10px] font-bold text-tertiary-300"
                                >
                                  CS
                                </span>
                              )}
                            </span>
                            <span
                              className="truncate text-xs text-neutral-500"
                              title={row.player.delegation}
                            >
                              {row.player.delegation}
                            </span>
                          </span>
                        </span>
                      </th>
                      {group.players.map((player, colIndex) => (
                        <td
                          key={player.id}
                          className={`h-12 border-l border-neutral-800/60 text-center ${
                            colIndex === rowIndex ? 'bg-neutral-800/70' : ''
                          }`}
                        >
                          {colIndex !== rowIndex && (
                            <ResultCell group={group} row={rowIndex} col={colIndex} />
                          )}
                        </td>
                      ))}
                      <td className="border-l border-neutral-800/60 text-center font-display font-bold text-white tabular-nums">
                        {row.points}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        {row.played > 0 ? (
                          <span
                            title={
                              row.tieUnresolved
                                ? 'Empate sin resolver: definir por sorteo'
                                : inTie
                                  ? 'Posición definida por desempate'
                                  : undefined
                            }
                            className={`inline-block min-w-8 rounded-md px-1.5 py-0.5 text-center font-display text-xs font-semibold ${
                              inTie
                                ? 'bg-tertiary-500/20 text-tertiary-300'
                                : qualifies
                                  ? 'bg-secondary-500/15 text-secondary-400'
                                  : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            {row.position}.º{row.tieUnresolved ? '?' : ''}
                          </span>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {multiTie && (
            <div className="pt-3">
              <TieBreakPanel tie={multiTie} />
            </div>
          )}

          <footer className="flex items-center gap-2 px-5 py-3 text-sm">
            {qualificationPending ? (
              <span className="font-medium text-tertiary-300">
                Clasificación pendiente: el empate decide quién pasa y debe definirse por sorteo.
              </span>
            ) : complete ? (
              <>
                <Trophy className="size-4 shrink-0 text-secondary-400" aria-hidden="true" />
                <span className="text-neutral-300">
                  Clasifican:{' '}
                  <span className="font-medium text-white">
                    {qualified.map((player) => player.name).join(' y ')}
                  </span>
                </span>
              </>
            ) : (
              <span className="text-neutral-500">
                Faltan {total - finished} partidos para definir los clasificados.
              </span>
            )}
          </footer>
        </>
      )}
    </section>
  );
}

export function GroupsPage() {
  const tournament = useOutletContext<Tournament>();
  const { view, setGroupPlayers } = tournament;
  const { players, seedIds, settings, groupStage } = view;
  const [filter, setFilter] = useState<GroupFilter>('all');
  const [query, setQuery] = useState('');
  // "Volver a sortear" goes back to the draw setup to choose the group size again.
  const [redrawing, setRedrawing] = useState(false);

  if (!groupStage) {
    return <DrawSetup tournament={tournament} initialSize={settings.defaultGroupSize} />;
  }

  const { groups, withoutGroup, hasResults, played, total: totalMatches } = groupStage;
  // Size most groups have now: preselected when redrawing.
  const currentSize = Math.min(
    settings.maxGroupSize,
    Math.max(settings.minGroupSize, Math.round(players.length / groups.length)),
  );

  if (redrawing) {
    return (
      <DrawSetup
        tournament={tournament}
        initialSize={currentSize}
        onDrawn={() => {
          setRedrawing(false);
        }}
        onCancel={() => {
          setRedrawing(false);
        }}
      />
    );
  }

  const visibleGroups = groups
    .map((group, groupIndex) => ({ group, groupIndex }))
    .filter(
      ({ group, groupIndex }) =>
        (filter === 'all' || filter === groupIndex) && groupMatchesQuery(group, query),
    );
  // Only highlight names for a player search, not for a group number search.
  const playerQuery = groupNumberFromQuery(query) === null ? query : '';

  const progress = totalMatches === 0 ? 0 : Math.round((played / totalMatches) * 100);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Grupos"
        text={`${describeSizes(groups.map((group) => group.players.length))} · clasifican los ${String(settings.qualifiersPerGroup)} primeros de cada grupo a la fase eliminatoria.`}
      >
        <Button
          variant="outlined"
          onClick={() => {
            setRedrawing(true);
          }}
          disabled={hasResults}
          title={hasResults ? 'Ya hay resultados cargados' : undefined}
        >
          <Shuffle className="size-4" aria-hidden="true" />
          Volver a sortear
        </Button>
        <Button variant="outlined">
          <Tv className="size-4" aria-hidden="true" />
          Modo pantalla
        </Button>
        <ButtonLink to="../partidos" relative="path">
          <CalendarDays className="size-4" aria-hidden="true" />
          Cargar resultados
        </ButtonLink>
      </SectionHeader>

      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-white tabular-nums">{played}</span>
          <span className="text-sm text-neutral-400">de {totalMatches} partidos jugados</span>
        </div>
        <div
          className="h-1.5 w-full shrink-0 overflow-hidden rounded-full bg-neutral-800 sm:w-auto sm:flex-1"
          role="progressbar"
          aria-label="Avance de la fase de grupos"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary-500 transition-[width]"
            style={{ width: `${String(progress)}%` }}
          />
        </div>
      </div>

      <GroupFilterBar
        groups={groups}
        value={filter}
        onChange={setFilter}
        query={query}
        onQueryChange={setQuery}
      />

      {visibleGroups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-700 px-5 py-8 text-center text-sm text-neutral-400">
          Ningún jugador coincide con «{query}» en este filtro.
        </p>
      ) : (
        <div
          className={`grid items-start gap-4 ${
            // Groups of 5-6 need more columns: two per row only on very wide screens.
            Math.max(...groups.map((group) => group.players.length)) <= 4
              ? 'min-[85rem]:grid-cols-2'
              : 'min-[110rem]:grid-cols-2'
          }`}
        >
          {visibleGroups.map(({ group, groupIndex }) => (
            <GroupMatrix
              key={group.name}
              group={group}
              groupIndex={groupIndex}
              groups={groups}
              players={players}
              seedIds={seedIds}
              qualifiersPerGroup={settings.qualifiersPerGroup}
              minSize={settings.minGroupSize}
              maxSize={settings.maxGroupSize}
              query={playerQuery}
              onSavePlayers={(playerIds) => setGroupPlayers(groupIndex, playerIds)}
            />
          ))}
        </div>
      )}

      {withoutGroup.length > 0 && (
        <section
          aria-labelledby="without-group"
          className="rounded-2xl border border-tertiary-500/40 bg-tertiary-500/10 px-5 py-4"
        >
          <h3 id="without-group" className="font-semibold text-tertiary-200">
            Sin grupo ({withoutGroup.length})
          </h3>
          <p className="mt-1 text-sm text-neutral-400">
            Inscritos después del sorteo o quitados de un grupo a mano. Para ubicarlos, edita un
            grupo y escribe su Nr. en una posición
            {hasResults ? '.' : ', o vuelve a sortear para repartir a todos.'}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {withoutGroup.map((player) => (
              <li
                key={player.id}
                className="flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm"
              >
                <PlayerBib value={player.bib} />
                <span className="text-neutral-100">{player.name}</span>
                <span className="text-xs text-neutral-500">{player.delegation}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-400">
        <span className="flex items-center gap-2">
          <GroupPosition value={1} />
          Posición en el grupo (orden de partidos)
        </span>
        <span className="flex items-center gap-2">
          <PlayerBib value={7} />
          Número del jugador (Nr.)
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-secondary-500" aria-hidden="true" />
          Clasifica a la fase eliminatoria
        </span>
        <span className="flex items-start gap-2">
          <Info className="mt-0.5 size-4 shrink-0 text-primary-300" aria-hidden="true" />
          Celda = resultado del jugador de la fila contra el de la columna. Debajo, los sets: el
          número es el puntaje del rival en sets ganados; negativo, el propio en sets perdidos.
        </span>
      </div>
    </div>
  );
}
