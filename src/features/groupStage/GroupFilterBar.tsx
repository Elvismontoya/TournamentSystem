import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { GroupView } from '../../api/types.ts';

/** Selected group index, or 'all' to show every group. */
export type GroupFilter = number | 'all';

interface GroupFilterBarProps {
  /** Groups as the API returns them (each knows its finished/total matches). */
  groups: GroupView[];
  value: GroupFilter;
  onChange: (value: GroupFilter) => void;
  query: string;
  onQueryChange: (query: string) => void;
}

const arrowClass =
  'grid size-9 shrink-0 place-items-center rounded-lg bg-neutral-900 text-neutral-400 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400';

/**
 * Group buttons in a single scrollable row (works with any number of groups), arrows to
 * step to the previous/next group, and a search box for a player name or group number.
 */
export function GroupFilterBar({
  groups,
  value,
  onChange,
  query,
  onQueryChange,
}: GroupFilterBarProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  // Keep the selected button visible when it changes (e.g. via the arrows).
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [value]);

  const options: { label: string; value: GroupFilter; count?: string }[] = [
    { label: 'Todos', value: 'all' },
    ...groups.map((group, index) => ({
      label: `Grupo ${group.name}`,
      value: index,
      count: `${String(group.finished)}/${String(group.total)}`,
    })),
  ];
  const position = value === 'all' ? 0 : value + 1;

  return (
    <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          aria-label="Grupo anterior"
          disabled={position === 0}
          onClick={() => {
            onChange(position <= 1 ? 'all' : position - 2);
          }}
          className={arrowClass}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <div
          role="group"
          aria-label="Filtrar por grupo"
          className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:thin]"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.label}
                ref={active ? activeRef : undefined}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  onChange(option.value);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 font-display text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary-200 text-primary-950'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                {option.label}
                {option.count && (
                  <span
                    className={`rounded-full px-1.5 text-xs tabular-nums ${
                      active ? 'bg-primary-950/15' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {option.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Grupo siguiente"
          disabled={position === groups.length}
          onClick={() => {
            onChange(position);
          }}
          className={arrowClass}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <label className="relative block w-full shrink-0 sm:w-72">
        <span className="sr-only">Buscar jugador o número de grupo</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
          }}
          placeholder="Buscar jugador o n.º de grupo"
          className="h-10 w-full rounded-lg border border-neutral-800 bg-neutral-900 pr-9 pl-9 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            aria-label="Borrar búsqueda"
            onClick={() => {
              onQueryChange('');
            }}
            className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded text-neutral-500 hover:text-white"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </label>
    </div>
  );
}
