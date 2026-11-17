import { useOutletContext, useParams } from 'react-router-dom';
import type { GroupView, Player, TournamentView } from '../../api/types.ts';
import type { Tournament } from '../../features/tournament/useTournament.ts';
import { Sheet } from './PrintLayout.tsx';

// Group scoresheet for the referee: one block per match (in order of play) with a row per
// set, and the summary table with the cross results, points and position to fill in.

const cell = 'border border-black';
/** Narrow columns of the ITTF sheet: service, yellow, yellow-red 1 and 2, time-out. */
const MARKS = ['Serv', 'A', 'AR1', 'AR2', 'T.O'];

function PlayerBox({ player, number }: { player: Player; number: number }) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <p className="text-[9px]">
          {number} · Nr. {player.bib}
        </p>
        <p className="font-semibold">{player.name}</p>
        <p className="text-[9px] uppercase">{player.delegation}</p>
      </div>
      {/* Sets won, written by the referee. */}
      <div className={`${cell} mt-1 h-[9mm] w-[22mm]`} />
    </div>
  );
}

/** One group's sheet, or every group's (grupo/todos), each on its own page. */
export function GroupSheetPage() {
  const { view } = useOutletContext<Tournament>();
  const { groupIndex = '0' } = useParams();
  const groups = view.groupStage?.groups ?? [];
  const chosen = groupIndex === 'todos' ? groups : groups.slice(Number(groupIndex)).slice(0, 1);
  if (chosen.length === 0) return <p className="py-24 text-center">Ese grupo no existe.</p>;
  return (
    <>
      {chosen.map((group) => (
        <GroupSheet key={group.name} view={view} group={group} />
      ))}
    </>
  );
}

function GroupSheet({ view, group }: { view: TournamentView; group: GroupView }) {
  const { settings } = view;
  const sets = Array.from({ length: settings.setsPerMatch }, (_, index) => index + 1);
  const byPoints = settings.scoring === 'points';
  const size = group.players.length;

  return (
    <Sheet>
      <h1 className="text-center text-lg font-bold uppercase">{view.name}</h1>
      <table className="mt-3 w-full border-collapse text-[10px]">
        <tbody>
          <tr>
            <th className={`${cell} bg-neutral-200 px-2 py-1 text-left`}>Categoría</th>
            <th className={`${cell} bg-neutral-200 px-2 py-1`}>Grupo</th>
            <th className={`${cell} bg-neutral-200 px-2 py-1`}>Hora</th>
            <th className={`${cell} bg-neutral-200 px-2 py-1`}>Fecha</th>
            <th className={`${cell} bg-neutral-200 px-2 py-1`}>Mesa</th>
          </tr>
          <tr>
            <td className={`${cell} px-2 py-1.5 font-semibold`}>{view.category} · Individual</td>
            <td className={`${cell} px-2 py-1.5 text-center text-sm font-bold`}>{group.name}</td>
            <td className={`${cell} w-[22mm]`} />
            <td className={`${cell} w-[28mm]`} />
            <td className={`${cell} w-[16mm]`} />
          </tr>
        </tbody>
      </table>

      {group.matches.map((match, order) => {
        const [first, second] = match.players;
        const home = group.players.at(first);
        const away = group.players.at(second);
        if (!home || !away) return null;
        return (
          <div key={match.index} className="mt-2.5 break-inside-avoid">
            <p className="mb-0.5 text-[9px] font-semibold">
              Partido {order + 1} · {first + 1} vs {second + 1}
            </p>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
              <PlayerBox player={home} number={first + 1} />
              <table className="border-collapse text-center text-[9px]">
                <thead>
                  <tr>
                    {MARKS.map((mark) => (
                      <th key={`l-${mark}`} className={`${cell} w-[6mm] font-normal`}>
                        {mark}
                      </th>
                    ))}
                    <th className={`${cell} w-[11mm]`} />
                    <th className={`${cell} w-[9mm] bg-neutral-200 font-semibold`}>
                      {byPoints ? 'Set' : 'Sets'}
                    </th>
                    <th className={`${cell} w-[11mm]`} />
                    {MARKS.toReversed().map((mark) => (
                      <th key={`r-${mark}`} className={`${cell} w-[6mm] font-normal`}>
                        {mark}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(byPoints ? sets : [1]).map((set) => (
                    <tr key={set} className="h-[4.6mm]">
                      {MARKS.map((mark) => (
                        <td key={`l-${mark}`} className={cell} />
                      ))}
                      <td className={cell} />
                      <td className={`${cell} bg-neutral-100`}>
                        {byPoints ? `${String(set)}.º` : 'Final'}
                      </td>
                      <td className={cell} />
                      {MARKS.map((mark) => (
                        <td key={`r-${mark}`} className={cell} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end text-right">
                <PlayerBox player={away} number={second + 1} />
              </div>
            </div>
          </div>
        );
      })}

      {/* Summary: cross results, points and position, filled in at the end. */}
      <table className="mt-4 w-full break-inside-avoid border-collapse text-[10px]">
        <thead>
          <tr className="bg-neutral-200">
            <th className={`${cell} w-[6mm]`}>#</th>
            <th className={`${cell} w-[10mm]`}>Nr.</th>
            <th className={`${cell} px-1 text-left`}>Nombre</th>
            <th className={`${cell} px-1 text-left`}>Delegación</th>
            {group.players.map((_, index) => (
              <th key={index} className={`${cell} w-[10mm]`}>
                {index + 1}
              </th>
            ))}
            <th className={`${cell} w-[10mm]`}>Pts</th>
            <th className={`${cell} w-[10mm]`}>Pos.</th>
          </tr>
        </thead>
        <tbody>
          {group.players.map((player, row) => (
            <tr key={player.id} className="h-[6mm]">
              <td className={`${cell} text-center`}>{row + 1}</td>
              <td className={`${cell} text-center`}>{player.bib}</td>
              <td className={`${cell} px-1 font-semibold`}>{player.name}</td>
              <td className={`${cell} px-1 uppercase`}>{player.delegation}</td>
              {Array.from({ length: size }, (_, column) => (
                <td key={column} className={`${cell} ${column === row ? 'bg-neutral-400' : ''}`} />
              ))}
              <td className={cell} />
              <td className={cell} />
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 grid grid-cols-2 gap-8 text-[10px]">
        <p className="border-b border-black pb-4">Árbitro:</p>
        <p className="border-b border-black pb-4">Firma:</p>
      </div>
    </Sheet>
  );
}
