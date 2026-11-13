import { Info, Shuffle } from 'lucide-react';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ButtonLink } from '../../components/ui/ButtonLink.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import type { GroupView, MatchView, Settings } from '../../api/types.ts';
import { SectionHeader } from '../../components/ui/SectionHeader.tsx';
import { groupNumberFromQuery, matchesPlayer } from '../../features/groupStage/display.ts';
import { GroupFilterBar, type GroupFilter } from '../../features/groupStage/GroupFilterBar.tsx';
import { GroupPosition } from '../../features/groupStage/PlayerBadges.tsx';
import { ScoreCard } from '../../features/matches/ScoreCard.tsx';
import { bestOfLabel, setRuleText, walkoverText } from '../../features/tournament/settingsText.ts';
import type { Tournament } from '../../features/tournament/useTournament.ts';

// Example schedule (fixed): every group plays on its own table, one match every 15 min.
const MATCH_DAY = '15 nov';
/** Example schedule: 11:00, then one match every 15 minutes on the group's table. */
function matchTime(matchIndex: number): string {
  const minutes = 11 * 60 + matchIndex * 15;
  return `${String(Math.floor(minutes / 60))}:${String(minutes % 60).padStart(2, '0')}`;
}

const KNOCKOUT_STARTED =
  'Las llaves ya tienen resultados: los partidos de grupo no se pueden cambiar.';

interface MatchCardProps {
  group: GroupView;
  groupIndex: number;
  match: MatchView;
  settings: Settings;
  locked: boolean;
  onChange: Tournament['updateSet'];
  onWalkover: Tournament['setWalkover'];
}

function MatchCard({
  group,
  groupIndex,
  match,
  settings,
  locked,
  onChange,
  onWalkover,
}: MatchCardProps) {
  const { index: matchIndex } = match;
  const [first, second] = match.players;
  return (
    <ScoreCard
      header={
        <>
          <span className="rounded-md bg-primary-500/15 px-2 py-0.5 font-display text-sm font-bold text-primary-300">
            {first + 1}-{second + 1}
          </span>
          <span className="text-xs text-neutral-400">
            {MATCH_DAY} · {matchTime(matchIndex)} · Mesa {groupIndex + 1}
          </span>
        </>
      }
      caption={`Partido ${String(first + 1)}-${String(second + 1)} del grupo ${group.name}`}
      sides={[
        { player: group.players[first], badge: <GroupPosition value={first + 1} /> },
        { player: group.players[second], badge: <GroupPosition value={second + 1} /> },
      ]}
      match={match}
      walkoverText={walkoverText(settings)}
      lockedReason={locked ? KNOCKOUT_STARTED : undefined}
      onSet={(setIndex, side, value) => {
        onChange(groupIndex, matchIndex, setIndex, side, value);
      }}
      onWalkover={(absent) => {
        onWalkover(groupIndex, matchIndex, absent);
      }}
    />
  );
}

export function MatchesPage() {
  const { view, updateSet, setWalkover } = useOutletContext<Tournament>();
  const [filter, setFilter] = useState<GroupFilter>('all');
  const [query, setQuery] = useState('');
  const groups = view.groupStage?.groups;
  const locked = view.knockout?.hasResults ?? false;

  if (!groups) {
    return (
      <div className="flex flex-col gap-6">
        <SectionHeader title="Partidos" text="Carga los resultados de cada partido, set por set." />
        <EmptyState
          icon={Shuffle}
          title="Primero sortea los grupos"
          text="Los partidos de cada grupo se generan al hacer el sorteo, en el orden 1-3, 2-4, 1-2, 3-4, 1-4, 2-3."
        >
          <ButtonLink to="../grupos" relative="path" variant="soft">
            Ir a grupos
          </ButtonLink>
        </EmptyState>
      </div>
    );
  }

  // Groups allowed by the buttons and the search. A group number search shows all of that
  // group's matches; a name search shows only the matches of the searched player.
  const groupNumber = groupNumberFromQuery(query);
  const visibleGroups = groups
    .map((group, groupIndex) => ({
      group,
      groupIndex,
      matches: group.matches.filter(({ players: [first, second] }) =>
        groupNumber !== null
          ? group.name === groupNumber
          : [group.players[first], group.players[second]].some((player) =>
              matchesPlayer(player, query),
            ),
      ),
    }))
    .filter(
      ({ groupIndex, matches }) =>
        (filter === 'all' || filter === groupIndex) && matches.length > 0,
    );

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Partidos"
        text="Fase de grupos · escribe los puntos de cada set; el ganador, la tabla y las posiciones se calculan solos."
      >
        <ButtonLink to="../grupos" relative="path" variant="outlined">
          Ver tablas de grupos
        </ButtonLink>
        <ButtonLink to="../llaves" relative="path" variant="outlined">
          Partidos de llaves
        </ButtonLink>
      </SectionHeader>

      {locked && (
        <p className="rounded-xl border border-tertiary-500/40 bg-tertiary-500/10 px-4 py-3 text-sm text-tertiary-200">
          {KNOCKOUT_STARTED} Los partidos de llaves se cargan en la sección Llaves.
        </p>
      )}

      <GroupFilterBar
        groups={groups}
        value={filter}
        onChange={setFilter}
        query={query}
        onQueryChange={setQuery}
      />

      {visibleGroups.length === 0 && (
        <p className="rounded-2xl border border-dashed border-neutral-700 px-5 py-8 text-center text-sm text-neutral-400">
          Ningún partido coincide con «{query}» en este filtro.
        </p>
      )}

      {/* One group after another (Grupo 1 with its matches, then Grupo 2…); matches in two columns. */}
      <div className="flex flex-col gap-8">
        {visibleGroups.map(({ group, groupIndex, matches }) => (
          <section
            key={group.name}
            aria-labelledby={`matches-group-${group.name}`}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 id={`matches-group-${group.name}`} className="text-lg font-semibold">
                Grupo {group.name}
              </h3>
              <span className="text-sm text-neutral-400 tabular-nums">
                {group.finished} de {group.total} partidos
              </span>
            </div>
            <ol className="grid gap-4 xl:grid-cols-2">
              {matches.map((match) => (
                <MatchCard
                  key={`${group.name}-${String(match.index)}`}
                  group={group}
                  groupIndex={groupIndex}
                  match={match}
                  settings={view.settings}
                  locked={locked}
                  onChange={updateSet}
                  onWalkover={setWalkover}
                />
              ))}
            </ol>
          </section>
        ))}
      </div>

      <p className="flex items-start gap-2 text-sm text-neutral-400">
        <Info className="mt-0.5 size-4 shrink-0 text-primary-300" aria-hidden="true" />
        {setRuleText(view.settings)} · {bestOfLabel(view.settings.setsPerMatch).toLowerCase()}: gana
        quien llega a {view.settings.setsToWin} {view.settings.setsToWin === 1 ? 'set' : 'sets'}. Un
        set inválido se marca en rojo.
      </p>
    </div>
  );
}
