import { useOutletContext, useParams } from 'react-router-dom';
import type { KnockoutMatchView, KnockoutView, TournamentView } from '../../api/types.ts';
import { entrantSource, entrantText, matchNumber } from '../../features/print/printing.ts';
import type { Tournament } from '../../features/tournament/useTournament.ts';
import { Sheet } from './PrintLayout.tsx';

// The bracket on paper, matches numbered as on the federation's sheets, with blank boxes
// for the result. A small bracket fits on one sheet (every round up to the champion); a
// big one is split in two halves (top "parte alta", bottom "parte baja"), each on its own
// page up to the semifinal: the winner of each half is a finalist.

/** Biggest bracket printed whole on a single sheet (8 first-round matches). */
const ONE_SHEET_MAX = 16;

type Part = 'alta' | 'baja' | 'completa';

function MatchBox({
  match,
  number,
  from,
}: {
  match: KnockoutMatchView;
  number: number;
  from: [string, string];
}) {
  return (
    <div className="flex items-stretch">
      <span className="mr-1 grid w-[7mm] shrink-0 place-items-center border border-black bg-neutral-200 text-[9px] font-bold">
        {number}
      </span>
      <div className="min-w-0 flex-1 border border-black">
        {match.entrants.map((entrant, side) => (
          <div
            key={side}
            className="flex h-[4.6mm] items-center border-b border-black text-[8.5px] last:border-b-0"
          >
            <span className="min-w-0 flex-1 truncate px-1">
              {entrantText(entrant, from[side === 0 ? 0 : 1])}
            </span>
            <span className="h-full w-[6mm] shrink-0 border-l border-black" />
          </div>
        ))}
      </div>
    </div>
  );
}

function sources(knockout: KnockoutView, match: KnockoutMatchView): [string, string] {
  return [
    entrantSource(knockout, match.round, match.index, 0),
    entrantSource(knockout, match.round, match.index, 1),
  ];
}

/**
 * llaves/alta or llaves/baja print that half; llaves/completa prints the whole bracket on
 * one sheet when it fits (up to 16) or both halves, one per page.
 */
export function BracketHalfPage() {
  const { view } = useOutletContext<Tournament>();
  const { half = 'completa' } = useParams();
  const { knockout } = view;
  if (!knockout) return <p className="py-24 text-center">Todavía no hay llaves sorteadas.</p>;
  const parts: Part[] =
    half === 'alta'
      ? ['alta']
      : half === 'baja'
        ? ['baja']
        : knockout.size <= ONE_SHEET_MAX
          ? ['completa']
          : ['alta', 'baja'];
  return (
    <>
      {parts.map((part) => (
        <BracketSheet key={part} view={view} knockout={knockout} part={part} />
      ))}
    </>
  );
}

function BracketSheet({
  view,
  knockout,
  part,
}: {
  view: TournamentView;
  knockout: KnockoutView;
  part: Part;
}) {
  const last = knockout.rounds.length - 1;
  // A bracket of 2 is only the final: always whole.
  const whole = part === 'completa' || last === 0;
  // Whole: every round including the final. A half: every round before the final.
  const rounds = Array.from({ length: whole ? last + 1 : last }, (_, round) => round);
  const columns = rounds.map((round) => {
    const matches = knockout.rounds[round] ?? [];
    const halfSize = matches.length / 2;
    const start = part === 'baja' ? halfSize : 0;
    return {
      round,
      name: matches[0]?.roundName ?? '',
      matches: whole ? matches : matches.slice(start, start + halfSize),
    };
  });
  // The match for 3rd place, printed apart below the bracket.
  const thirdPlace = whole ? knockout.thirdPlace : null;

  return (
    <Sheet>
      <h1 className="text-center text-base font-bold uppercase">
        Llave de {knockout.size}
        {!whole && ` · parte ${part}`}
      </h1>
      <p className="text-center text-[10px]">
        {view.name} · {view.category}
      </p>

      <div className={`mt-3 flex gap-2 ${thirdPlace ? 'h-[225mm]' : 'h-[245mm]'}`}>
        {columns.map((column) => (
          <div key={column.round} className="flex min-w-0 flex-1 flex-col">
            <p className="mb-1 text-center text-[9px] font-semibold uppercase">{column.name}</p>
            <div className="flex flex-1 flex-col justify-around">
              {column.matches.map((match) => (
                <MatchBox
                  key={match.index}
                  match={match}
                  number={matchNumber(knockout, match.round, match.index)}
                  from={sources(knockout, match)}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="flex w-[30mm] shrink-0 flex-col">
          <p className="mb-1 text-center text-[9px] font-semibold uppercase">
            {whole ? 'Campeón' : 'Finalista'}
          </p>
          <div className="flex flex-1 flex-col justify-around">
            <div className="h-[6mm] border border-black" />
          </div>
        </div>
      </div>

      {thirdPlace && (
        <div className="mt-3 w-[70mm]">
          <p className="mb-1 text-[9px] font-semibold uppercase">{thirdPlace.roundName}</p>
          <MatchBox
            match={thirdPlace}
            number={matchNumber(knockout, last, 1)}
            from={sources(knockout, thirdPlace)}
          />
        </div>
      )}
    </Sheet>
  );
}
