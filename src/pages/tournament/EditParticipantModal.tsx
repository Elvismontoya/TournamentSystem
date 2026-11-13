import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { ApiError } from '../../api/client.ts';
import type { Player, PlayerUpdate } from '../../api/types.ts';
import { Modal } from '../../components/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Field, Input } from '../../components/ui/form.tsx';

interface EditParticipantModalProps {
  player: Player;
  /** Every registered player, to warn about a Nr. already taken before sending. */
  players: Player[];
  onClose: () => void;
  /** Saves on the server; rejects with ApiError (e.g. Nr. taken). */
  onSave: (playerId: string, entry: PlayerUpdate) => Promise<void>;
}

/** Edits a registered player's name, delegation, Nr. and ranking. */
export function EditParticipantModal({
  player,
  players,
  onClose,
  onSave,
}: EditParticipantModalProps) {
  const [form, setForm] = useState({
    name: player.name,
    delegation: player.delegation,
    bib: String(player.bib),
    ranking: player.ranking === null ? '' : String(player.ranking),
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError(null);
  };

  const submit = async () => {
    const name = form.name.trim();
    if (name === '') {
      setError('Escribe el nombre del jugador.');
      return;
    }
    const bib = Number(form.bib);
    if (form.bib.trim() === '' || !Number.isInteger(bib) || bib < 1) {
      setError('El Nr. debe ser un número entero mayor que 0.');
      return;
    }
    const ranking = form.ranking.trim() === '' ? null : Number(form.ranking);
    if (ranking !== null && (!Number.isInteger(ranking) || ranking < 0)) {
      setError('El ranking debe ser un número entero (0 o más).');
      return;
    }
    // Quick check before sending; the server checks it again (and decides).
    const owner = players.find((candidate) => candidate.bib === bib && candidate.id !== player.id);
    if (owner) {
      setError(`El Nr. ${String(bib)} ya es de ${owner.name}.`);
      return;
    }
    setSaving(true);
    try {
      await onSave(player.id, { name, delegation: form.delegation.trim(), bib, ranking });
      onClose();
    } catch (failure) {
      setError(
        failure instanceof ApiError ? failure.message : 'No se pudieron guardar los cambios.',
      );
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Editar jugador"
      description="Los cambios se ven en los grupos, partidos y llaves; los resultados no cambian."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="space-y-5"
        noValidate
      >
        <Field id="edit-participant-name" label="Nombre completo">
          <Input
            id="edit-participant-name"
            type="text"
            autoComplete="off"
            value={form.name}
            onChange={set('name')}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="edit-participant-delegation" label="Delegación, liga o club (opcional)">
            <Input
              id="edit-participant-delegation"
              type="text"
              value={form.delegation}
              onChange={set('delegation')}
            />
          </Field>
          <Field id="edit-participant-bib" label="Número (Nr.)">
            <Input
              id="edit-participant-bib"
              type="number"
              min={1}
              value={form.bib}
              onChange={set('bib')}
            />
          </Field>
          <Field
            id="edit-participant-ranking"
            label="Puntos de ranking (opcional)"
            hint="Cambia su lugar en la lista y como cabeza de serie en el próximo sorteo."
          >
            <Input
              id="edit-participant-ranking"
              type="number"
              min={0}
              aria-describedby="edit-participant-ranking-hint"
              value={form.ranking}
              onChange={set('ranking')}
            />
          </Field>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}
