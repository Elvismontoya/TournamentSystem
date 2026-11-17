import { LoaderCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ApiError } from '../../api/client.ts';
import { Modal } from '../../components/Modal.tsx';
import { useToast } from '../../components/toast/toastContext.ts';
import { Button } from '../../components/ui/Button.tsx';

interface RemoveAllParticipantsModalProps {
  /** Players of every category. */
  registered: number;
  /** How many categories the tournament has. */
  categories: number;
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
  categories,
  drawn,
  hasResults,
  onClose,
  onRemoveAll,
}: RemoveAllParticipantsModalProps) {
  const toast = useToast();
  const [removing, setRemoving] = useState(false);

  const confirm = async () => {
    setRemoving(true);
    try {
      await onRemoveAll();
      toast.success(
        'Jugadores eliminados',
        `Se eliminaron los ${String(registered)} inscritos${drawn ? ' y los sorteos' : ''}.`,
      );
      onClose();
    } catch (failure) {
      toast.error(
        'No se pudo eliminar a los jugadores',
        failure instanceof ApiError ? failure.message : 'Ocurrió un error inesperado.',
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
        categories > 1 ? ' de todas las categorías' : ''
      }${drawn ? ', los sorteos de grupos y las llaves' : ''}. No se puede deshacer.`}
    >
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
