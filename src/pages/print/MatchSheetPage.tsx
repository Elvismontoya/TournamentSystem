import { useOutletContext, useParams } from 'react-router-dom';
import type { Entrant } from '../../api/types.ts';
import { entrantSource, matchNumber } from '../../features/print/printing.ts';
import type { Tournament } from '../../features/tournament/useTournament.ts';
import { Sheet } from './PrintLayout.tsx';

// Individual match score sheet of a knockout match (ITTF style): match ID, event, stage,
// date/time/table to fill in, a row per game, winner and signatures.

const cell = 'border border-black';
const MARKS = ['Serv', 'A', 'AR1', 'AR2', 'T.O'];

function Side({ entrant, from, label }: { entrant: Entrant; from: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-2 text-center">
      <p className="text-[9px] uppercase">{label}</p>
      {entrant.kind === 'player' ? (
        <>
          <p className="text-[10px]">Nr. {entrant.player.bib}</p>
          <p className="text-sm font-semibold">{entrant.player.name}</p>
          <p className="text-[9px] uppercase">{entrant.player.delegation}</p>
        </>
      ) : (
        <p className="text-sm font-semibold text-neutral-600">{from}</p>
      )}
      <div className={`${cell} mt-2 h-[12mm] w-[28mm]`} />
    </div>
  );
}

export function MatchSheetPage() {
  const { view } = useOutletContext<Tournament>();
  const { round = '0', matchIndex = '0' } = useParams();
  const { knockout, settings } = view;
  const r = Number(round);
  const i = Number(matchIndex);
  const isThird = knockout !== null && r === knockout.rounds.length - 1 && i === 1;
  const match = isThird ? knockout.thirdPlace : knockout?.rounds[r]?.[i];
  if (!knockout || !match) return <p className="py-24 text-center">Ese partido no existe.</p>;

  const games = Array.from({ length: settings.knockoutSetsPerMatch }, (_, index) => index + 1);
  const byPoints = settings.scoring === 'points';
  const [a, b] = match.entrants;
  const stage = isThird ? 'Tercer puesto' : `${match.roundName} · ${String(i + 1)}`;

  return (
    <Sheet>
      <table className="w-full border-collapse text-[11px]">
        <tbody>
          <tr>
            <td
              colSpan={4}
              className={`${cell} bg-neutral-200 py-1.5 text-center text-base font-bold`}
            >
              PLANILLA DE PARTIDO INDIVIDUAL
            </td>
            <td className={`${cell} bg-neutral-200 px-2 font-semibold`}>Match ID</td>
            <td className={`${cell} px-2 text-center text-lg font-bold`}>
              {matchNumber(knockout, r, i)}
            </td>
          </tr>
          <tr>
            <td className={`${cell} bg-neutral-200 px-2 py-1 font-semibold`}>Evento</td>
            <td className={`${cell} px-2 font-semibold`}>
              {view.name} · {view.category}
            </td>
            <td className={`${cell} bg-neutral-200 px-2 font-semibold`}>Ronda</td>
            <td className={`${cell} px-2 font-semibold`}>{stage}</td>
            <td className={`${cell} px-2`}>Fecha / hora:</td>
            <td className={`${cell} w-[28mm] px-2`}>Mesa:</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-stretch">
        <Side entrant={a} from={entrantSource(knockout, r, i, 0)} label="Jugador A" />
        <table className="border-collapse text-center text-[10px]">
          <thead>
            <tr>
              {MARKS.map((mark) => (
                <th key={`l-${mark}`} className={`${cell} w-[7mm] font-normal`}>
                  {mark}
                </th>
              ))}
              <th className={`${cell} w-[12mm]`} />
              <th className={`${cell} w-[12mm] bg-neutral-200`}>{byPoints ? 'Juegos' : 'Sets'}</th>
              <th className={`${cell} w-[12mm]`} />
              {MARKS.toReversed().map((mark) => (
                <th key={`r-${mark}`} className={`${cell} w-[7mm] font-normal`}>
                  {mark}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(byPoints ? games : [1]).map((game) => (
              <tr key={game} className="h-[7mm]">
                {MARKS.map((mark) => (
                  <td key={`l-${mark}`} className={cell} />
                ))}
                <td className={cell} />
                <td className={`${cell} bg-neutral-100 font-semibold`}>
                  {byPoints ? `${String(game)}.º` : 'Final'}
                </td>
                <td className={cell} />
                {MARKS.map((mark) => (
                  <td key={`r-${mark}`} className={cell} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <Side entrant={b} from={entrantSource(knockout, r, i, 1)} label="Jugador X" />
      </div>

      <table className="mt-4 w-full border-collapse text-[11px]">
        <tbody>
          <tr className="h-[10mm]">
            <td className={`${cell} w-[25mm] bg-neutral-200 px-2 font-semibold`}>Ganador</td>
            <td className={`${cell} px-2 align-top text-[8px]`}>Nr. / Nombre:</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-3 grid grid-cols-2 gap-4 text-[11px]">
        {['Firma jugador A', 'Firma jugador X', 'Árbitro 1', 'Árbitro 2', 'Juez árbitro'].map(
          (label) => (
            <p key={label} className="border-b border-black pt-6 pb-1">
              {label}:
            </p>
          ),
        )}
      </div>
    </Sheet>
  );
}
