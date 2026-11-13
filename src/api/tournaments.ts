// Tournament endpoints of TournamentSystem-backend (one function per route).
import { request } from './client.ts';
import type {
  BracketSlot,
  DrawPreview,
  ImportPreview,
  NewPlayer,
  Player,
  SettingsUpdate,
  TournamentView,
} from './types.ts';

const base = (id: string) => `/torneos/${encodeURIComponent(id)}`;

export const tournamentsApi = {
  get: (id: string) => request<TournamentView>('GET', base(id)),

  remove: (id: string) => request<null>('DELETE', base(id)),

  updateSettings: (id: string, settings: SettingsUpdate) =>
    request<TournamentView>('PUT', `${base(id)}/configuracion`, settings),

  addPlayer: (id: string, entry: NewPlayer) =>
    request<{ view: TournamentView; added: Player }>('POST', `${base(id)}/participantes`, entry),

  previewImport: (id: string, text: string) =>
    request<ImportPreview>('POST', `${base(id)}/participantes/importar`, { text, dryRun: true }),

  importPlayers: (id: string, text: string) =>
    request<{ view: TournamentView; added: Player[] }>(
      'POST',
      `${base(id)}/participantes/importar`,
      { text },
    ),

  previewDraw: (id: string, groupSize: number) =>
    request<DrawPreview>('GET', `${base(id)}/grupos/vista-previa?tamano=${String(groupSize)}`),

  drawGroups: (id: string, groupSize: number) =>
    request<TournamentView>('POST', `${base(id)}/grupos/sorteo`, { groupSize }),

  setGroupPlayers: (id: string, groupIndex: number, playerIds: string[]) =>
    request<TournamentView>('PUT', `${base(id)}/grupos/${String(groupIndex)}/jugadores`, {
      playerIds,
    }),

  updateSet: (
    id: string,
    groupIndex: number,
    matchIndex: number,
    setIndex: number,
    side: 0 | 1,
    value: number | null,
  ) =>
    request<TournamentView>(
      'PUT',
      `${base(id)}/grupos/${String(groupIndex)}/partidos/${String(matchIndex)}/sets/${String(setIndex)}`,
      { side, value },
    ),

  setWalkover: (id: string, groupIndex: number, matchIndex: number, absent: 0 | 1 | null) =>
    request<TournamentView>(
      'PUT',
      `${base(id)}/grupos/${String(groupIndex)}/partidos/${String(matchIndex)}/wo`,
      { absent },
    ),

  drawKnockout: (id: string) => request<TournamentView>('POST', `${base(id)}/llaves/sorteo`),

  moveKnockoutSlot: (id: string, position: number, slot: BracketSlot) =>
    request<TournamentView>('PUT', `${base(id)}/llaves/posiciones/${String(position)}`, { slot }),
};
