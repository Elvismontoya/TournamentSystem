// Display texts built from the tournament's settings (Configuración), shared by every page.
import type { Settings } from '../../api/types.ts';

/** Match lengths offered in Configuración (best of N sets). */
export const BEST_OF_VALUES = [1, 3, 5, 7, 9];

export function bestOfLabel(sets: number): string {
  return sets === 1 ? 'A 1 set' : `Al mejor de ${String(sets)} sets`;
}

/** "Sets a 11 puntos con 2 de diferencia (12-10, 13-11…)". */
export function setRuleText({ gamePoints, winMargin }: Settings): string {
  if (winMargin <= 1) return `Sets a ${String(gamePoints)} puntos`;
  const example = [1, 2]
    .map((extra) => `${String(gamePoints + extra)}-${String(gamePoints + extra - winMargin)}`)
    .join(', ');
  return `Sets a ${String(gamePoints)} puntos con ${String(winMargin)} de diferencia (${example}…)`;
}

/** "Al mejor de 5 sets a 11 puntos". */
export function matchRuleText({ setsPerMatch, gamePoints }: Settings): string {
  return `${bestOfLabel(setsPerMatch)} a ${String(gamePoints)} puntos`;
}

/** "Victoria 2 · Derrota 1 · W.O. 0". */
export function scoringText({ pointsWin, pointsLoss, pointsWalkover }: Settings): string {
  return `Victoria ${String(pointsWin)} · Derrota ${String(pointsLoss)} · W.O. ${String(pointsWalkover)}`;
}

/** What a walkover means with these rules: "El rival gana 3-0 (11-0 por set)…". */
export function walkoverText({ setsToWin, gamePoints, pointsWalkover }: Settings): string {
  const points = pointsWalkover === 1 ? '1 punto' : `${String(pointsWalkover)} puntos`;
  return `El rival gana ${String(setsToWin)}-0 (${String(gamePoints)}-0 por set). El ausente suma ${points} en el grupo.`;
}

/** Same for a knockout match: the rival advances. */
export function knockoutWalkoverText({ knockoutSetsPerMatch, gamePoints }: Settings): string {
  const toWin = Math.ceil(knockoutSetsPerMatch / 2);
  return `El rival gana ${String(toWin)}-0 (${String(gamePoints)}-0 por set) y pasa a la ronda siguiente.`;
}

const dateFormat = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatDate(iso: string): string {
  return dateFormat.format(new Date(`${iso}T00:00:00Z`));
}

/** "15 de noviembre de 2026" or "15 – 16 de noviembre de 2026"-style range; null if unset. */
export function dateRangeText({ startDate, endDate }: Settings): string | null {
  if (!startDate) return endDate ? `Hasta el ${formatDate(endDate)}` : null;
  if (!endDate || endDate === startDate) return formatDate(startDate);
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}
