// API contract: the shapes TournamentSystem-backend returns (copied from its
// src/services/tournament.view.ts and src/domain). Keep both in sync when the API changes.

export interface Player {
  id: string;
  /** Registration number ("Nr."), fixed for the whole tournament. */
  bib: number;
  name: string;
  /** Delegation, league, club or team the player represents. */
  delegation: string;
  ranking: number | null;
}

export interface NewPlayer {
  name: string;
  delegation: string;
  ranking: number | null;
  /** Optional: the next free Nr. is used if missing. */
  bib?: number;
}

/** Points of one set: [first player, second player]; null = not entered yet. */
export type SetScore = [number | null, number | null];

export interface MatchResult {
  sets: SetScore[];
  /** Side (0 = first player, 1 = second) that didn't show up. */
  walkover?: 0 | 1;
}

export interface MatchSummary {
  /** Sets won by each player. */
  sets: [number, number];
  /** Game points won by each player in the decided sets. */
  points: [number, number];
  /** Number of sets that count toward the result. */
  decidedSets: number;
  started: boolean;
  finished: boolean;
  winner: 0 | 1 | null;
  walkover: boolean;
}

export interface MatchView {
  /** Match number inside the group (order of play). */
  index: number;
  /** Positions inside the group (0-based) of the two players. */
  players: [number, number];
  result: MatchResult;
  summary: MatchSummary;
  /** Winner of each entered set (null = not entered or not a valid set). */
  setWinners: (0 | 1 | null)[];
  /** Scoresheet shorthand from each player's side ("5, -9, 6" or "W.O."). */
  notation: [string, string];
}

export interface StandingRow {
  player: Player;
  /** Player's number inside the group (1-6). */
  number: number;
  played: number;
  won: number;
  lost: number;
  setsFor: number;
  setsAgainst: number;
  pointsFor: number;
  pointsAgainst: number;
  /** Group points (per the tournament's settings; by default 2 per win, 1 per loss, 0 per W.O.). */
  points: number;
  /** Current position (1 = leader). */
  position: number;
  /** In a tie no criterion could break (needs a draw). */
  tieUnresolved: boolean;
}

/** Criterion that finally separated a tie. */
export type TieCriterion = 'matchPoints' | 'sets' | 'points' | 'unresolved';

export interface TieStats {
  row: StandingRow;
  matchPoints: number;
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
}

export interface TieDetail {
  /** Group points shared by the tied players. */
  points: number;
  /** Tied players in their final order, with their results between them. */
  players: TieStats[];
  decidedBy: TieCriterion;
}

export interface GroupView {
  name: string;
  players: Player[];
  matches: MatchView[];
  table: { rows: StandingRow[]; ties: TieDetail[] };
  finished: number;
  total: number;
  complete: boolean;
  hasResults: boolean;
  /** 1st, 2nd… of the group once decided (null while pending). */
  qualifiers: (Player | null)[];
  /** Finished, but an unresolved tie straddles the qualification cut (needs a draw). */
  qualificationPending: boolean;
}

export interface GroupStageView {
  groups: GroupView[];
  /** Registered players not in any group. */
  withoutGroup: Player[];
  played: number;
  total: number;
  hasResults: boolean;
  /** Size the main bracket will have (power of 2). */
  knockoutSize: number;
}

/** What occupies a bracket position: a group qualifier (1st or 2nd of a group) or a bye. */
export type BracketSlot = { kind: 'qualifier'; place: 1 | 2; groupIndex: number } | { kind: 'bye' };

export interface KnockoutDraw {
  /** Bracket size (power of 2): 8, 16, 32, 64… */
  size: number;
  /** slots[0] is position 1 (top of the bracket). */
  slots: BracketSlot[];
  /** Rules a hand-made draw doesn't meet (shown to the organizer). */
  warnings: string[];
}

export interface Settings {
  sport: string;
  category: string;
  /** ISO dates (YYYY-MM-DD), or null if not set. */
  startDate: string | null;
  endDate: string | null;
  location: string;
  courts: number | null;
  participantType: string;
  format: string;
  capacity: number;
  /** Lowest capacity allowed (players already registered, at least 2). */
  minCapacity: number;
  minGroupSize: number;
  maxGroupSize: number;
  defaultGroupSize: number;
  qualifiersPerGroup: number;
  /** The top of the ranking heads the groups in the draw. */
  seeded: boolean;
  /** Group matches: best of N sets. */
  setsPerMatch: number;
  setsToWin: number;
  gamePoints: number;
  winMargin: number;
  knockoutSetsPerMatch: number;
  pointsWin: number;
  pointsLoss: number;
  pointsWalkover: number;
  /** Results were entered: match rules (sets, points per set, margin) can't change. */
  rulesLocked: boolean;
}

/** Body of PUT /configuracion: the name plus every editable setting. */
export interface SettingsUpdate {
  name: string;
  sport: string;
  category: string;
  startDate: string | null;
  endDate: string | null;
  location: string;
  courts: number | null;
  participantType: string;
  format: string;
  capacity: number;
  defaultGroupSize: number;
  seeded: boolean;
  setsPerMatch: number;
  gamePoints: number;
  winMargin: number;
  knockoutSetsPerMatch: number;
  pointsWin: number;
  pointsLoss: number;
  pointsWalkover: number;
}

export interface TournamentView {
  id: string;
  name: string;
  settings: Settings;
  /** Registered players, highest ranking first. */
  players: Player[];
  /** Nr. a new player gets if none is given. */
  nextBib: number;
  /** Seeded players (top of the ranking, one per group), in seed order. */
  seedIds: string[];
  groupStage: GroupStageView | null;
  knockout: KnockoutDraw | null;
}

export interface DrawPreview {
  groupSize: number;
  groupCount: number;
  sizes: number[];
  /** Players who will head each group, in group order. */
  seeds: Player[];
  /** Match order for each group size present. */
  orders: { size: number; pairs: [number, number][] }[];
}

export interface ImportPreview {
  players: NewPlayer[];
  /** One message per line that couldn't be read. */
  errors: string[];
}
