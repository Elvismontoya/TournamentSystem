import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../api/client.ts';
import { tournamentsApi } from '../../api/tournaments.ts';
import type {
  BracketSlot,
  CategoryMap,
  CategoryView,
  DrawPreview,
  ImportPreview,
  KnockoutMatchView,
  MatchResult,
  NewPlayer,
  Player,
  PlayerUpdate,
  SettingsUpdate,
  TournamentData,
  TournamentView,
} from '../../api/types.ts';

/**
 * Tournament shared by every section (Outlet context): the view of the category chosen in
 * the header, plus the actions. Groups, matches and bracket actions apply to that category.
 */
export interface Tournament {
  view: TournamentView;
  /**
   * Competitions (a category in a division) with registered players, each with how many: each
   * one plays apart. While nobody is registered, all of them.
   */
  competitions: { name: string; registered: number }[];
  /** Shows another competition in every section. */
  selectCategory: (competition: string) => void;
  /** Message of the last action that failed (shown in a banner), or null. */
  actionError: string | null;
  dismissActionError: () => void;
  /** Throws ApiError (e.g. rules locked by results) so the form can show it. */
  updateSettings: (settings: SettingsUpdate) => Promise<void>;
  /** Deletes the tournament for good. Throws ApiError. */
  deleteTournament: () => Promise<void>;
  /** Throws ApiError (e.g. Nr. already taken) so the form can show it. */
  addPlayer: (entry: NewPlayer) => Promise<Player>;
  /** Throws ApiError (e.g. Nr. already taken) so the form can show it. */
  updatePlayer: (playerId: string, entry: PlayerUpdate) => Promise<void>;
  /** Throws ApiError (e.g. the player is in a group). */
  removePlayer: (playerId: string) => Promise<void>;
  /** Removes every player (every category) and the draws. Throws ApiError. */
  removeAllPlayers: () => Promise<void>;
  previewImport: (rows: string[][], categoryMap: CategoryMap) => Promise<ImportPreview>;
  /** Throws ApiError (with one detail per problem). */
  importPlayers: (rows: string[][], categoryMap: CategoryMap) => Promise<void>;
  previewDraw: (groupSize: number) => Promise<DrawPreview>;
  drawGroups: (groupSize: number) => Promise<void>;
  setGroupPlayers: (groupIndex: number, playerIds: string[]) => Promise<void>;
  updateSet: (
    groupIndex: number,
    matchIndex: number,
    setIndex: number,
    side: 0 | 1,
    value: number | null,
  ) => void;
  /** Final score in sets (tournaments scored by sets only). */
  updateScore: (groupIndex: number, matchIndex: number, side: 0 | 1, value: number | null) => void;
  setWalkover: (groupIndex: number, matchIndex: number, absent: 0 | 1 | null) => void;
  drawKnockout: () => void;
  moveKnockoutSlot: (position: number, slot: BracketSlot) => void;
  updateKnockoutSet: (
    round: number,
    matchIndex: number,
    setIndex: number,
    side: 0 | 1,
    value: number | null,
  ) => void;
  updateKnockoutScore: (
    round: number,
    matchIndex: number,
    side: 0 | 1,
    value: number | null,
  ) => void;
  setKnockoutWalkover: (round: number, matchIndex: number, absent: 0 | 1 | null) => void;
}

const EMPTY_CATEGORY: Omit<CategoryView, 'name' | 'category' | 'division'> = {
  registered: 0,
  seedIds: [],
  groupStage: null,
  knockout: null,
  ranking: null,
};

/** A player plays in a competition: same category, and same gender unless it is mixed. */
function playsIn(player: Player, competition: Pick<CategoryView, 'category' | 'division'>) {
  if (player.category !== competition.category) return false;
  if (competition.division === 'Mixto') return true;
  return player.gender === (competition.division === 'Femenino' ? 'F' : 'M');
}

/** The view the pages show: the tournament with one competition (category + division). */
function viewOf(data: TournamentData, key: string): TournamentView {
  const found = data.categories.find((entry) => entry.name === key);
  const competition = found ?? {
    ...EMPTY_CATEGORY,
    name: key,
    category: '',
    division: 'Mixto' as const,
  };
  return {
    id: data.id,
    name: data.name,
    settings: data.settings,
    category: key,
    competition: { category: competition.category, division: competition.division },
    players: found ? data.players.filter((player) => playsIn(player, found)) : [],
    allPlayers: data.players,
    nextBib: data.nextBib,
    seedIds: competition.seedIds,
    groupStage: competition.groupStage,
    knockout: competition.knockout,
    ranking: competition.ranking,
  };
}
/** Applies `change` to one category's competition (for instant local updates). */
function onCategory(
  data: TournamentData,
  category: string,
  change: (competition: CategoryView) => CategoryView,
): TournamentData {
  return {
    ...data,
    categories: data.categories.map((entry) => (entry.name === category ? change(entry) : entry)),
  };
}

