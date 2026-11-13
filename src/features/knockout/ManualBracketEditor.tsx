import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { CompactLayout, HalfArrow, type SlotInfo } from './BracketView.tsx';
import type { BracketSlot, KnockoutDraw } from '../../api/types.ts';
import { slotKey } from '../groupStage/display.ts';

/** Result of looking up a player Nr.: the qualifier slot they occupy, or why not. */
export type BibResolution = { slot: BracketSlot } | { error: string };

interface ManualBracketEditorProps {
  draw: KnockoutDraw;
  groupCount: number;
  describe: (slot: BracketSlot) => SlotInfo;
  /** Finds which qualifier (1.º/2.º of a group) the player with this Nr. is. */
  resolveBib: (bib: number) => BibResolution;
  onMove: (position: number, slot: BracketSlot) => void;
  onDone: () => void;
}

function slotFromKey(key: string): BracketSlot {
  if (key === 'bye') return { kind: 'bye' };
  const [place = 1, groupIndex = 0] = key.split('-').map(Number);
  return { kind: 'qualifier', place: place === 1 ? 1 : 2, groupIndex };
}

type ByPosition = Partial<Record<number, string>>;

function without(record: ByPosition, key: number): ByPosition {
  return { ...record, [key]: undefined };
}

/**
 * Hand-made bracket. In each position you can type the player's Nr. (once their group is
 * finished) or pick the slot (1.º G1, 2.º G3… or Bye). Putting someone who sits elsewhere
 * swaps the two positions, so the bracket always keeps everyone exactly once.
 * Rule warnings update live.
 */
export function ManualBracketEditor({
  draw,
  groupCount,
  describe,
  resolveBib,
  onMove,
  onDone,
}: ManualBracketEditorProps) {
  const idPrefix = useId();
  const { size, slots, warnings } = draw;
  const hasByes = slots.some((slot) => slot.kind === 'bye');
  // Nr. being typed per position (applied on Enter or when leaving the box) and errors.
  const [drafts, setDrafts] = useState<ByPosition>({});
  const [errors, setErrors] = useState<ByPosition>({});

  const options = Array.from({ length: groupCount }, (_, groupIndex) =>
    ([1, 2] as const).map((place) => ({
      key: `${String(place)}-${String(groupIndex)}`,
      label: `${String(place)}.º Grupo ${String(groupIndex + 1)}`,
    })),
  ).flat();

  const commit = (position: number) => {
    const raw = drafts[position];
    if (raw === undefined) return;
    if (raw.trim() === '') {
      setDrafts((current) => without(current, position));
      setErrors((current) => without(current, position));
      return;
    }
    const resolution = resolveBib(Number(raw));
    if ('error' in resolution) {
      setErrors((current) => ({ ...current, [position]: resolution.error }));
      return;
    }
    onMove(position, resolution.slot);
    setDrafts((current) => without(current, position));
    setErrors((current) => without(current, position));
  };

  const renderPosition = (position: number) => {
    const slot = slots[position - 1];
    const info = describe(slot);
    const bibId = `${idPrefix}-nr-${String(position)}`;
    const selectId = `${idPrefix}-slot-${String(position)}`;
    const error = errors[position];
    const bibValue = drafts[position] ?? (info.player ? String(info.player.bib) : '');

    return (
      <div key={position} className="flex flex-col px-2 py-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-6 shrink-0 text-right text-xs text-neutral-500 tabular-nums">
            {position}
          </span>
          <HalfArrow position={position} size={size} />
          <label htmlFor={bibId} className="sr-only">
            Nr. del jugador en la posición {position}
          </label>
          <input
            id={bibId}
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="Nr."
            value={bibValue}
            aria-invalid={error !== undefined}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, '');
              setDrafts((current) => ({ ...current, [position]: digits }));
            }}
            onBlur={() => {
              commit(position);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commit(position);
              }
            }}
            className={`h-7 w-12 shrink-0 rounded-md border bg-neutral-850 text-center font-display text-sm font-bold text-primary-200 tabular-nums placeholder:text-xs placeholder:font-normal placeholder:text-neutral-600 focus:ring-2 focus:ring-primary-500/30 focus:outline-none ${
              error ? 'border-red-500/60' : 'border-neutral-700 focus:border-primary-500'
            }`}
          />
          <label htmlFor={selectId} className="sr-only">
            Puesto en la posición {position}
          </label>
          <select
            id={selectId}
            value={slotKey(slot)}
            onChange={(event) => {
              onMove(position, slotFromKey(event.target.value));
              setDrafts((current) => without(current, position));
              setErrors((current) => without(current, position));
            }}
            className={`h-7 w-28 shrink-0 rounded-md border border-neutral-700 bg-neutral-850 px-1.5 font-display text-xs font-semibold focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none ${
              slot.kind === 'bye'
                ? 'text-neutral-500'
                : slot.place === 1
                  ? 'text-primary-200'
                  : 'text-neutral-200'
            }`}
          >
            {options.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
            {hasByes && <option value="bye">Bye (pasa directo)</option>}
          </select>
          {info.player ? (
            <>
              <span
                className="min-w-0 flex-1 truncate text-neutral-100"
                title={`${info.player.name} · ${info.player.delegation}`}
              >
                {info.player.name}
              </span>
              <span className="hidden max-w-36 shrink-0 truncate text-xs text-neutral-500 2xl:block">
                {info.player.delegation}
              </span>
            </>
          ) : (
            <span className="min-w-0 flex-1 truncate text-xs text-neutral-500 italic">
              {slot.kind === 'bye' ? '' : 'Por definir'}
            </span>
          )}
        </div>
        {error && <p className="mt-1 pl-14 text-xs text-red-300">{error}</p>}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-neutral-400">
        Escribe el <strong className="text-neutral-200">Nr.</strong> del jugador en la posición
        donde va (se aplica al pulsar Enter o salir de la casilla), o elige el puesto en la lista.
        Si ese jugador ya estaba en otra posición, se intercambian.
      </p>

      {warnings.length > 0 ? (
        <ul className="flex flex-col gap-1 rounded-xl border border-tertiary-500/40 bg-tertiary-500/10 px-4 py-3 text-sm text-tertiary-200">
          {warnings.map((warning) => (
            <li key={warning} className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {warning}
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 rounded-xl border border-secondary-500/30 bg-secondary-500/10 px-4 py-3 text-sm text-secondary-300">
          <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
          Cumple las reglas: ningún 2.º está en la misma mitad que su 1.º.
        </p>
      )}

      <CompactLayout size={size} renderRow={renderPosition} />

      <div className="flex justify-end">
        <Button onClick={onDone}>Listo</Button>
      </div>
    </div>
  );
}
