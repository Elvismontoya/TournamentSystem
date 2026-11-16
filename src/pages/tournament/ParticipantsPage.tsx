import { Info, Pencil, Search, Trash2, Upload, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { Player } from '../../api/types.ts';
import { Button } from '../../components/ui/Button.tsx';
import { SectionHeader } from '../../components/ui/SectionHeader.tsx';
import { matchesPlayer } from '../../features/groupStage/display.ts';
import { PlayerBib } from '../../features/groupStage/PlayerBadges.tsx';
import type { Tournament } from '../../features/tournament/useTournament.ts';
import { AddParticipantModal } from './AddParticipantModal.tsx';
import { EditParticipantModal } from './EditParticipantModal.tsx';
import { ImportParticipantsModal } from './ImportParticipantsModal.tsx';
import { RemoveAllParticipantsModal } from './RemoveAllParticipantsModal.tsx';
import { RemoveParticipantModal } from './RemoveParticipantModal.tsx';

// Registered players of the individual event (the only one for now), from the API, ordered
// by ranking. Being registered means the player plays: there is no confirmation status.

const AVATAR_TONES = [
  'bg-primary-500/20 text-primary-200',
  'bg-secondary-500/20 text-secondary-300',
  'bg-tertiary-500/20 text-tertiary-300',
  'bg-sky-500/20 text-sky-300',
];

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('');
}

const iconButtonClass =
  'grid size-8 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white';

type OpenModal =
  | 'add'
  | 'import'
  | 'removeAll'
  | { kind: 'edit'; player: Player }
  | { kind: 'remove'; player: Player }
  | null;