/** One side of a final score changed (sets only), so typing feels instant. */
function withScore(result: MatchResult, side: 0 | 1, value: number | null): MatchResult {
  const score = result.score ?? [null, null];
  return { ...result, score: side === 0 ? [value, score[1]] : [score[0], value] };
}

/** One set's score changed, so typing feels instant while the request is on its way. */
function withSetScore(
  result: MatchResult,
  setIndex: number,
  side: 0 | 1,
  value: number | null,
): MatchResult {
  return {
    ...result,
    sets: result.sets.map((set, index) => {
      if (index !== setIndex) return set;
      return side === 0 ? [value, set[1]] : [set[0], value];
    }),
  };
}

/** Applies `change` to one group match of a category. */
function withGroupMatch(
  competition: CategoryView,
  groupIndex: number,
  matchIndex: number,
  change: (result: MatchResult) => MatchResult,
): CategoryView {
  const { groupStage } = competition;
  if (!groupStage) return competition;
  return {
    ...competition,
    groupStage: {
      ...groupStage,
      groups: groupStage.groups.map((group, gi) =>
        gi !== groupIndex
          ? group
          : {
              ...group,
              matches: group.matches.map((match, mi) =>
                mi !== matchIndex ? match : { ...match, result: change(match.result) },
              ),
            },
      ),
    },
  };
}

/** Applies `change` to one knockout match (match 1 of the last round = 3rd place). */
function withKnockoutMatch(
  competition: CategoryView,
  round: number,
  matchIndex: number,
  change: (result: MatchResult) => MatchResult,
): CategoryView {
  const { knockout } = competition;
  if (!knockout) return competition;
  const update = (match: KnockoutMatchView) => ({ ...match, result: change(match.result) });
  if (knockout.thirdPlace && round === knockout.rounds.length - 1 && matchIndex === 1) {
    return { ...competition, knockout: { ...knockout, thirdPlace: update(knockout.thirdPlace) } };
  }
  return {
    ...competition,
    knockout: {
      ...knockout,
      rounds: knockout.rounds.map((matches, ri) =>
        ri !== round
          ? matches
          : matches.map((match, mi) => (mi !== matchIndex ? match : update(match))),
      ),
    },
  };
}

export type TournamentState =
  | { status: 'loading' }
  | { status: 'error'; message: string; retry: () => void }
  | { status: 'ready'; tournament: Tournament };

const messageOf = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.';

/**
 * Loads a tournament from the API and exposes its actions. Changes are sent one after
 * another (in order); the screen takes the server's data once nothing is pending, so fast
 * typing in the score boxes never jumps back.
 */
