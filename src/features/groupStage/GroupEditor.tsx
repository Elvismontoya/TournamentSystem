import { ArrowLeftRight, TriangleAlert, UserMinus } from 'lucide-react';
import { useId, useState } from 'react';
import { ApiError } from '../../api/client.ts';
import type { GroupView, Player } from '../../api/types.ts';
import { Button } from '../../components/ui/Button.tsx';
import { GroupPosition } from './PlayerBadges.tsx';

interface GroupEditorProps {
  group: GroupView;
  groupIndex: number;
  groups: GroupView[];
  /** Every registered player, to look them up by Nr. */
  players: Player[];
  minSize: number;
  maxSize: number;
  /** Saves on the server (which applies the swaps and clears the touched groups' results). */
  onSave: (playerIds: string[]) => Promise<void>;
  onCancel: () => void;
}

/** Index of the group a player is in, or null if they have none. */
function groupOf(groups: GroupView[], player: Player): number | null {
  const index = groups.findIndex((group) => group.players.some((p) => p.id === player.id));
  return index === -1 ? null : index;
}

interface DraftRow {
  value: string;
  /** True for "0" or blank: no player in this slot. */
  empty: boolean;
  player: Player | undefined;
  error: string | null;
  /** Group the player comes from, when it isn't this one; null if none. */
  fromGroup: number | null;
  /** The player had no group (taken out earlier). */
  fromNoGroup: boolean;
}

/**
 * Edits a group by typing each slot's player Nr. (up to 6 slots); the name and delegation
 * fill in automatically. "0" or blank leaves the slot empty, so groups can have 3-6 players.
 * A player taken from another group is swapped with one leaving this group; players leaving
 * with no spot to fill end up "sin grupo". The preview here mirrors what the server will do.
 */
