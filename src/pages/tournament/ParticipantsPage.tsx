import { Info, Link2, Pencil, Search, Trash2, Upload, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Button } from '../../components/ui/Button.tsx';
import { SectionHeader } from '../../components/ui/SectionHeader.tsx';
import { PlayerBib } from '../../features/groupStage/PlayerBadges.tsx';
import type { Tournament } from '../../features/tournament/useTournament.ts';
import { AddParticipantModal } from './AddParticipantModal.tsx';
import { ImportParticipantsModal } from './ImportParticipantsModal.tsx';

// Registered players, from the API (ordered by ranking).
// Being registered means the player plays: there is no confirmation status.

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

type OpenModal = 'add' | 'import' | null;

export function ParticipantsPage() {
  const { view, addPlayer, previewImport, importPlayers } = useOutletContext<Tournament>();
  const { players, seedIds, settings, groupStage, nextBib } = view;
  const CAPACITY = settings.capacity;
  // The top players by ranking head one group each (decided by the server).
  const SEEDS = seedIds.length;
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const closeModal = () => {
    setOpenModal(null);
  };

  const registered = players.length;
  const remaining = CAPACITY - registered;
  const full = remaining <= 0;
  // Registered after the group draw: they wait in "Sin grupo" until placed.
  const withoutGroup = groupStage?.withoutGroup ?? [];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Participantes"
        text={`${String(registered)} de ${String(CAPACITY)} jugadores inscritos.`}
      >
        <Button
          variant="outlined"
          disabled={full}
          title={full ? 'No quedan cupos' : undefined}
          onClick={() => {
            setOpenModal('import');
          }}
        >
          <Upload className="size-4" aria-hidden="true" />
          Importar lista
        </Button>
        <Button
          disabled={full}
          title={full ? 'No quedan cupos' : undefined}
          onClick={() => {
            setOpenModal('add');
          }}
        >
          <UserPlus className="size-4" aria-hidden="true" />
          Añadir jugador
        </Button>
      </SectionHeader>

      {/* Capacity + registration link */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col justify-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-300">Cupos ocupados</span>
            <span className="font-display font-medium text-white tabular-nums">
              {registered} / {CAPACITY}
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-neutral-800"
            role="progressbar"
            aria-label="Cupos ocupados"
            aria-valuenow={registered}
            aria-valuemin={0}
            aria-valuemax={CAPACITY}
          >
            <div
              className="h-full rounded-full bg-primary-500 transition-[width]"
              style={{ width: `${String(Math.min(100, (registered / CAPACITY) * 100))}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-4">
          <Link2 className="size-5 shrink-0 text-secondary-400" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm text-neutral-300">Inscripción abierta</p>
            <p className="truncate font-mono text-xs text-neutral-500">
              torneos.app/i/open-nacional-2026
            </p>
          </div>
          <Button variant="secondary" className="ml-auto h-8 px-3 text-xs">
            Copiar
          </Button>
        </div>
      </div>

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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-400">Ordenados por ranking</p>

        <label className="relative block w-full sm:w-72">
          <span className="sr-only">Buscar jugador</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Buscar por nombre o delegación"
            className="h-10 w-full rounded-lg border border-neutral-800 bg-neutral-900 pr-3 pl-9 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none"
          />
        </label>
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
                Delegación
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
            {players.map((player, index) => {
              const seed = seedIds.indexOf(player.id) + 1;
              const isSeed = seed > 0;
              return (
                <tr key={player.id} className="transition-colors hover:bg-neutral-850">
                  <td className="py-3 pr-1 pl-4 sm:px-5">
                    {isSeed ? (
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
                  <td className="px-2 py-3 text-right font-display text-neutral-100 tabular-nums sm:px-3">
                    {player.ranking ?? <span className="text-neutral-600">—</span>}
                  </td>
                  <td className="py-3 pr-4 sm:px-5">
                    <div className="flex justify-end gap-0.5 sm:gap-1">
                      <button
                        type="button"
                        aria-label={`Editar a ${player.name}`}
                        className={iconButtonClass}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Eliminar a ${player.name}`}
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
          players={players}
          nextBib={nextBib}
          remaining={remaining}
          onAdd={addPlayer}
        />
      )}
      {openModal === 'import' && (
        <ImportParticipantsModal
          open
          onClose={closeModal}
          remaining={remaining}
          onPreview={previewImport}
          onImport={importPlayers}
        />
      )}
    </div>
  );
}
