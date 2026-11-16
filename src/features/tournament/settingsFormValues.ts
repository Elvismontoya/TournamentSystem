// Values of the tournament's settings form (creation wizard and Configuración): defaults,
// current values, client-side checks and conversion to the API body. The fields are in
// settingsForm.tsx.

import type { Scoring, SettingsUpdate, TournamentView } from '../../api/types.ts';
import { FORMATS, MODALITIES, SPORTS, type CatalogItem } from '../../constants/catalog.ts';
/** Form values: numbers typed by hand stay as text until saving. */
export interface SettingsFormValues {
  name: string;
  sport: string;
  format: string;
  modalities: string[];
  categories: string[];
  startDate: string;
  endDate: string;
  location: string;
  defaultGroupSize: string;
  qualifiersPerGroup: number;
  seeded: boolean;
  scoring: Scoring;
  setsPerMatch: number;
  knockoutSetsPerMatch: number;
  gamePoints: string;
  winMargin: string;
  thirdPlaceMatch: boolean;
  pointsWin: string;
  pointsLoss: string;
  pointsWalkover: string;
}

export type SetValue = <K extends keyof SettingsFormValues>(
  key: K,
  value: SettingsFormValues[K],
) => void;

/** What can't change any more (Configuración) and the limits of the numbers. */
export interface FormLimits {
  minGroupSize: number;
  maxGroupSize: number;
  /** Results entered: sets per match, scoring, points per set and margin are fixed. */
  rulesLocked: boolean;
  /** Knockout results entered: knockout sets and qualifiers are fixed. */
  knockoutRulesLocked: boolean;
  thirdPlaceLocked: boolean;
}

/** A new tournament: nothing locked. */
export const NEW_TOURNAMENT_LIMITS: FormLimits = {
  minGroupSize: 3,
  maxGroupSize: 6,
  rulesLocked: false,
  knockoutRulesLocked: false,
  thirdPlaceLocked: false,
};

const firstAvailable = (items: CatalogItem[]) => items.find((item) => item.available)?.name ?? '';

/** Starting values of the creation wizard (ITTF-style defaults). */
export function newTournamentValues(): SettingsFormValues {
  return {
    name: '',
    sport: firstAvailable(SPORTS),
    format: firstAvailable(FORMATS),
    modalities: [firstAvailable(MODALITIES)],
    categories: [],
    startDate: '',
    endDate: '',
    location: '',
    defaultGroupSize: '4',
    qualifiersPerGroup: 2,
    seeded: true,
    scoring: 'points',
    setsPerMatch: 5,
    knockoutSetsPerMatch: 5,
    gamePoints: '11',
    winMargin: '2',
    thirdPlaceMatch: false,
    pointsWin: '2',
    pointsLoss: '1',
    pointsWalkover: '0',
  };
}

/** Current values of a tournament, for Configuración. */
export function formValuesOf({
  name,
  settings,
}: Pick<TournamentView, 'name' | 'settings'>): SettingsFormValues {
  return {
    name,
    sport: settings.sport,
    format: settings.format,
    modalities: settings.modalities,
    categories: settings.categories,
    startDate: settings.startDate ?? '',
    endDate: settings.endDate ?? '',
    location: settings.location,
    defaultGroupSize: String(settings.defaultGroupSize),
    qualifiersPerGroup: settings.qualifiersPerGroup,
    seeded: settings.seeded,
    scoring: settings.scoring,
    setsPerMatch: settings.setsPerMatch,
    knockoutSetsPerMatch: settings.knockoutSetsPerMatch,
    gamePoints: String(settings.gamePoints),
    winMargin: String(settings.winMargin),
    thirdPlaceMatch: settings.thirdPlaceMatch,
    pointsWin: String(settings.pointsWin),
    pointsLoss: String(settings.pointsLoss),
    pointsWalkover: String(settings.pointsWalkover),
  };
}

/**
 * "Copiar formato de otro torneo": the general data typed in step 1 (name, modalities,
 * categories, dates, place) plus everything else (sport, format and rules) from `source`.
 */
export function withCopiedRules(
  general: SettingsFormValues,
  source: Pick<TournamentView, 'name' | 'settings'>,
): SettingsFormValues {
  return {
    ...formValuesOf(source),
    name: general.name,
    modalities: general.modalities,
    categories: general.categories,
    startDate: general.startDate,
    endDate: general.endDate,
    location: general.location,
  };
}

/** First problem with the general data (step 1), or null. The server checks it again. */
export function generalError(values: SettingsFormValues): string | null {
  if (values.name.trim() === '') return 'Escribe el nombre del torneo.';
  if (values.sport === '') return 'Elige el deporte.';
  if (values.format === '') return 'Elige el formato.';
  if (values.modalities.length === 0) return 'Elige al menos una modalidad.';
  if (values.categories.length === 0) return 'Elige al menos una categoría.';
  if (values.startDate === '') return 'Elige la fecha de inicio.';
  if (values.endDate !== '' && values.endDate < values.startDate) {
    return 'La fecha de fin no puede ser anterior a la de inicio.';
  }
  return null;
}

function integer(value: string, label: string): number {
  const number = Number(value);
  if (value.trim() === '' || !Number.isInteger(number)) {
    throw new Error(`${label}: escribe un número entero.`);
  }
  return number;
}

/** Form → API body; throws Error with a message for the first number that isn't one. */
export function settingsUpdateOf(values: SettingsFormValues): SettingsUpdate {
  return {
    name: values.name,
    sport: values.sport,
    format: values.format,
    modalities: values.modalities,
    categories: values.categories,
    startDate: values.startDate || null,
    endDate: values.endDate || null,
    location: values.location,
    defaultGroupSize: integer(values.defaultGroupSize, 'Participantes por grupo'),
    qualifiersPerGroup: values.qualifiersPerGroup,
    seeded: values.seeded,
    scoring: values.scoring,
    setsPerMatch: values.setsPerMatch,
    knockoutSetsPerMatch: values.knockoutSetsPerMatch,
    gamePoints: integer(values.gamePoints, 'Puntos por set'),
    winMargin: integer(values.winMargin, 'Diferencia mínima'),
    thirdPlaceMatch: values.thirdPlaceMatch,
    pointsWin: integer(values.pointsWin, 'Victoria'),
    pointsLoss: integer(values.pointsLoss, 'Derrota'),
    pointsWalkover: integer(values.pointsWalkover, 'No presentado (W.O.)'),
  };
}
