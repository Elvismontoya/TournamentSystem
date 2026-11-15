import { Medal } from 'lucide-react';
import type { RankingEntry } from '../../api/types.ts';
import { ButtonLink } from '../../components/ui/ButtonLink.tsx';
import { PlayerBib } from '../groupStage/PlayerBadges.tsx';

/** Medal colors for the podium (1st, 2nd, 3rd); everyone else gets a plain number. */
const PODIUM_TONES: Partial<Record<number, string>> = {
  1: 'bg-tertiary-500/20 text-tertiary-200',
  2: 'bg-neutral-500/25 text-neutral-100',
  3: 'bg-orange-500/20 text-orange-300',
};

interface FinalRankingProps {
  ranking: RankingEntry[];
  /** Show only the first N lines, with a link to the full ranking. */
  limit?: number;
  /** Where the full ranking is (used with `limit`). */
  fullTo?: string;
}

/**
 * Final ranking computed by the server: shared places (two 3rds, four 5ths…) show the same
 * number, as is usual when those matches aren't played.
 */
export function FinalRanking({ ranking, limit, fullTo }: FinalRankingProps) {
  const visible = limit === undefined ? ranking : ranking.slice(0, limit);
  const hidden = ranking.length - visible.length;

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900">
      <table className="w-full text-sm">
        <caption className="sr-only">Clasificación final del torneo</caption>
        <thead>
          <tr className="border-b border-neutral-800 text-left font-display text-xs tracking-wider text-neutral-500 uppercase">
            <th scope="col" className="w-16 py-3 pr-1 pl-4 font-medium sm:pl-5">
              Puesto
            </th>
            <th scope="col" className="px-3 py-3 font-medium">
              Jugador
            </th>
            <th scope="col" className="hidden px-3 py-3 font-medium sm:table-cell">
              Llegó a
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {visible.map((entry) => {
            const tone = PODIUM_TONES[entry.position];
            return (
              <tr key={entry.player.id}>
                <td className="py-3 pr-1 pl-4 sm:pl-5">
                  <span
                    className={`inline-flex h-7 min-w-9 items-center justify-center gap-1 rounded-md px-1.5 font-display text-xs font-bold tabular-nums ${
                      tone ?? 'text-neutral-400'
                    }`}
                  >
                    {tone && <Medal className="size-3.5" aria-hidden="true" />}
                    {entry.position}.º
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <PlayerBib value={entry.player.bib} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{entry.player.name}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {entry.player.delegation}
                        <span className="sm:hidden">
                          {entry.player.delegation ? ' · ' : ''}
                          {entry.reached}
                        </span>
                      </p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-3 py-3 text-neutral-300 sm:table-cell">{entry.reached}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {hidden > 0 && fullTo && (
        <div className="flex items-center justify-between gap-3 border-t border-neutral-800 px-5 py-3 text-xs text-neutral-500">
          <span>
            Y {hidden} {hidden === 1 ? 'jugador más' : 'jugadores más'}.
          </span>
          <ButtonLink to={fullTo} variant="ghost" className="h-8 px-3 text-xs">
            Ver completa
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
