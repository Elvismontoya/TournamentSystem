import { LoaderCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ApiError } from '../../api/client.ts';
import { Modal } from '../../components/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';

interface RemoveAllParticipantsModalProps {
  registered: number;
  /** Groups are drawn: the draw (and the bracket) is removed too. */
  drawn: boolean;
  /** Results entered: nobody can be removed in bulk. */
  hasResults: boolean;
  onClose: () => void;
  /** Removes on the server; rejects with ApiError. */
  onRemoveAll: () => Promise<void>;
}

/** Confirms removing every registered player (e.g. to import a corrected list). */
export function RemoveAllParticipantsModal({
  registered,
  drawn,
  hasResults,
  onClose,
  onRemoveAll,
}: RemoveAllParticipantsModalProps) {
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setRemoving(true);
    setError(null);
    try {
      await onRemoveAll();
      onClose();
    } catch (failure) {
      setError(
        failure instanceof ApiError ? failure.message : 'No se pudo eliminar a los jugadores.',
      );
      setRemoving(false);
    }
  };

  if (hasResults) {
    return (
      <Modal
        open
        onClose={onClose}
        title="No se puede eliminar a todos"
        description="Ya hay resultados cargados: eliminar a los jugadores borraría partidos jugados."
      >
        <div className="flex justify-end">
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
      title="¿Eliminar a todos los jugadores?"
      description={`Se eliminan los ${String(registered)} inscritos${
        drawn ? ', el sorteo de grupos y las llaves' : ''
      }. No se puede deshacer.`}
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
          Eliminar a todos
        </button>
      </div>
    </Modal>
  );
}
