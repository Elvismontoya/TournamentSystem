import { TriangleAlert } from 'lucide-react';
import type { TieCriterion, TieDetail } from '../../api/types.ts';

const DECIDED_BY: Record<TieCriterion, string> = {
  matchPoints: 'Desempatado por los puntos de los partidos entre ellos.',
  sets: 'Desempatado por el cociente de sets entre ellos.',
  points: 'Desempatado por el cociente de puntos entre ellos.',
  unresolved:
    'Sin resolver: sets y puntos entre ellos son iguales. Hay que definir el orden por sorteo.',
};

/** Won/lost ratio as shown on scoresheets ("1.667"); "∞" when nothing was lost. */
function ratio(won: number, lost: number): string {
  return lost === 0 ? '∞' : (won / lost).toFixed(3);
}

/** Explains how a tie of 3+ players was resolved, using only the matches between them. */
export function TieBreakPanel({ tie }: { tie: TieDetail }) {
  const unresolved = tie.decidedBy === 'unresolved';
  const title =
    tie.players.length === 3 ? 'Triple empate' : `Empate de ${String(tie.players.length)}`;

  return (
    <div className="mx-5 mb-3 rounded-xl border border-tertiary-500/40 bg-tertiary-500/10 p-4">
      <p className="flex items-center gap-2 font-display text-sm font-semibold text-tertiary-300">
        <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
        {title} a {tie.points} pts
      </p>
      <p className="mt-1 text-xs text-neutral-400">
        Se calcula solo con los partidos entre los empatados: puntos → cociente de sets (ganados ÷
        perdidos) → cociente de puntos.
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs">
          <caption className="sr-only">Resultados entre los jugadores empatados</caption>
          <thead>
            <tr className="font-display text-neutral-500">
              <th scope="col" className="pb-1 text-left font-medium">
                Jugador
              </th>
              <th scope="col" className="pb-1 text-center font-medium">
                Pts
              </th>
              <th scope="col" className="pb-1 text-center font-medium">
                Sets
              </th>
              <th scope="col" className="pb-1 text-center font-medium">
                Cociente
              </th>
              <th scope="col" className="pb-1 text-center font-medium">
                Puntos
              </th>
              <th scope="col" className="pb-1 text-center font-medium">
                Cociente
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {tie.players.map((entry, index) => (
              <tr key={entry.row.player.id} className="border-t border-tertiary-500/20">
                <th scope="row" className="py-1.5 pr-2 text-left font-normal text-neutral-100">
                  <span className="mr-1.5 font-display text-tertiary-300">
                    {unresolved ? '=' : `${String(index + 1)}.º`}
                  </span>
                  {entry.row.player.name}
                </th>
                <td className="py-1.5 text-center text-neutral-200">{entry.matchPoints}</td>
                <td className="py-1.5 text-center text-neutral-300">
                  {entry.setsWon}-{entry.setsLost}
                </td>
                <td
                  className={`py-1.5 text-center ${
                    tie.decidedBy === 'sets' ? 'font-semibold text-white' : 'text-neutral-400'
                  }`}
                >
                  {ratio(entry.setsWon, entry.setsLost)}
                </td>
                <td className="py-1.5 text-center text-neutral-300">
                  {entry.pointsWon}-{entry.pointsLost}
                </td>
                <td
                  className={`py-1.5 text-center ${
                    tie.decidedBy === 'points' ? 'font-semibold text-white' : 'text-neutral-400'
                  }`}
                >
                  {ratio(entry.pointsWon, entry.pointsLost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p
        className={`mt-3 text-xs font-medium ${unresolved ? 'text-tertiary-300' : 'text-neutral-300'}`}
      >
        {DECIDED_BY[tie.decidedBy]}
      </p>
    </div>
  );
}
