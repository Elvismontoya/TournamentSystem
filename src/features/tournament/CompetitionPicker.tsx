import { Check, ChevronDown, Lock } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Division } from '../../api/types.ts';
import { MODALITIES } from '../../constants/catalog.ts';
import type { Tournament } from './useTournament.ts';

// Compact picker for the competition shown in every section: the modality (only individual
// for now) and one menu per division (Masculino, Femenino, Mixto) with its categories.

const DIVISION_ORDER: Division[] = ['Masculino', 'Femenino', 'Mixto'];

/** A button that opens a small menu below it; closes on Escape, a click outside or a choice. */
function Menu({
  label,
  active,
  children,
}: {
  label: ReactNode;
  /** Highlighted: it holds the competition shown. */
  active: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={container} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
        }}
        className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 font-display text-sm font-medium transition-colors ${
          active
            ? 'border-primary-500/60 bg-primary-500/15 text-white'
            : 'border-neutral-800 text-neutral-300 hover:border-neutral-600 hover:text-white'
        }`}
      >
        {label}
        <ChevronDown
          className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 z-20 mt-1.5 min-w-52 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 py-1 shadow-2xl"
        >
          {children(() => {
            setOpen(false);
          })}
        </div>
      )}
    </div>
  );
}

/** One line of a menu: name, an optional count and a check on the chosen one. */
function MenuItem({
  label,
  count,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  count?: number;
  selected: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-200 transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:text-neutral-600 disabled:hover:bg-transparent"
    >
      <span className="grid size-4 shrink-0 place-items-center">
        {selected && <Check className="size-4 text-primary-300" aria-hidden="true" />}
        {disabled && <Lock className="size-3" aria-hidden="true" />}
      </span>
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="rounded-full bg-neutral-800 px-1.5 text-[11px] text-neutral-400 tabular-nums">
          {count}
        </span>
      )}
      {disabled && <span className="text-[11px] text-neutral-600">Próximamente</span>}
    </button>
  );
}

/** Modality and division/category of the competition shown in every section. */
export function CompetitionPicker({ tournament }: { tournament: Tournament }) {
  const { competitions, view, selectCategory } = tournament;
  const shown = competitions.find((competition) => competition.name === view.category);
  const divisions = DIVISION_ORDER.filter((division) =>
    competitions.some((competition) => competition.division === division),
  );

  return (
    <div role="group" aria-label="Competencia" className="mt-6 flex flex-wrap items-center gap-2">
      <Menu
        active={false}
        label={
          <>
            <span className="text-neutral-500">Modalidad:</span> Individual
          </>
        }
      >
        {(close) =>
          MODALITIES.map((modality) => (
            <MenuItem
              key={modality.id}
              label={modality.name}
              selected={modality.name === 'Individual'}
              disabled={!modality.available}
              onSelect={close}
            />
          ))
        }
      </Menu>

      <span className="mx-1 hidden h-6 w-px bg-neutral-800 sm:block" aria-hidden="true" />

      {divisions.map((division) => {
        const inDivision = competitions.filter((competition) => competition.division === division);
        // Category shown in this division, if the competition shown is in it.
        const activeCategory = shown?.division === division ? shown.category : null;
        const active = activeCategory !== null;
        return (
          <Menu
            key={division}
            active={active}
            label={
              <>
                {division}
                {activeCategory !== null && (
                  <span className="font-normal text-primary-200">· {activeCategory}</span>
                )}
              </>
            }
          >
            {(close) =>
              inDivision.map((competition) => (
                <MenuItem
                  key={competition.name}
                  label={competition.category}
                  count={competition.registered}
                  selected={competition.name === view.category}
                  onSelect={() => {
                    selectCategory(competition.name);
                    close();
                  }}
                />
              ))
            }
          </Menu>
        );
      })}
    </div>
  );
}
