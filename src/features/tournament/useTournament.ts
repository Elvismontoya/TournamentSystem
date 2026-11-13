import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../api/client.ts';
import { tournamentsApi } from '../../api/tournaments.ts';
import type {
  BracketSlot,
  DrawPreview,
  ImportPreview,
  NewPlayer,
  Player,
  SettingsUpdate,
  TournamentView,
} from '../../api/types.ts';

/** Tournament shared by every section (Outlet context): the API's view plus its actions. */
export interface Tournament {
  view: TournamentView;
  /** Message of the last action that failed (shown in a banner), or null. */
  actionError: string | null;
  dismissActionError: () => void;
  /** Throws ApiError (e.g. rules locked by results) so the form can show it. */
  updateSettings: (settings: SettingsUpdate) => Promise<void>;
  /** Deletes the tournament for good. Throws ApiError. */
  deleteTournament: () => Promise<void>;
  /** Throws ApiError (e.g. Nr. already taken) so the form can show it. */
  addPlayer: (entry: NewPlayer) => Promise<Player>;
  previewImport: (text: string) => Promise<ImportPreview>;
  /** Throws ApiError (with one detail per invalid line). */
  importPlayers: (text: string) => Promise<void>;
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
  setWalkover: (groupIndex: number, matchIndex: number, absent: 0 | 1 | null) => void;
  drawKnockout: () => void;
  moveKnockoutSlot: (position: number, slot: BracketSlot) => void;
}

export type TournamentState =
  | { status: 'loading' }
  | { status: 'error'; message: string; retry: () => void }
  | { status: 'ready'; tournament: Tournament };

const messageOf = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.';

/** Sets one score locally, so typing feels instant while the request is on its way. */
function withSet(
  view: TournamentView,
  groupIndex: number,
  matchIndex: number,
  setIndex: number,
  side: 0 | 1,
  value: number | null,
): TournamentView {
  const { groupStage } = view;
  if (!groupStage) return view;
  return {
    ...view,
    groupStage: {
      ...groupStage,
      groups: groupStage.groups.map((group, gi) =>
        gi !== groupIndex
          ? group
          : {
              ...group,
              matches: group.matches.map((match, mi) =>
                mi !== matchIndex
                  ? match
                  : {
                      ...match,
                      result: {
                        ...match.result,
                        sets: match.result.sets.map((set, si) => {
                          if (si !== setIndex) return set;
                          return side === 0 ? [value, set[1]] : [set[0], value];
                        }),
                      },
                    },
              ),
            },
      ),
    },
  };
}

/**
 * Loads a tournament from the API and exposes its actions. Changes are sent one after
 * another (in order); the screen takes the server's view once nothing is pending, so fast
 * typing in the score boxes never jumps back.
 */
export function useTournament(tournamentId: string): TournamentState {
  const [view, setView] = useState<TournamentView | null>(null);
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
        setView(loaded);
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
      run: () => Promise<TournamentView>,
      optimistic?: (current: TournamentView) => TournamentView,
    ): Promise<void> => {
      if (optimistic) setView((current) => current && optimistic(current));
      pending.current++;
      const task = queue.current.then(run);
      queue.current = task.catch(() => undefined);
      try {
        const next = await task;
        pending.current--;
        if (pending.current === 0) setView(next);
      } catch (error) {
        pending.current--;
        // Resync with the server (an optimistic change may not have been saved).
        if (pending.current === 0) {
          tournamentsApi.get(tournamentId).then(setView, () => undefined);
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

  if (loadError && !view) {
    return {
      status: 'error',
      message: loadError,
      retry: () => {
        setLoadError(null);
        setAttempt((value) => value + 1);
      },
    };
  }
  if (!view) return { status: 'loading' };

  const id = tournamentId;
  return {
    status: 'ready',
    tournament: {
      view,
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
      previewImport: (text) => tournamentsApi.previewImport(id, text),
      importPlayers: (text) =>
        mutate(async () => (await tournamentsApi.importPlayers(id, text)).view),
      previewDraw: (groupSize) => tournamentsApi.previewDraw(id, groupSize),
      drawGroups: (groupSize) => mutate(() => tournamentsApi.drawGroups(id, groupSize)),
      setGroupPlayers: (groupIndex, playerIds) =>
        mutate(() => tournamentsApi.setGroupPlayers(id, groupIndex, playerIds)),
      updateSet: (groupIndex, matchIndex, setIndex, side, value) => {
        fire(
          mutate(
            () => tournamentsApi.updateSet(id, groupIndex, matchIndex, setIndex, side, value),
            (current) => withSet(current, groupIndex, matchIndex, setIndex, side, value),
          ),
        );
      },
      setWalkover: (groupIndex, matchIndex, absent) => {
        fire(mutate(() => tournamentsApi.setWalkover(id, groupIndex, matchIndex, absent)));
      },
      drawKnockout: () => {
        fire(mutate(() => tournamentsApi.drawKnockout(id)));
      },
      moveKnockoutSlot: (position, slot) => {
        fire(mutate(() => tournamentsApi.moveKnockoutSlot(id, position, slot)));
      },
    },
  };
}
