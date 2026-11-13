import { CircleCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import { Modal } from '../../components/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Field, Input } from '../../components/ui/form.tsx';
import { ApiError } from '../../api/client.ts';
import type { NewPlayer, Player } from '../../api/types.ts';

interface AddParticipantModalProps {
  open: boolean;
  onClose: () => void;
  players: Player[];
  /** Nr. the server assigns if none is given. */
  nextBib: number;
  /** Places still free in the tournament. */
  remaining: number;
  /** Registers on the server; rejects with ApiError (e.g. Nr. taken, no places left). */
  onAdd: (entry: NewPlayer) => Promise<Player>;
}

const EMPTY = { name: '', delegation: '', bib: '', ranking: '', email: '', phone: '' };

/** Registers one individual player. Email and phone are only part of the mockup (not sent). */
export function AddParticipantModal({
  open,
  onClose,
  players,
  nextBib,
  remaining,
  onAdd,
}: AddParticipantModalProps) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<Player | null>(null);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const suggestedBib = nextBib;
  const full = remaining <= 0;

  const set = (field: keyof typeof EMPTY) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError(null);
  };

  const submit = async (another: boolean) => {
    const name = form.name.trim();
    if (name === '') {
      setError('Escribe el nombre del jugador.');
      return;
    }
    const bib = form.bib.trim() === '' ? undefined : Number(form.bib);
    if (bib !== undefined && (!Number.isInteger(bib) || bib < 1)) {
      setError('El Nr. debe ser un número entero mayor que 0.');
      return;
    }
    // Quick check before sending; the server checks it again (and decides).
    const owner = players.find((player) => player.bib === bib);
    if (owner) {
      setError(`El Nr. ${String(bib)} ya es de ${owner.name}.`);
      return;
    }
    setSaving(true);
    let added: Player;
    try {
      added = await onAdd({
        name,
        delegation: form.delegation.trim(),
        ranking: form.ranking.trim() === '' ? null : Number(form.ranking),
        ...(bib === undefined ? {} : { bib }),
      });
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'No se pudo inscribir.');
      return;
    } finally {
      setSaving(false);
    }
    if (another) {
      setForm(EMPTY);
      setLastAdded(added);
      nameRef.current?.focus();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Añadir jugador"
      description={
        full
          ? 'Individual masculino · no quedan cupos.'
          : `Individual masculino · ${remaining === 1 ? 'queda 1 cupo' : `quedan ${String(remaining)} cupos`}.`
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const { submitter } = event.nativeEvent;
          void submit(submitter?.getAttribute('value') === 'another');
        }}
        className="space-y-5"
        noValidate
      >
        {lastAdded && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg border border-secondary-500/30 bg-secondary-500/10 px-3 py-2 text-sm text-secondary-300"
          >
            <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
            {lastAdded.name} inscrito con el Nr. {lastAdded.bib}.
          </p>
        )}

        <Field id="participant-name" label="Nombre completo">
          <Input
            ref={nameRef}
            id="participant-name"
            name="name"
            type="text"
            autoComplete="off"
            placeholder="Carlos Silva"
            value={form.name}
            onChange={set('name')}
            disabled={full}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="participant-delegation" label="Delegación, liga o club (opcional)">
            <Input
              id="participant-delegation"
              name="delegation"
              type="text"
              placeholder="Club Universitario"
              value={form.delegation}
              onChange={set('delegation')}
              disabled={full}
            />
          </Field>
          <Field
            id="participant-bib"
            label="Número (Nr.)"
            hint={`Si lo dejas vacío se asigna el siguiente libre (${String(suggestedBib)}).`}
          >
            <Input
              id="participant-bib"
              name="bib"
              type="number"
              min={1}
              placeholder={String(suggestedBib)}
              aria-describedby="participant-bib-hint"
              value={form.bib}
              onChange={set('bib')}
              disabled={full}
            />
          </Field>
          <Field
            id="participant-ranking"
            label="Puntos de ranking (opcional)"
            hint="Define su lugar como cabeza de serie."
          >
            <Input
              id="participant-ranking"
              name="ranking"
              type="number"
              min={0}
              placeholder="1850"
              aria-describedby="participant-ranking-hint"
              value={form.ranking}
              onChange={set('ranking')}
              disabled={full}
            />
          </Field>
          <Field id="participant-email" label="Correo (opcional)">
            <Input
              id="participant-email"
              name="email"
              type="email"
              placeholder="jugador@correo.com"
              value={form.email}
              onChange={set('email')}
              disabled={full}
            />
          </Field>
          <Field id="participant-phone" label="Teléfono (opcional)">
            <Input
              id="participant-phone"
              name="phone"
              type="tel"
              placeholder="+57 300 000 0000"
              value={form.phone}
              onChange={set('phone')}
              disabled={full}
            />
          </Field>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="outlined"
            type="submit"
            value="another"
            disabled={full || remaining === 1 || saving}
          >
            Añadir y crear otro
          </Button>
          <Button type="submit" value="close" disabled={full || saving}>
            Añadir jugador
          </Button>
        </div>
      </form>
    </Modal>
  );
}
