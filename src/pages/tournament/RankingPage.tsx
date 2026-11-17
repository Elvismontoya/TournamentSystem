import { Medal } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { ButtonLink } from '../../components/ui/ButtonLink.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { SectionHeader } from '../../components/ui/SectionHeader.tsx';
import { FinalRanking } from '../../features/knockout/FinalRanking.tsx';
import type { Tournament } from '../../features/tournament/useTournament.ts';

// Final ranking of the competition, computed by the server once it is over: the knockout,
// or the table of a single group (no knockout then).

/** What is still missing before the ranking can be shown. */
function missingText({ view }: Tournament): string {
  const { groupStage, knockout, singleGroup } = view;
  if (!groupStage) return 'Primero hay que sortear y jugar la fase de grupos.';
  if (singleGroup) {
    return `Es un grupo único: su tabla es el resultado final. Se completa al jugar todos sus partidos (${String(groupStage.played)} de ${String(groupStage.total)}).`;
  }
  if (!knockout) return 'Cuando terminen los grupos, sortea las llaves y juégalas.';
  if (knockout.champion) {
    return 'Ya hay campeón: falta el partido por el 3.er puesto para cerrar la clasificación.';
  }
  return `Se completa al terminar las llaves (${String(knockout.played)} de ${String(knockout.playable)} partidos jugados).`;
}

export function RankingPage() {
  const tournament = useOutletContext<Tournament>();
  const { ranking, settings, singleGroup } = tournament.view;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Clasificación final"
        text={
          singleGroup
            ? 'Grupo único: los puestos son los de la tabla del grupo (no hay llaves).'
            : settings.thirdPlaceMatch
              ? 'Puestos de todos los jugadores. El 3.º y el 4.º salen del partido por el 3.er puesto.'
              : 'Puestos de todos los jugadores. Sin partido por el 3.er puesto, los perdedores de semifinal comparten el 3.º.'
        }
      />
      {ranking ? (
        <>
          <FinalRanking ranking={ranking} />
          {!singleGroup && (
            <p className="text-sm text-neutral-400">
              Los que pierden en la misma ronda comparten puesto (por ejemplo, todos los de cuartos
              quedan 5.º). Los eliminados en grupos van después, según su puesto en el grupo.
            </p>
          )}
        </>
      ) : (
        <EmptyState icon={Medal} title="El torneo aún no termina" text={missingText(tournament)}>
          <ButtonLink to="../llaves" relative="path" variant="soft">
            Ir a las llaves
          </ButtonLink>
        </EmptyState>
      )}
    </div>
  );
}
