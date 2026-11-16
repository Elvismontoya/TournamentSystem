// Catalogs for creating and configuring a tournament. For now they are fixed here; they
// will come from their own database tables (Deporte, Formato, Modalidad, Categoría), so
// each entry already has the shape of a row: an id, the name that gets saved, and whether
// it can be chosen yet. Only what the platform supports today is available.

import type { Gender } from '../api/types.ts';

export interface CatalogItem {
  id: string;
  name: string;
  /** False: shown (to tell it's coming) but can't be chosen yet. */
  available: boolean;
}

export const SPORTS: CatalogItem[] = [
  { id: 'tenis-de-mesa', name: 'Tenis de mesa', available: true },
  { id: 'futbol', name: 'Fútbol', available: false },
  { id: 'baloncesto', name: 'Baloncesto', available: false },
  { id: 'voleibol', name: 'Voleibol', available: false },
];

export const FORMATS: CatalogItem[] = [
  { id: 'grupos-eliminacion', name: 'Grupos + eliminación', available: true },
  { id: 'eliminacion-directa', name: 'Eliminación directa', available: false },
  { id: 'todos-contra-todos', name: 'Todos contra todos', available: false },
];

/** How players take part ("modalidad"). */
export const MODALITIES: CatalogItem[] = [
  { id: 'individual', name: 'Individual', available: true },
  { id: 'dobles', name: 'Dobles', available: false },
  { id: 'dobles-mixtos', name: 'Dobles mixtos', available: false },
  { id: 'equipos', name: 'Equipos', available: false },
];

export const GENDERS: { value: Gender; label: string }[] = [
  { value: 'F', label: 'Femenino' },
  { value: 'M', label: 'Masculino' },
];

/** Age categories. A tournament can include several (or all). */
export const CATEGORIES: CatalogItem[] = [
  { id: 'sub-11', name: 'Sub 11', available: true },
  { id: 'sub-13', name: 'Sub 13', available: true },
  { id: 'sub-16', name: 'Sub 16', available: true },
  { id: 'sub-19', name: 'Sub 19', available: true },
  { id: 'mayores', name: 'Mayores (Libre)', available: true },
  { id: 'senior', name: 'Senior', available: true },
];
