// Print pages: where they live and how knockout matches are numbered on paper.

import type { Entrant, KnockoutMatchView, KnockoutView } from '../../api/types.ts';

/** URL of a print page of a tournament's competition. */
export function printUrl(slug: string, competition: string, path: string): string {
  return `/torneos/${encodeURIComponent(slug)}/imprimir/${path}?competencia=${encodeURIComponent(competition)}`;
}

const FRAME_ID = 'print-frame';

/**
 * Prints a print page without leaving the current one (no new tab): it loads in a hidden
 * frame, which opens the browser's print dialog by itself once its data is in (see
 * PrintLayout). The frame is removed after printing (or replaced by the next one).
 */
export function printInPage(url: string): void {
  document.getElementById(FRAME_ID)?.remove();
  const frame = document.createElement('iframe');
  frame.id = FRAME_ID;
  frame.title = 'Impresión';
  frame.setAttribute('aria-hidden', 'true');
  // Off-screen but with a page width, so the sheet lays out as on paper.
  Object.assign(frame.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: '1024px',
    height: '800px',
    border: '0',
  });
  frame.addEventListener('load', () => {
    frame.contentWindow?.addEventListener('afterprint', () => {
      // Removed a moment later: some browsers still use it right after the dialog closes.
      setTimeout(() => {
        frame.remove();
      }, 1000);
    });
  });
  frame.src = url;
  document.body.append(frame);
}

/**
 * Number of a knockout match on the printed bracket: the whole first round first
 * (1, 2, 3…), then the next round… as in the federation's spreadsheets. The match for 3rd
 * place goes last.
 */
export function matchNumber(knockout: KnockoutView, round: number, index: number): number {
  const before = knockout.rounds.slice(0, round).reduce((sum, matches) => sum + matches.length, 0);
  if (round === knockout.rounds.length - 1 && index === 1) {
    return knockout.rounds.reduce((sum, matches) => sum + matches.length, 0) + 1;
  }
  return before + index + 1;
}

/**
 * Where one side of a match comes from while it isn't known: "1.º G3" in the first round,
 * "Ganador P5" later, "Perdedor P29" in the match for 3rd place.
 */
export function entrantSource(
  knockout: KnockoutView,
  round: number,
  index: number,
  side: 0 | 1,
): string {
  const last = knockout.rounds.length - 1;
  if (round === last && index === 1) {
    return `Perdedor P${String(matchNumber(knockout, last - 1, side))}`;
  }
  if (round === 0) {
    const slot = knockout.slots.at(index * 2 + side);
    if (!slot || slot.kind === 'bye') return 'Bye';
    return `${String(slot.place)}.º G${String(slot.groupIndex + 1)}`;
  }
  return `Ganador P${String(matchNumber(knockout, round - 1, index * 2 + side))}`;
}

/** A knockout match with its match ID, as listed for printing by number. */
export interface NumberedMatch {
  id: number;
  match: KnockoutMatchView;
  /** "Cuartos de final · 2" or "Tercer puesto". */
  label: string;
  /** Print page inside /imprimir. */
  path: string;
}

/** Every knockout match that is played (no byes), with its match ID, in ID order. */
export function numberedMatches(knockout: KnockoutView): NumberedMatch[] {
  const third = knockout.thirdPlace;
  const all = [...knockout.rounds.flat(), ...(third ? [third] : [])];
  return all
    .filter((match) => match.entrants.every((entrant) => entrant.kind !== 'bye'))
    .map((match) => ({
      id: matchNumber(knockout, match.round, match.index),
      match,
      label: match === third ? match.roundName : `${match.roundName} · ${String(match.index + 1)}`,
      path: `partido/${String(match.round)}/${String(match.index)}`,
    }))
    .sort((a, b) => a.id - b.id);
}

/** "12 · Juan Pérez" for a known player; for the others, where they come from. */
export function entrantText(entrant: Entrant, from: string): string {
  if (entrant.kind === 'player') return `${String(entrant.player.bib)} · ${entrant.player.name}`;
  if (entrant.kind === 'bye') return 'Bye';
  return from;
}