export function ParticipantsPage() {
  const {
    view,
    addPlayer,
    updatePlayer,
    removePlayer,
    removeAllPlayers,
    previewImport,
    importPlayers,
  } = useOutletContext<Tournament>();
  const { players, seedIds, groupStage, knockout, settings, category } = view;
  // The top players by ranking head one group each (decided by the server).
  const SEEDS = seedIds.length;
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [query, setQuery] = useState('');
  const closeModal = () => {
    setOpenModal(null);
  };

  /** Name of the group a player is in, or null (not drawn yet, or "sin grupo"). */
  const groupNameOf = (player: Player) =>
    groupStage?.groups.find((group) => group.players.some((member) => member.id === player.id))
      ?.name ?? null;

  const visiblePlayers = players.filter((player) => matchesPlayer(player, query));

  const registered = players.length;
  // Registered after the group draw: they wait in "Sin grupo" until placed.
  const withoutGroup = groupStage?.withoutGroup ?? [];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Participantes"
        text={`${category} · individual · ${String(registered)} ${registered === 1 ? 'jugador inscrito' : 'jugadores inscritos'}.`}
      >
        <button
          type="button"
          disabled={view.allPlayers.length === 0}
          onClick={() => {
            setOpenModal('removeAll');
          }}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-500/40 px-4 font-display text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Eliminar todos
        </button>
        <Button
          variant="outlined"
          onClick={() => {
            setOpenModal('import');
          }}
        >
          <Upload className="size-4" aria-hidden="true" />
          Importar lista
        </Button>
        <Button
          onClick={() => {
            setOpenModal('add');
          }}
        >
          <UserPlus className="size-4" aria-hidden="true" />
          Añadir jugador
        </Button>
      </SectionHeader>

      {withoutGroup.length > 0 && (
        <p className="flex items-start gap-2 rounded-xl border border-tertiary-500/40 bg-tertiary-500/10 px-4 py-3 text-sm text-tertiary-200">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Los grupos ya están sorteados:{' '}
            {withoutGroup.length === 1
              ? '1 jugador está sin grupo'
              : `${String(withoutGroup.length)} jugadores están sin grupo`}
            . En{' '}
            <Link to="../grupos" relative="path" className="font-medium underline">
              Grupos
            </Link>{' '}
            puedes ubicarlos con «Editar» (escribiendo su Nr.) o volver a sortear.
          </span>
        </p>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-400">Ordenados por ranking</p>
        <div className="flex w-full flex-wrap gap-3 sm:w-auto">
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Buscar jugador</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Buscar por nombre o liga"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              className="h-10 w-full rounded-lg border border-neutral-800 bg-neutral-900 pr-3 pl-9 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {/* Players table */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900">
        <table className="w-full text-sm">
          <caption className="sr-only">Jugadores inscritos, ordenados por ranking</caption>
          <thead>
            <tr className="border-b border-neutral-800 text-left font-display text-xs tracking-wider text-neutral-500 uppercase">
              <th scope="col" className="w-12 py-3 pr-1 pl-4 font-medium sm:w-20 sm:px-5">
                <span className="hidden sm:inline">Siembra</span>
                <span className="sm:hidden">#</span>
              </th>
              <th scope="col" className="w-14 px-2 py-3 font-medium">
                <abbr title="Número del jugador" className="no-underline">
                  Nr.
                </abbr>
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Jugador
              </th>
              <th scope="col" className="hidden px-3 py-3 font-medium md:table-cell">
                Liga
              </th>
              <th scope="col" className="hidden px-3 py-3 font-medium sm:table-cell">
                <abbr title="Género" className="no-underline">
                  Gén.
                </abbr>
              </th>
              <th scope="col" className="px-3 py-3 text-right font-medium">
                Ranking
              </th>
              <th scope="col" className="py-3 pr-4 sm:px-5">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {visiblePlayers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-neutral-400">
                  {players.length === 0
                    ? 'Todavía no hay jugadores inscritos.'
                    : 'Ningún jugador coincide con la búsqueda.'}
                </td>
              </tr>
            )}
            {visiblePlayers.map((player, index) => {
              const seed = seedIds.indexOf(player.id) + 1;
              return (
                <tr key={player.id} className="transition-colors hover:bg-neutral-850">
                  <td className="py-3 pr-1 pl-4 sm:px-5">
                    {seed > 0 ? (
                      <span className="inline-grid size-7 place-items-center rounded-md bg-tertiary-500/15 font-display text-xs font-bold text-tertiary-300">
                        {seed}
                      </span>
                    ) : (
                      <span className="pl-2 text-neutral-600">—</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <PlayerBib value={player.bib} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-full font-display text-xs font-semibold ${
                          AVATAR_TONES[index % AVATAR_TONES.length] ?? ''
                        }`}
                        aria-hidden="true"
                      >
                        {initials(player.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{player.name}</p>
                        <p className="truncate text-xs text-neutral-500 md:hidden">
                          {player.delegation}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 text-neutral-300 md:table-cell">
                    {player.delegation}
                  </td>
                  <td className="hidden px-3 py-3 text-neutral-300 sm:table-cell">
                    {player.gender ?? <span className="text-neutral-600">—</span>}
                  </td>
                  <td className="px-2 py-3 text-right font-display text-neutral-100 tabular-nums sm:px-3">
                    {player.ranking ?? <span className="text-neutral-600">—</span>}
                  </td>
                  <td className="py-3 pr-4 sm:px-5">
                    <div className="flex justify-end gap-0.5 sm:gap-1">
                      <button
                        type="button"
                        aria-label={`Editar a ${player.name}`}
                        title="Editar"
                        onClick={() => {
                          setOpenModal({ kind: 'edit', player });
                        }}
                        className={iconButtonClass}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Eliminar a ${player.name}`}
                        title="Eliminar"
                        onClick={() => {
                          setOpenModal({ kind: 'remove', player });
                        }}
                        className={`${iconButtonClass} hover:bg-red-500/10 hover:text-red-300`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="flex items-start gap-2 text-sm text-neutral-400">
        <Info className="mt-0.5 size-4 shrink-0 text-primary-300" aria-hidden="true" />
        Las cabezas de serie se asignan por ranking: los {SEEDS} mejores encabezan un grupo cada uno
        y el resto se reparte al azar en el sorteo.
      </p>

      {/* Mounted only while open, so each time starts with an empty form. */}
      {openModal === 'add' && (
        <AddParticipantModal
          open
          onClose={closeModal}
          categories={settings.categories}
          defaultCategory={category}
          onAdd={addPlayer}
        />
      )}
      {typeof openModal === 'object' && openModal?.kind === 'edit' && (
        <EditParticipantModal
          player={openModal.player}
          players={view.allPlayers}
          categories={settings.categories}
          onClose={closeModal}
          onSave={updatePlayer}
        />
      )}
      {typeof openModal === 'object' && openModal?.kind === 'remove' && (
        <RemoveParticipantModal
          player={openModal.player}
          groupName={groupNameOf(openModal.player)}
          onClose={closeModal}
          onRemove={removePlayer}
        />
      )}
      {openModal === 'import' && (
        <ImportParticipantsModal
          open
          onClose={closeModal}
          categories={settings.categories}
          onPreview={previewImport}
          onImport={importPlayers}
        />
      )}
      {openModal === 'removeAll' && (
        <RemoveAllParticipantsModal
          registered={view.allPlayers.length}
          categories={settings.categories.length}
          drawn={groupStage !== null}
          hasResults={Boolean(groupStage?.hasResults) || Boolean(knockout?.hasResults)}
          onClose={closeModal}
          onRemoveAll={removeAllPlayers}
        />
      )}
    </div>
  );
}
