import { ArrowDown, ArrowUp, Trophy } from 'lucide-react';
import { useState } from 'react';
import { PlayerBib } from '../groupStage/PlayerBadges.tsx';
import type {
  BracketSlot,
  Entrant,
  KnockoutMatchView,
  KnockoutView,
  Player,
} from '../../api/types.ts';
import { roundName } from '../groupStage/display.ts';

/** What to show for a bracket position. */
export interface SlotInfo {
  /** "1.º G1", "2.º G3"… or "Bye". */
  label: string;
  place: 1 | 2 | null;
  /** Player once the group is decided; null while pending. */
  player: { name: string; delegation: string; bib: number } | null;
}

interface BracketViewProps {
  draw: KnockoutView;
  describe: (slot: BracketSlot) => SlotInfo;
}

const LABEL_TONE = {
  1: 'bg-primary-500/20 text-primary-200',
  2: 'bg-neutral-700 text-neutral-200',
} as const;

const samePlayer = (a: Entrant, b: Entrant) =>
  a.kind === 'player' && b.kind === 'player' && a.player.id === b.player.id;

/** One side of a match: position and "1.º G1" label (first round), player and sets won. */
function EntrantRow({
  match,
  side,
  info,
  position,
}: {
  match: KnockoutMatchView;
  side: 0 | 1;
  /** First round only: the draw slot this side comes from. */
  info: SlotInfo | null;
  position: number | null;
}) {
  const entrant = match.entrants[side];
  const { summary } = match;
  const decided = match.playable && summary.finished;
  const won = decided && samePlayer(match.advances, entrant);
  const lost = decided && !won;

  if (entrant.kind === 'bye') {
    return (
      <div className="flex h-14 items-center gap-2 px-2.5 text-xs text-neutral-600">
        {position !== null && (
          <span className="w-5 shrink-0 text-right tabular-nums">{position}</span>
        )}
        <span className="italic">Bye (pasa directo)</span>
      </div>
    );
  }

  const player: Player | null = entrant.kind === 'player' ? entrant.player : null;
  let score: string | null = null;
  if (match.playable && summary.started) {
    score = summary.walkover && lost ? 'W.O.' : String(summary.sets[side]);
  }

  return (
    <div className={`flex h-14 items-center gap-2 px-2.5 ${won ? 'bg-secondary-500/10' : ''}`}>
      {position !== null && (
        <span className="w-5 shrink-0 text-right text-xs text-neutral-500 tabular-nums">
          {position}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        {(info?.place || player) && (
          <span className="flex items-center gap-1.5">
            {info?.place && (
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 font-display text-[11px] leading-none font-bold ${LABEL_TONE[info.place]}`}
              >
                {info.label}
              </span>
            )}
            {player && <PlayerBib value={player.bib} />}
          </span>
        )}
        {player ? (
          <span
            className={`truncate text-sm leading-tight ${
              won ? 'font-semibold text-white' : lost ? 'text-neutral-500' : 'text-neutral-100'
            }`}
            title={`${player.name} · ${player.delegation}`}
          >
            {player.name}
          </span>
        ) : (
          <span className="truncate text-xs leading-tight text-neutral-500 italic">
            {match.round === 0 ? 'Por definir' : 'Ganador'}
          </span>
        )}
      </span>
      {score !== null && (
        <span
          className={`shrink-0 font-display text-base font-bold tabular-nums ${
            won ? 'text-secondary-300' : 'text-neutral-500'
          }`}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function MatchNode({ match, draw, describe }: { match: KnockoutMatchView } & BracketViewProps) {
  const firstRound = match.round === 0;
  return (
    <div className="w-44 divide-y divide-neutral-800 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 2xl:w-52">
      {([0, 1] as const).map((side) => {
        const position = match.index * 2 + side + 1;
        const slot = draw.slots.at(position - 1);
        return (
          <EntrantRow
            key={side}
            match={match}
            side={side}
            info={firstRound && slot ? describe(slot) : null}
            position={firstRound ? position : null}
          />
        );
      })}
    </div>
  );
}

function RoundColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <p className="mb-3 text-center font-display text-xs font-semibold tracking-wider text-neutral-500 uppercase">
        {title}
      </p>
      <div className="flex flex-1 flex-col justify-around gap-4">{children}</div>
    </div>
  );
}

function Matches({ matches, ...props }: { matches: KnockoutMatchView[] } & BracketViewProps) {
  return matches.map((match) => (
    <MatchNode key={`${String(match.round)}-${String(match.index)}`} match={match} {...props} />
  ));
}

function Champion({ player }: { player: Player | null }) {
  return player ? (
    <div className="text-center">
      <p className="text-xs text-neutral-500">Campeón</p>
      <p className="mt-0.5 flex items-center justify-center gap-1.5 font-display font-semibold text-tertiary-200">
        <PlayerBib value={player.bib} />
        {player.name}
      </p>
    </div>
  ) : (
    <p className="text-center text-xs text-neutral-500">Campeón</p>
  );
}

/**
 * Whole bracket like the organizer's sheet: top half (positions 1…size/2) on the left,
 * bottom half on the right, both flowing towards the final in the middle.
 */
function FullTree(props: BracketViewProps) {
  const { rounds, champion } = props.draw;
  const final = rounds.at(-1)?.[0];
  const sideRounds = rounds.slice(0, -1);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="mx-auto flex w-max items-stretch gap-3 2xl:gap-5">
        {/* Top half → */}
        {sideRounds.map((matches) => (
          <RoundColumn key={`left-${String(matches.length)}`} title={matches[0]?.roundName ?? ''}>
            <Matches matches={matches.slice(0, matches.length / 2)} {...props} />
          </RoundColumn>
        ))}

        {/* Final */}
        <RoundColumn title="Final">
          <div className="flex flex-col items-center gap-3">
            <Trophy
              className={`size-8 ${champion ? 'text-tertiary-300' : 'text-tertiary-400'}`}
              aria-hidden="true"
            />
            {final && <MatchNode match={final} {...props} />}
            <Champion player={champion} />
          </div>
        </RoundColumn>

        {/* ← Bottom half */}
        {sideRounds.toReversed().map((matches) => (
          <RoundColumn key={`right-${String(matches.length)}`} title={matches[0]?.roundName ?? ''}>
            <Matches matches={matches.slice(matches.length / 2)} {...props} />
          </RoundColumn>
        ))}
      </div>
    </div>
  );
}

/* ---------- Sections (for big draws) ---------- */

interface Section {
  id: string;
  label: string;
  /** First and last bracket position covered (inclusive). */
  from: number;
  to: number;
}

/** Quarters (64+) and halves (32+) of the draw; smaller draws are shown whole. */
function sectionsFor(size: number): Section[] {
  if (size < 32) return [];
  const quarters =
    size >= 64
      ? [1, 2, 3, 4].map((quarter) => ({
          id: `q${String(quarter)}`,
          label: `Cuarto ${String(quarter)}`,
          from: ((quarter - 1) * size) / 4 + 1,
          to: (quarter * size) / 4,
        }))
      : [];
  return [
    ...quarters,
    { id: 'h1', label: 'Mitad superior', from: 1, to: size / 2 },
    { id: 'h2', label: 'Mitad inferior', from: size / 2 + 1, to: size },
  ];
}

/** One section drawn left → right, from its first-round matches to its own winner. */
function SectionTree({ section, ...props }: BracketViewProps & { section: Section }) {
  const { size, rounds } = props.draw;
  const players = section.to - section.from + 1;
  const sectionRounds = Math.log2(players);
  const nextRound = size / 2 ** sectionRounds;
  const last = rounds.at(sectionRounds - 1)?.at((section.from - 1) / players);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex w-max items-stretch gap-3 2xl:gap-5">
        {rounds.slice(0, sectionRounds).map((matches, round) => {
          const span = 2 ** (round + 1);
          return (
            <RoundColumn key={round} title={matches[0]?.roundName ?? ''}>
              <Matches
                matches={matches.slice((section.from - 1) / span, section.to / span)}
                {...props}
              />
            </RoundColumn>
          );
        })}
        <RoundColumn title="Pasa a">
          <div className="w-44 rounded-xl border border-dashed border-neutral-700 px-3 py-4 text-center text-xs text-neutral-400 2xl:w-52">
            {last?.advances.kind === 'player' ? (
              <>
                <span className="font-medium text-neutral-100">{last.advances.player.name}</span>{' '}
                juega la
              </>
            ) : (
              'El ganador de esta sección juega la'
            )}{' '}
            <span className="font-medium text-neutral-200">{roundName(nextRound)}</span>
          </div>
        </RoundColumn>
      </div>
    </div>
  );
}

/* ---------- Compact list (like the organizer's sheet) ---------- */

/** First-round pairs of positions starting at `from`: [[from, from+1], [from+2, from+3], …] */
function firstRoundPairs(from: number, players: number): [number, number][] {
  return Array.from({ length: players / 2 }, (_, index) => [
    from + index * 2,
    from + index * 2 + 1,
  ]);
}

/** Arrow telling whether a bracket position goes "por arriba" (top half) or "por abajo". */
export function HalfArrow({ position, size }: { position: number; size: number }) {
  const top = position <= size / 2;
  const Icon = top ? ArrowUp : ArrowDown;
  const text = top ? 'Va por arriba (mitad superior)' : 'Va por abajo (mitad inferior)';
  return (
    <span title={text} className="inline-flex shrink-0">
      <Icon
        className={`size-3.5 ${top ? 'text-sky-300' : 'text-tertiary-300'}`}
        strokeWidth={2.5}
        aria-hidden="true"
      />
      <span className="sr-only">{text}</span>
    </span>
  );
}

function CompactRow({ position, size, info }: { position: number; size: number; info: SlotInfo }) {
  return (
    <div className="flex h-8 items-center gap-2 px-2 text-sm">
      <span className="w-6 shrink-0 text-right text-xs text-neutral-500 tabular-nums">
        {position}
      </span>
      <HalfArrow position={position} size={size} />
      {info.place === null ? (
        <span className="text-xs text-neutral-600 italic">Bye</span>
      ) : (
        <>
          <span
            className={`w-14 shrink-0 rounded px-1 py-0.5 text-center font-display text-[11px] leading-none font-bold ${LABEL_TONE[info.place]}`}
          >
            {info.label}
          </span>
          {info.player ? (
            <>
              <PlayerBib value={info.player.bib} />
              <span className="min-w-0 flex-1 truncate text-neutral-100">{info.player.name}</span>
              <span className="hidden max-w-36 shrink-0 truncate text-xs text-neutral-500 xl:block">
                {info.player.delegation}
              </span>
            </>
          ) : (
            <span className="truncate text-xs text-neutral-500 italic">Por definir</span>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Every position in two columns (top half | bottom half), first-round pairs joined by a
 * bracket line pointing to the centre. Used to view the draw and to edit it by hand.
 */
export function CompactLayout({
  size,
  renderRow,
}: {
  size: number;
  renderRow: (position: number) => React.ReactNode;
}) {
  const half = size / 2;

  return (
    <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
      {[1, half + 1].map((from) => {
        const isTop = from === 1;
        return (
          <section key={from} aria-label={isTop ? 'Mitad superior' : 'Mitad inferior'}>
            <p className="mb-2 font-display text-xs font-semibold tracking-wider text-neutral-500 uppercase">
              {isTop ? 'Mitad superior' : 'Mitad inferior'} · {from}–{from + half - 1}
            </p>
            <ol className="flex flex-col gap-1.5">
              {firstRoundPairs(from, half).map(([a, b]) => (
                <li key={a} className={`flex ${isTop ? '' : 'flex-row-reverse'}`}>
                  <div className="min-w-0 flex-1 divide-y divide-neutral-800 rounded-lg border border-neutral-800 bg-neutral-900">
                    {renderRow(a)}
                    {renderRow(b)}
                  </div>
                  {/* Bracket line joining the pair, pointing to the centre (the final). */}
                  <span
                    aria-hidden="true"
                    className={`my-4 w-3 shrink-0 border-y border-neutral-600 ${
                      isTop ? 'rounded-r border-r' : 'rounded-l border-l'
                    }`}
                  />
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function CompactList({ draw, describe }: BracketViewProps) {
  const { size, slots } = draw;
  return (
    <CompactLayout
      size={size}
      renderRow={(position) => (
        <CompactRow
          key={position}
          position={position}
          size={size}
          info={describe(slots[position - 1])}
        />
      )}
    />
  );
}

/* ---------- Public component ---------- */

type ViewMode = 'tree' | 'list';

const toggleClass = (active: boolean) =>
  `rounded-md px-3 py-1.5 font-display text-sm font-medium transition-colors ${
    active ? 'bg-primary-200 text-primary-950' : 'text-neutral-400 hover:text-white'
  }`;

/**
 * Bracket with two views: "Cuadro" (every round with results; big draws can be seen by
 * quarter or half) and "Lista compacta" (the first-round positions, like the organizer's sheet).
 */
export function BracketView({ draw, describe }: BracketViewProps) {
  const sections = sectionsFor(draw.size);
  // Once matches are played the tree is what matters; before that, the draw list.
  const [view, setView] = useState<ViewMode>(draw.hasResults ? 'tree' : 'list');
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? 'all');
  const section = sections.find((candidate) => candidate.id === sectionId);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Vista del cuadro"
          className="flex gap-1 rounded-lg bg-neutral-850 p-1"
        >
          <button
            type="button"
            aria-pressed={view === 'tree'}
            onClick={() => {
              setView('tree');
            }}
            className={toggleClass(view === 'tree')}
          >
            Cuadro
          </button>
          <button
            type="button"
            aria-pressed={view === 'list'}
            onClick={() => {
              setView('list');
            }}
            className={toggleClass(view === 'list')}
          >
            Lista compacta
          </button>
        </div>

        {view === 'tree' && sections.length > 0 && (
          <div role="group" aria-label="Sección del cuadro" className="flex flex-wrap gap-2">
            {[...sections, { id: 'all', label: 'Completo' }].map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={sectionId === option.id}
                onClick={() => {
                  setSectionId(option.id);
                }}
                className={`rounded-lg px-3 py-1.5 font-display text-sm font-medium ${
                  sectionId === option.id
                    ? 'bg-neutral-700 text-white'
                    : 'bg-neutral-850 text-neutral-400 hover:text-white'
                }`}
              >
                {option.label}
                {'from' in option && (
                  <span className="ml-1.5 text-xs text-neutral-500 tabular-nums">
                    {option.from}–{option.to}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === 'list' ? (
        <CompactList draw={draw} describe={describe} />
      ) : section ? (
        <SectionTree draw={draw} describe={describe} section={section} />
      ) : (
        <FullTree draw={draw} describe={describe} />
      )}
    </div>
  );
}
