// Display helpers (not tournament rules: those live in the backend): the search box, round
// names and keys for the bracket selects.

import type { BracketSlot, Player } from '../../api/types.ts';

/** Lowercase without accents, so "mejia" matches "Mejía". */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Group number typed in the search box ("3", "g3", "grupo 3"), or null if it's a name search. */
export function groupNumberFromQuery(query: string): string | null {
  const match = /^(?:grupo|g)?\s*(\d+)$/.exec(normalize(query));
  return match ? match[1] : null;
}

/**
 * True when the group passes the search: a group number search matches that group;
 * a name search matches groups with at least one matching player.
 */
export function groupMatchesQuery(group: { name: string; players: Player[] }, query: string) {
  const groupNumber = groupNumberFromQuery(query);
  if (groupNumber !== null) return group.name === groupNumber;
  return group.players.some((player) => matchesPlayer(player, query));
}

/** True when the player's name or delegation contains the search text (empty = everyone). */
export function matchesPlayer(player: Player, query: string): boolean {
  const needle = normalize(query);
  return (
    needle === '' ||
    normalize(player.name).includes(needle) ||
    normalize(player.delegation).includes(needle)
  );
}

/** Name of a round by the number of players in it. */
export function roundName(players: number): string {
  switch (players) {
    case 2:
      return 'Final';
    case 4:
      return 'Semifinal';
    case 8:
      return 'Cuartos de final';
    case 16:
      return 'Octavos de final';
    default:
      return `Ronda de ${String(players)}`;
  }
}

/** Stable key for a bracket slot: "1-0" = 1st of group 1, "2-3" = 2nd of group 4, "bye". */
export function slotKey(slot: BracketSlot): string {
  return slot.kind === 'bye' ? 'bye' : `${String(slot.place)}-${String(slot.groupIndex)}`;
}
