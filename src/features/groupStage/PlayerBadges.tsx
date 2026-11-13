/** Player's position inside the group (1-4): the numbers used by the match order (1-3, 2-4…). */
export function GroupPosition({ value }: { value: number }) {
  return (
    <span
      title="Posición en el grupo"
      className="grid size-5 shrink-0 place-items-center rounded bg-neutral-800 font-display text-[11px] font-semibold text-neutral-300"
    >
      {value}
    </span>
  );
}

/** Player's registration number ("Nr."), fixed for the whole tournament. */
export function PlayerBib({ value }: { value: number }) {
  return (
    <span
      title="Número del jugador (Nr.)"
      className="inline-grid h-5 min-w-7 shrink-0 place-items-center rounded bg-primary-500/15 px-1 font-display text-[11px] font-bold text-primary-200 tabular-nums"
    >
      {value}
    </span>
  );
}
