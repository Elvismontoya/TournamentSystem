export function LiveBadge({ label = 'En vivo' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary-500/30 bg-secondary-500/10 px-2.5 py-0.5 font-display text-xs font-semibold tracking-wide text-secondary-400 uppercase">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full rounded-full bg-secondary-400 opacity-75 motion-safe:animate-ping" />
        <span className="relative inline-flex size-2 rounded-full bg-secondary-500" />
      </span>
      {label}
    </span>
  );
}
