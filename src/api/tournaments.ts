// Tournament endpoints of TournamentSystem-backend (one function per route). Every change
// returns the whole tournament (every category); groups and bracket go under a category.
import { request } from './client.ts';
import type {
  BracketSlot,
  CategoryMap,
  DrawPreview,
  ImportPreview,
  NewPlayer,
  Player,
  PlayerUpdate,
  SettingsUpdate,
  TournamentData,
  TournamentSummary,
} from './types.ts';

const base = (id: string) => `/torneos/${encodeURIComponent(id)}`;
/** A category's competition: groups and bracket of that category only. */
const stage = (id: string, category: string) =>
  `${base(id)}/categorias/${encodeURIComponent(category)}`;

export const tournamentsApi = {
  list: () => request<TournamentSummary[]>('GET', '/torneos'),

  /** Creates a tournament with every setting of the creation wizard. */
  create: (settings: SettingsUpdate) => request<TournamentData>('POST', '/torneos', settings),

  get: (id: string) => request<TournamentData>('GET', base(id)),

  remove: (id: string) => request<null>('DELETE', base(id)),

  updateSettings: (id: string, settings: SettingsUpdate) =>
    request<TournamentData>('PUT', `${base(id)}/configuracion`, settings),

  addPlayer: (id: string, entry: NewPlayer) =>
    request<{ view: TournamentData; added: Player }>('POST', `${base(id)}/participantes`, entry),

  updatePlayer: (id: string, playerId: string, entry: PlayerUpdate) =>
    request<TournamentData>(
      'PUT',
      `${base(id)}/participantes/${encodeURIComponent(playerId)}`,
      entry,
    ),

  /** Removes every player (and every draw), while there are no results. */
  removeAllPlayers: (id: string) => request<TournamentData>('DELETE', `${base(id)}/participantes`),

  removePlayer: (id: string, playerId: string) =>
    request<TournamentData>('DELETE', `${base(id)}/participantes/${encodeURIComponent(playerId)}`),

  /**
   * How the server reads the spreadsheet rows (cells of the first sheet), without importing.
   * `categoryMap` says where each category of the file goes.
   */
  previewImport: (id: string, rows: string[][], categoryMap: CategoryMap) =>
    request<ImportPreview>('POST', `${base(id)}/participantes/importar`, {
      rows,
      categoryMap,
      dryRun: true,
    }),

  importPlayers: (id: string, rows: string[][], categoryMap: CategoryMap) =>
    request<{ view: TournamentData; added: Player[] }>(
      'POST',
      `${base(id)}/participantes/importar`,
      { rows, categoryMap },
    ),

  previewDraw: (id: string, category: string, groupSize: number) =>
    request<DrawPreview>(
      'GET',
      `${stage(id, category)}/grupos/vista-previa?tamano=${String(groupSize)}`,
    ),

  drawGroups: (id: string, category: string, groupSize: number) =>
    request<TournamentData>('POST', `${stage(id, category)}/grupos/sorteo`, { groupSize }),

  setGroupPlayers: (id: string, category: string, groupIndex: number, playerIds: string[]) =>
    request<TournamentData>(
      'PUT',
      `${stage(id, category)}/grupos/${String(groupIndex)}/jugadores`,
      { playerIds },
    ),

  updateSet: (
    id: string,
    category: string,
    groupIndex: number,
    matchIndex: number,
    setIndex: number,
    side: 0 | 1,
    value: number | null,
  ) =>
    request<TournamentData>(
      'PUT',
      `${stage(id, category)}/grupos/${String(groupIndex)}/partidos/${String(matchIndex)}/sets/${String(setIndex)}`,
      { side, value },
    ),

  /** Final score in sets (tournaments scored by sets only). */
  updateScore: (
    id: string,
    category: string,
    groupIndex: number,
    matchIndex: number,
    side: 0 | 1,
    value: number | null,
  ) =>
    request<TournamentData>(
      'PUT',
      `${stage(id, category)}/grupos/${String(groupIndex)}/partidos/${String(matchIndex)}/marcador`,
      { side, value },
    ),

  setWalkover: (
    id: string,
    category: string,
    groupIndex: number,
    matchIndex: number,
    absent: 0 | 1 | null,
  ) =>
    request<TournamentData>(
      'PUT',
      `${stage(id, category)}/grupos/${String(groupIndex)}/partidos/${String(matchIndex)}/wo`,
      { absent },
    ),

  drawKnockout: (id: string, category: string) =>
    request<TournamentData>('POST', `${stage(id, category)}/llaves/sorteo`),

  moveKnockoutSlot: (id: string, category: string, position: number, slot: BracketSlot) =>
    request<TournamentData>('PUT', `${stage(id, category)}/llaves/posiciones/${String(position)}`, {
      slot,
    }),

  updateKnockoutSet: (
    id: string,
    category: string,
    round: number,
    matchIndex: number,
    setIndex: number,
    side: 0 | 1,
    value: number | null,
  ) =>
    request<TournamentData>(
      'PUT',
      `${stage(id, category)}/llaves/rondas/${String(round)}/partidos/${String(matchIndex)}/sets/${String(setIndex)}`,
      { side, value },
    ),

  updateKnockoutScore: (
    id: string,
    category: string,
    round: number,
    matchIndex: number,
    side: 0 | 1,
    value: number | null,
  ) =>
    request<TournamentData>(
      'PUT',
      `${stage(id, category)}/llaves/rondas/${String(round)}/partidos/${String(matchIndex)}/marcador`,
      { side, value },
    ),

  setKnockoutWalkover: (
    id: string,
    category: string,
    round: number,
    matchIndex: number,
    absent: 0 | 1 | null,
  ) =>
    request<TournamentData>(
      'PUT',
      `${stage(id, category)}/llaves/rondas/${String(round)}/partidos/${String(matchIndex)}/wo`,
      { absent },
    ),
};
