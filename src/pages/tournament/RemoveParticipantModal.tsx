import { LoaderCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client.ts';
import type { Player } from '../../api/types.ts';
import { Modal } from '../../components/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';

interface RemoveParticipantModalProps {
  player: Player;
  /** Name of the group the player is in ("3"), or null if in none. */
  groupName: string | null;
  onClose: () => void;
  /** Removes on the server; rejects with ApiError. */
  onRemove: (playerId: string) => Promise<void>;
}

/**
 * Confirms removing a player. Someone in a group can't be removed (their group's matches
 * would change): the modal explains how to take them out first.
 */
export function RemoveParticipantModal({
  player,
  groupName,
  onClose,
  onRemove,
}: RemoveParticipantModalProps) {
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setRemoving(true);
    setError(null);
    try {
      await onRemove(player.id);
      onClose();
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'No se pudo eliminar al jugador.');
      setRemoving(false);
    }
  };

  if (groupName !== null) {
    return (
      <Modal
        open
        onClose={onClose}
        title="No se puede eliminar todavía"
        description={`${player.name} está en el Grupo ${groupName}.`}
      >
        <p className="text-sm text-neutral-300">
          Eliminarlo cambiaría los partidos de su grupo. Primero sácalo del grupo en{' '}
          <Link to="../grupos" relative="path" className="font-medium text-primary-300 underline">
            Grupos
          </Link>{' '}
          (con «Editar», poniendo a otro jugador en su lugar) o vuelve a sortear los grupos. Después
          podrás eliminarlo desde aquí.
        </p>
        <div className="mt-5 flex justify-end">
          <Button variant="outlined" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={() => {
        if (!removing) onClose();
      }}
      title="¿Eliminar jugador?"
      description={`${player.name} (Nr. ${String(player.bib)}) dejará de estar inscrito y se libera su cupo.`}
    >
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outlined" disabled={removing} onClick={onClose}>
          Cancelar
        </Button>
        <button
          type="button"
          disabled={removing}
          onClick={() => {
            void confirm();
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-display text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {removing ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-4" aria-hidden="true" />
          )}
          Eliminar
        </button>
      </div>
    </Modal>
  );
}