export function useTournament(tournamentId: string): TournamentState {
  const [data, setData] = useState<TournamentData | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const pending = useRef(0);

  useEffect(() => {
    let active = true;
    tournamentsApi.get(tournamentId).then(
      (loaded) => {
        if (!active) return;
        setData(loaded);
        setLoadError(null);
      },
      (error: unknown) => {
        if (active) setLoadError(messageOf(error));
      },
    );
    return () => {
      active = false;
    };
  }, [tournamentId, attempt]);

  /** Runs a change after the previous ones; applies the result when nothing else is pending. */
  const mutate = useCallback(
    async (
      run: () => Promise<TournamentData>,
      optimistic?: (current: TournamentData) => TournamentData,
    ): Promise<void> => {
      if (optimistic) setData((current) => current && optimistic(current));
      pending.current++;
      const task = queue.current.then(run);
      queue.current = task.catch(() => undefined);
      try {
        const next = await task;
        pending.current--;
        if (pending.current === 0) setData(next);
      } catch (error) {
        pending.current--;
        // Resync with the server (an optimistic change may not have been saved).
        if (pending.current === 0) {
          tournamentsApi.get(tournamentId).then(setData, () => undefined);
        }
        throw error;
      }
    },
    [tournamentId],
  );

  /** For actions without their own form: a failure goes to the banner. */
  const fire = useCallback((promise: Promise<void>) => {
    promise.then(
      () => {
        setActionError(null);
      },
      (error: unknown) => {
        setActionError(messageOf(error));
      },
    );
  }, []);

  if (loadError && !data) {
    return {
      status: 'error',
      message: loadError,
      retry: () => {
        setLoadError(null);
        setAttempt((value) => value + 1);
      },
    };
  }
  if (!data) return { status: 'loading' };

  const id = tournamentId;
  // Only competitions with registered players are offered (all of them while nobody is
  // registered). The chosen one, or the first offered (also when the chosen one empties).
  const withPlayers = data.categories.filter((competition) => competition.registered > 0);
  const offered = (withPlayers.length > 0 ? withPlayers : data.categories).map(
    ({ name, registered }) => ({ name, registered }),
  );
  const keys = offered.map((competition) => competition.name);
  const category = chosen !== null && keys.includes(chosen) ? chosen : (keys.at(0) ?? '');
  const local =
    (change: (competition: CategoryView) => CategoryView) => (current: TournamentData) =>
      onCategory(current, category, change);

  return {
    status: 'ready',
    tournament: {
      view: viewOf(data, category),
      competitions: offered,
      selectCategory: setChosen,
      actionError,
      dismissActionError: () => {
        setActionError(null);
      },
      updateSettings: (settings) => mutate(() => tournamentsApi.updateSettings(id, settings)),
      deleteTournament: async () => {
        await tournamentsApi.remove(id);
      },
      addPlayer: async (entry) => {
        const result: { added?: Player } = {};
        await mutate(async () => {
          const response = await tournamentsApi.addPlayer(id, entry);
          result.added = response.added;
          return response.view;
        });
        if (!result.added) throw new ApiError(500, 'El servidor no devolvió el jugador inscrito.');
        return result.added;
      },
      updatePlayer: (playerId, entry) =>
        mutate(() => tournamentsApi.updatePlayer(id, playerId, entry)),
      removePlayer: (playerId) => mutate(() => tournamentsApi.removePlayer(id, playerId)),
      removeAllPlayers: () => mutate(() => tournamentsApi.removeAllPlayers(id)),
      previewImport: (rows, categoryMap) => tournamentsApi.previewImport(id, rows, categoryMap),
      importPlayers: (rows, categoryMap) =>
        mutate(async () => (await tournamentsApi.importPlayers(id, rows, categoryMap)).view),
      previewDraw: (groupSize) => tournamentsApi.previewDraw(id, category, groupSize),
      drawGroups: (groupSize) => mutate(() => tournamentsApi.drawGroups(id, category, groupSize)),
      setGroupPlayers: (groupIndex, playerIds) =>
        mutate(() => tournamentsApi.setGroupPlayers(id, category, groupIndex, playerIds)),
      updateSet: (groupIndex, matchIndex, setIndex, side, value) => {
        fire(
          mutate(
            () =>
              tournamentsApi.updateSet(id, category, groupIndex, matchIndex, setIndex, side, value),
            local((competition) =>
              withGroupMatch(competition, groupIndex, matchIndex, (result) =>
                withSetScore(result, setIndex, side, value),
              ),
            ),
          ),
        );
      },
      updateScore: (groupIndex, matchIndex, side, value) => {
        fire(
          mutate(
            () => tournamentsApi.updateScore(id, category, groupIndex, matchIndex, side, value),
            local((competition) =>
              withGroupMatch(competition, groupIndex, matchIndex, (result) =>
                withScore(result, side, value),
              ),
            ),
          ),
        );
      },
      setWalkover: (groupIndex, matchIndex, absent) => {
        fire(
          mutate(() => tournamentsApi.setWalkover(id, category, groupIndex, matchIndex, absent)),
        );
      },
      drawKnockout: () => {
        fire(mutate(() => tournamentsApi.drawKnockout(id, category)));
      },
      moveKnockoutSlot: (position, slot) => {
        fire(mutate(() => tournamentsApi.moveKnockoutSlot(id, category, position, slot)));
      },
      updateKnockoutSet: (round, matchIndex, setIndex, side, value) => {
        fire(
          mutate(
            () =>
              tournamentsApi.updateKnockoutSet(
                id,
                category,
                round,
                matchIndex,
                setIndex,
                side,
                value,
              ),
            local((competition) =>
              withKnockoutMatch(competition, round, matchIndex, (result) =>
                withSetScore(result, setIndex, side, value),
              ),
            ),
          ),
        );
      },
      updateKnockoutScore: (round, matchIndex, side, value) => {
        fire(
          mutate(
            () => tournamentsApi.updateKnockoutScore(id, category, round, matchIndex, side, value),
            local((competition) =>
              withKnockoutMatch(competition, round, matchIndex, (result) =>
                withScore(result, side, value),
              ),
            ),
          ),
        );
      },
      setKnockoutWalkover: (round, matchIndex, absent) => {
        fire(
          mutate(() => tournamentsApi.setKnockoutWalkover(id, category, round, matchIndex, absent)),
        );
      },
    },
  };
}
