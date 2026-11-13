import { Lock } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { MatchResult, MatchSummary, Player, SetScore } from '../../api/types.ts';
import { Badge } from '../../components/ui/Badge.tsx';
import { PlayerBib } from '../groupStage/PlayerBadges.tsx';

// Scoresheet for one match (group or knockout): set-by-set inputs, W.O. and the result.
// Winners and valid sets come from the server; this only shows them and sends changes.

/** `winner` is the set winner as computed by the server (null = invalid or incomplete). */
function setInputClass(set: SetScore, side: 0 | 1, winner: 0 | 1 | null): string {
  const base =
    'h-9 w-10 rounded-md border text-center font-display text-sm tabular-nums focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none disabled:opacity-40';
  const complete = set[0] !== null && set[1] !== null;
  if (winner === side)
    return `${base} border-secondary-500/40 bg-secondary-500/15 font-bold text-white`;
  if (complete && winner === null) return `${base} border-red-500/60 bg-red-500/10 text-red-200`;
  return `${base} border-neutral-700 bg-neutral-850 text-neutral-200`;
}

export interface ScoreCardSide {
  player: Player;
  /** Shown before the Nr. (e.g. the player's number inside the group). */
  badge?: ReactNode;
}

interface ScoreCardProps {
  /** Left part of the top row (match number, time, round…). */
  header: ReactNode;
  /** Screen reader caption for the score table. */
  caption: string;
  sides: readonly [ScoreCardSide, ScoreCardSide];
  match: { result: MatchResult; summary: MatchSummary; setWinners: (0 | 1 | null)[] };
  /** What a walkover means with the current rules. */
  walkoverText: string;
  /** When set, the match is read-only and this explains why. */
  lockedReason?: string;
  onSet: (setIndex: number, side: 0 | 1, value: number | null) => void;
  onWalkover: (absent: 0 | 1 | null) => void;
}

export function ScoreCard({
  header,
  caption,
  sides,
  match,
  walkoverText,
  lockedReason,
  onSet,
  onWalkover,
}: ScoreCardProps) {
  const [choosingWalkover, setChoosingWalkover] = useState(false);
  const { summary } = match;
  const { sets } = match.result;
  const locked = lockedReason !== undefined;

  let status = <Badge>Pendiente</Badge>;
  if (summary.walkover) status = <Badge tone="tertiary">W.O.</Badge>;
  else if (summary.finished) status = <Badge tone="secondary">Finalizado</Badge>;
  else if (summary.started) status = <Badge tone="tertiary">En juego</Badge>;

  const setWalkover = (absent: 0 | 1 | null) => {
    onWalkover(absent);
    setChoosingWalkover(false);
  };

  return (
    <li className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">{header}</div>
        <div className="flex items-center gap-2">
          {locked ? (
            <span title={lockedReason} className="text-neutral-500">
              <Lock className="size-4" aria-hidden="true" />
              <span className="sr-only">{lockedReason}</span>
            </span>
          ) : summary.walkover ? (
            <button
              type="button"
              onClick={() => {
                setWalkover(null);
              }}
              className="rounded-md px-2 py-0.5 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              Deshacer W.O.
            </button>
          ) : (
            <button
              type="button"
              aria-expanded={choosingWalkover}
              onClick={() => {
                setChoosingWalkover((open) => !open);
              }}
              title="Registrar que un jugador no se presentó"
              className="rounded-md border border-neutral-700 px-2 py-0.5 font-display text-xs font-semibold text-neutral-300 hover:border-tertiary-500/60 hover:text-tertiary-300"
            >
              W.O.
            </button>
          )}
          {status}
        </div>
      </div>

      {choosingWalkover && !summary.walkover && !locked && (
        <div className="mt-3 rounded-xl border border-tertiary-500/40 bg-tertiary-500/10 p-3">
          <p className="text-sm font-medium text-tertiary-200">¿Quién no se presentó?</p>
          <p className="mt-0.5 text-xs text-neutral-400">{walkoverText}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sides.map(({ player }, side) => (
              <button
                key={player.id}
                type="button"
                onClick={() => {
                  setWalkover(side === 0 ? 0 : 1);
                }}
                className="rounded-lg border border-tertiary-500/50 px-3 py-1.5 text-sm text-neutral-100 hover:bg-tertiary-500/20"
              >
                {player.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setChoosingWalkover(false);
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-neutral-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="font-display text-xs text-neutral-500">
              <th scope="col" className="pb-1 text-left font-medium">
                Jugador
              </th>
              {sets.map((_, setIndex) => (
                <th key={setIndex} scope="col" className="px-0.5 pb-1 font-medium">
                  S{setIndex + 1}
                </th>
              ))}
              <th scope="col" className="pb-1 pl-2 text-right font-medium">
                Sets
              </th>
            </tr>
          </thead>
          <tbody>
            {sides.map(({ player, badge }, side) => {
              const isWinner = summary.winner === side;
              return (
                <tr key={player.id}>
                  <th scope="row" className="w-full min-w-36 py-1 pr-2 text-left font-normal">
                    <span className="flex items-center gap-2">
                      {badge}
                      <PlayerBib value={player.bib} />
                      <span className="flex min-w-0 flex-col leading-tight">
                        <span
                          className={`truncate ${isWinner ? 'font-semibold text-white' : 'text-neutral-200'}`}
                        >
                          {player.name}
                        </span>
                        <span className="truncate text-xs text-neutral-500">
                          {player.delegation}
                        </span>
                      </span>
                    </span>
                  </th>
                  {summary.walkover && (
                    <td colSpan={sets.length} className="px-1 py-1 text-center">
                      {isWinner ? (
                        <span className="text-xs font-medium whitespace-nowrap text-secondary-400">
                          Gana por W.O.
                        </span>
                      ) : (
                        <span className="rounded bg-tertiary-500/15 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-tertiary-300">
                          No se presentó
                        </span>
                      )}
                    </td>
                  )}
                  {!summary.walkover &&
                    sets.map((set, setIndex) => {
                      const disabled =
                        locked ||
                        (summary.finished && setIndex >= summary.decidedSets && set[side] === null);
                      return (
                        <td key={setIndex} className="px-0.5 py-1 text-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={3}
                            value={set[side] ?? ''}
                            disabled={disabled}
                            aria-label={`${player.name}, set ${String(setIndex + 1)}`}
                            onChange={(event) => {
                              const digits = event.target.value.replace(/\D/g, '');
                              onSet(
                                setIndex,
                                side === 0 ? 0 : 1,
                                digits === '' ? null : Number(digits),
                              );
                            }}
                            className={setInputClass(
                              set,
                              side === 0 ? 0 : 1,
                              match.setWinners[setIndex] ?? null,
                            )}
                          />
                        </td>
                      );
                    })}
                  <td
                    className={`py-1 pl-2 text-right font-display text-xl font-bold tabular-nums ${
                      isWinner ? 'text-white' : 'text-neutral-500'
                    }`}
                  >
                    {summary.sets[side]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {lockedReason && <p className="mt-2 text-xs text-neutral-500">{lockedReason}</p>}
    </li>
  );
}