export function GroupEditor({
  group,
  groupIndex,
  groups,
  players,
  minSize: MIN_GROUP_SIZE,
  maxSize: MAX_GROUP_SIZE,
  onSave,
  onCancel,
}: GroupEditorProps) {
  const idPrefix = useId();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [values, setValues] = useState(() =>
    Array.from({ length: MAX_GROUP_SIZE }, (_, index) =>
      index < group.players.length ? String(group.players[index]?.bib ?? '') : '',
    ),
  );

  const rows: DraftRow[] = values.map((value, slot) => {
    const trimmed = value.trim();
    const base = { value, fromGroup: null, fromNoGroup: false };
    if (trimmed === '' || Number(trimmed) === 0) {
      return { ...base, empty: true, player: undefined, error: null };
    }
    const player = players.find((candidate) => String(candidate.bib) === trimmed);
    if (!player) {
      return {
        ...base,
        empty: false,
        player,
        error: `No hay ningún jugador con el Nr. ${trimmed}`,
      };
    }
    if (values.findIndex((other) => other.trim() === trimmed) !== slot) {
      return { ...base, empty: false, player, error: 'Ya está en otra posición del grupo' };
    }
    const origin = groupOf(groups, player);
    return {
      ...base,
      empty: false,
      player,
      error: null,
      fromGroup: origin !== null && origin !== groupIndex ? origin : null,
      fromNoGroup: origin === null,
    };
  });

  const newPlayers = rows.flatMap((row) => (row.player && !row.error ? [row.player] : []));
  const hasErrors = rows.some((row) => row.error !== null);
  const sizeError =
    newPlayers.length < MIN_GROUP_SIZE || newPlayers.length > MAX_GROUP_SIZE
      ? `Un grupo necesita entre ${String(MIN_GROUP_SIZE)} y ${String(MAX_GROUP_SIZE)} jugadores (ahora ${String(newPlayers.length)}).`
      : null;
  const valid = !hasErrors && sizeError === null;

  // Players leaving this group fill, in order, the spots of players brought from other groups.
  const leaving = group.players.filter(
    (player) => !newPlayers.some((candidate) => candidate.id === player.id),
  );
  let leavingIndex = 0;
  const swaps = rows.map((row) =>
    row.fromGroup === null ? null : (leaving[leavingIndex++] ?? null),
  );
  const toNoGroup = leaving.slice(leavingIndex);

  // Groups that lose a player without getting one back.
  const shrinking = rows.flatMap((row, slot) =>
    row.fromGroup !== null && swaps[slot] === null ? [row.fromGroup] : [],
  );
  const smallGroups = [...new Set(shrinking)].filter((index) => {
    const lost = shrinking.filter((value) => value === index).length;
    return (groups[index]?.players.length ?? 0) - lost < MIN_GROUP_SIZE;
  });

  const affected = [
    groupIndex,
    ...rows.flatMap((row) => (row.fromGroup === null ? [] : [row.fromGroup])),
  ];
  const withResults = [...new Set(affected)].filter((index) => groups[index]?.hasResults);

  // Final position of each filled slot (empty slots don't count).
  let filled = 0;
  const finalPosition = rows.map((row) => (row.player && !row.error ? ++filled : null));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid || saving) return;
        setSaving(true);
        setSaveError(null);
        onSave(newPlayers.map((player) => player.id)).catch((error: unknown) => {
          setSaving(false);
          setSaveError(error instanceof ApiError ? error.message : 'No se pudo guardar el grupo.');
        });
      }}
      className="flex flex-col gap-3 px-5 py-4"
    >
      <p className="text-xs text-neutral-400">
        Escribe el Nr. del jugador en cada posición; <strong>0</strong> o vacío deja la posición sin
        jugador. Si el jugador está en otro grupo, se intercambia con el que sale de este.
      </p>

      <ol className="flex flex-col gap-2">
        {rows.map((row, slot) => {
          const inputId = `${idPrefix}-${String(slot)}`;
          const swap = swaps[slot];
          const position = finalPosition[slot];
          return (
            <li key={slot} className="flex items-start gap-3">
              <div className="flex items-center gap-2 pt-1.5">
                {position ? (
                  <GroupPosition value={position} />
                ) : (
                  <span className="grid size-5 shrink-0 place-items-center text-xs text-neutral-600">
                    –
                  </span>
                )}
                <label htmlFor={inputId} className="sr-only">
                  Nr. del jugador en la casilla {slot + 1}
                </label>
                <input
                  id={inputId}
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={row.value}
                  placeholder="0"
                  aria-invalid={row.error !== null}
                  onChange={(event) => {
                    const next = [...values];
                    next[slot] = event.target.value.replace(/\D/g, '');
                    setValues(next);
                  }}
                  className={`h-8 w-16 rounded-md border bg-neutral-850 text-center font-display text-sm font-bold text-primary-200 tabular-nums placeholder:text-neutral-700 focus:ring-2 focus:ring-primary-500/30 focus:outline-none ${
                    row.error ? 'border-red-500/60' : 'border-neutral-700 focus:border-primary-500'
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                {row.error ? (
                  <p className="pt-1 text-sm text-red-300">{row.error}</p>
                ) : row.empty ? (
                  <p className="pt-1 text-sm text-neutral-600 italic">Sin jugador</p>
                ) : (
                  <>
                    <p className="truncate text-sm text-neutral-100">{row.player?.name}</p>
                    <p className="truncate text-xs text-neutral-500">{row.player?.delegation}</p>
                    {row.fromGroup !== null && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-tertiary-300">
                        <ArrowLeftRight className="size-3 shrink-0" aria-hidden="true" />
                        Viene del Grupo {groups[row.fromGroup]?.name}
                        {swap
                          ? ` · ${swap.name} pasa a ese grupo`
                          : ' · ese grupo queda con un jugador menos'}
                      </p>
                    )}
                    {row.fromNoGroup && (
                      <p className="mt-0.5 text-xs text-secondary-400">Estaba sin grupo</p>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {sizeError && <p className="text-xs font-medium text-red-300">{sizeError}</p>}

      {toNoGroup.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-neutral-700 bg-neutral-850 px-3 py-2 text-xs text-neutral-300">
          <UserMinus className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Quedarán sin grupo: {toNoGroup.map((player) => player.name).join(', ')}. Podrás ubicarlos
          después desde otro grupo.
        </p>
      )}

      {(withResults.length > 0 || smallGroups.length > 0) && (
        <div className="flex flex-col gap-1 rounded-lg border border-tertiary-500/40 bg-tertiary-500/10 px-3 py-2 text-xs text-tertiary-200">
          {smallGroups.length > 0 && (
            <p className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {smallGroups.map((index) => `Grupo ${groups[index]?.name ?? ''}`).join(', ')} quedaría
              con menos de {MIN_GROUP_SIZE} jugadores.
            </p>
          )}
          {withResults.length > 0 && (
            <p className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Al guardar se borrarán los resultados de:{' '}
              {withResults.map((index) => `Grupo ${groups[index]?.name ?? ''}`).join(', ')}.
            </p>
          )}
        </div>
      )}

      {saveError && (
        <p role="alert" className="text-xs font-medium text-red-300">
          {saveError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} className="h-8 px-3 text-xs">
          Cancelar
        </Button>
        <Button type="submit" disabled={!valid || saving} className="h-8 px-3 text-xs">
          {saving ? 'Guardando…' : 'Guardar grupo'}
        </Button>
      </div>
    </form>
  );
}
