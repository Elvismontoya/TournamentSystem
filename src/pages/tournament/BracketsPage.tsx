import { Info, Network, Pencil, Shuffle, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { BracketSlot, Player } from '../../api/types.ts';
import { Button } from '../../components/ui/Button.tsx';
import { ButtonLink } from '../../components/ui/ButtonLink.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { SectionHeader } from '../../components/ui/SectionHeader.tsx';
import { roundName } from '../../features/groupStage/display.ts';
import { PlayerBib } from '../../features/groupStage/PlayerBadges.tsx';
import type { Tournament } from '../../features/tournament/useTournament.ts';
import { BracketView, HalfArrow, type SlotInfo } from '../../features/knockout/BracketView.tsx';
import {
  ManualBracketEditor,
  type BibResolution,
} from '../../features/knockout/ManualBracketEditor.tsx';

const RULES = [
  'Los primeros de grupo son cabezas de serie: 1.º G1 arriba del todo, 1.º G2 abajo del todo, 1.º G3 y G4 al centro, y así sucesivamente.',
  'Los segundos se sortean en la mitad opuesta a su primero: si el 1.º del grupo va arriba, su 2.º va abajo. Solo pueden cruzarse en la final.',
  'Si los clasificados no llenan el cuadro, los mejores primeros pasan directo (bye).',
];

function QualifierList({
  title,
  place,
  qualifiers,
  positionOf,
  size,
}: {
  title: string;
  place: 1 | 2;
  /** Bracket size, to tell whether a position goes top or bottom. */
  size: number;
  /** Per group: 1st, 2nd… once decided (null while pending), as computed by the server. */
  qualifiers: (Player | null)[][];
  positionOf: (place: 1 | 2, groupIndex: number) => number | null;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <h3 className="border-b border-neutral-800 px-5 py-3 font-semibold">{title}</h3>
      <ul className="divide-y divide-neutral-800/60">
        {qualifiers.map((places, groupIndex) => {
          const player = places[place - 1] ?? null;
          const position = positionOf(place, groupIndex);
          return (
            <li key={groupIndex} className="flex items-center gap-3 px-5 py-2.5 text-sm">
              <span
                className={`w-14 shrink-0 rounded px-1.5 py-0.5 text-center font-display text-[11px] font-bold ${
                  place === 1
                    ? 'bg-primary-500/20 text-primary-200'
                    : 'bg-neutral-700 text-neutral-200'
                }`}
              >
                {place}.º G{groupIndex + 1}
              </span>
              {player ? (
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <PlayerBib value={player.bib} />
                  <span className="truncate text-neutral-100">{player.name}</span>
                </span>
              ) : (
                <span className="flex-1 text-xs text-neutral-500 italic">Pendiente</span>
              )}
              <span className="flex shrink-0 items-center gap-1 text-xs text-neutral-500 tabular-nums">
                {position === null ? (
                  '—'
                ) : (
                  <>
                    <HalfArrow position={position} size={size} />
                    Pos. {position}
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function BracketsPage() {
  const { view, drawKnockout, moveKnockoutSlot } = useOutletContext<Tournament>();
  const { players, knockout, settings } = view;
  const groups = view.groupStage?.groups;
  const [editing, setEditing] = useState(false);

  // Manual bracket: start from a seeded draw and adjust positions by hand.
  const buildManually = () => {
    if (!knockout) drawKnockout();
    setEditing(true);
  };

  if (!groups) {
    return (
      <div className="flex flex-col gap-6">
        <SectionHeader title="Llaves" text="Cuadro principal de eliminación directa." />
        <EmptyState
          icon={Network}
          title="Primero sortea los grupos"
          text="Las llaves se arman con los 2 primeros de cada grupo."
        >
          <ButtonLink to="../grupos" relative="path" variant="soft">
            Ir a grupos
          </ButtonLink>
        </EmptyState>
      </div>
    );
  }

  const qualifiers = groups.map((group) => group.qualifiers);
  const size = knockout?.size ?? view.groupStage?.knockoutSize ?? 2;

  const describe = (slot: BracketSlot): SlotInfo => {
    if (slot.kind === 'bye') return { label: 'Bye', place: null, player: null };
    const player = qualifiers[slot.groupIndex]?.[slot.place - 1] ?? null;
    return {
      label: `${String(slot.place)}.º G${String(slot.groupIndex + 1)}`,
      place: slot.place,
      player: player ? { name: player.name, delegation: player.delegation, bib: player.bib } : null,
    };
  };

  // Manual bracket by Nr.: find which qualifier slot (1.º/2.º of a group) the player holds.
  const resolveBib = (bib: number): BibResolution => {
    const player = players.find((candidate) => candidate.bib === bib);
    if (!player) return { error: `No hay ningún jugador con el Nr. ${String(bib)}.` };
    const groupIndex = groups.findIndex((group) =>
      group.players.some((candidate) => candidate.id === player.id),
    );
    if (groupIndex === -1) return { error: `${player.name} no está en ningún grupo.` };
    const group = groups[groupIndex];
    const groupName = `Grupo ${group.name}`;
    const place = group.qualifiers.findIndex((qualifier) => qualifier?.id === player.id);
    if (place === 0 || place === 1) {
      return { slot: { kind: 'qualifier', place: place === 0 ? 1 : 2, groupIndex } };
    }
    if (!group.complete) {
      return {
        error: `El ${groupName} aún no termina: elige el puesto de ${player.name} en la lista.`,
      };
    }
    if (group.qualificationPending) {
      return {
        error: `El ${groupName} tiene un empate sin resolver: elige el puesto en la lista.`,
      };
    }
    return { error: `${player.name} no clasificó (${groupName}).` };
  };

  const positionOf = (place: 1 | 2, groupIndex: number): number | null => {
    if (!knockout) return null;
    const index = knockout.slots.findIndex(
      (slot) => slot.kind === 'qualifier' && slot.place === place && slot.groupIndex === groupIndex,
    );
    return index === -1 ? null : index + 1;
  };

  const decided = qualifiers.flat().filter((player) => player !== null).length;
  const total = groups.length * settings.qualifiersPerGroup;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Llaves"
        text={`Cuadro de ${String(size)} · ${roundName(size).toLowerCase()} · ${String(decided)} de ${String(total)} clasificados definidos.`}
      >
        {knockout && !editing && (
          <>
            <Button variant="outlined" onClick={buildManually}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar manualmente
            </Button>
            <Button variant="outlined" onClick={drawKnockout}>
              <Shuffle className="size-4" aria-hidden="true" />
              Volver a sortear llaves
            </Button>
          </>
        )}
        {!knockout && (
          <>
            <Button variant="outlined" onClick={buildManually}>
              <Pencil className="size-4" aria-hidden="true" />
              Armar manualmente
            </Button>
            <Button onClick={drawKnockout}>
              <Shuffle className="size-4" aria-hidden="true" />
              Sortear llaves
            </Button>
          </>
        )}
      </SectionHeader>

      {knockout && editing ? (
        <Card className="p-5">
          <ManualBracketEditor
            draw={knockout}
            groupCount={groups.length}
            describe={describe}
            resolveBib={resolveBib}
            onMove={moveKnockoutSlot}
            onDone={() => {
              setEditing(false);
            }}
          />
        </Card>
      ) : knockout ? (
        <>
          <Card className="p-5">
            <BracketView draw={knockout} describe={describe} />
          </Card>
          {knockout.warnings.length > 0 && (
            <ul className="flex flex-col gap-1 rounded-xl border border-tertiary-500/40 bg-tertiary-500/10 px-4 py-3 text-sm text-tertiary-200">
              {knockout.warnings.map((warning) => (
                <li key={warning} className="flex items-start gap-2">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {warning}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <Card className="flex flex-col gap-4">
          <h3 className="font-semibold">Cómo se sortean las llaves</h3>
          <ul className="flex flex-col gap-2 text-sm text-neutral-300">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-2">
                <Info className="mt-0.5 size-4 shrink-0 text-primary-300" aria-hidden="true" />
                {rule}
              </li>
            ))}
          </ul>
          <p className="text-sm text-neutral-400">
            Puedes sortear ahora: el cuadro se arma con los puestos (1.º G1, 2.º G3…) y los nombres
            aparecen solos cuando cada grupo termina. Si prefieres decidir tú cada posición, ármalo
            manualmente.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={drawKnockout}>
              <Shuffle className="size-4" aria-hidden="true" />
              Sortear llaves
            </Button>
            <Button variant="outlined" onClick={buildManually}>
              <Pencil className="size-4" aria-hidden="true" />
              Armar manualmente
            </Button>
          </div>
        </Card>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <QualifierList
          title="Primeros de grupo"
          place={1}
          qualifiers={qualifiers}
          positionOf={positionOf}
          size={size}
        />
        <QualifierList
          title="Segundos de grupo"
          place={2}
          qualifiers={qualifiers}
          positionOf={positionOf}
          size={size}
        />
      </div>
    </div>
  );
}
