import { CircleCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import { ApiError } from '../../api/client.ts';
import type { Gender, NewPlayer, Player } from '../../api/types.ts';
import { Modal } from '../../components/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Field, Input, Select } from '../../components/ui/form.tsx';
import { GENDERS } from '../../constants/catalog.ts';

interface AddParticipantModalProps {
  open: boolean;
  onClose: () => void;
  /** The tournament's categories (Configuración), to choose the player's. */
  categories: string[];
  /** Category chosen at first (the one shown in the dashboard). */
  defaultCategory: string;
  /** Gender chosen at first (from the division shown; null in a mixed one). */
  defaultGender: Gender | null;
  /** Registers on the server (the Nr. is assigned there); rejects with ApiError. */
  onAdd: (entry: NewPlayer) => Promise<Player>;
}

/** Registers one player by hand, in the individual event (the only one for now). */
export function AddParticipantModal({
  open,
  onClose,
  categories,
  defaultCategory,
  defaultGender,
  onAdd,
}: AddParticipantModalProps) {
  const empty = {
    name: '',
    delegation: '',
    ranking: '',
    gender: GENDERS.find((option) => option.value === defaultGender)?.label ?? '',
    category: defaultCategory,
  };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<Player | null>(null);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof typeof empty) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError(null);
  };

  const submit = async (another: boolean) => {
    const name = form.name.trim();
    if (name === '') {
      setError('Escribe el nombre del jugador.');
      return;
    }
    const gender = GENDERS.find((option) => option.label === form.gender)?.value;
    if (!gender) {
      setError('Elige el género.');
      return;
    }
    if (form.category === '') {
      setError('Elige la categoría.');
      return;
    }
    const ranking = form.ranking.trim() === '' ? null : Number(form.ranking);
    if (ranking !== null && (!Number.isInteger(ranking) || ranking < 0)) {
      setError('El ranking debe ser un número entero (0 o más).');
      return;
    }
    setSaving(true);
    let added: Player;
    try {
      added = await onAdd({
        name,
        delegation: form.delegation.trim(),
        ranking,
        gender,
        category: form.category,
        individual: true,
      });
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'No se pudo inscribir.');
      return;
    } finally {
      setSaving(false);
    }
    if (another) {
      // Keep league, gender and category: the next player is often from the same list.
      setForm((current) => ({ ...current, name: '', ranking: '' }));
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
      description="Individual. Los campos con * son obligatorios; el Nr. se asigna solo."
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

        <Field id="participant-name" label="Nombre completo" required>
          <Input
            ref={nameRef}
            id="participant-name"
            name="name"
            type="text"
            autoComplete="off"
            placeholder="Carlos Silva"
            value={form.name}
            onChange={set('name')}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="participant-delegation" label="Liga, delegación o club">
            <Input
              id="participant-delegation"
              name="delegation"
              type="text"
              placeholder="Club Universitario"
              value={form.delegation}
              onChange={set('delegation')}
            />
          </Field>
          <Field id="participant-gender" label="Género" required>
            <Select
              id="participant-gender"
              options={GENDERS.map((option) => option.label)}
              value={form.gender}
              onChange={set('gender')}
            />
          </Field>
          <Field id="participant-category" label="Categoría" required>
            <Select
              id="participant-category"
              options={categories}
              value={form.category}
              onChange={set('category')}
            />
          </Field>
          <Field
            id="participant-ranking"
            label="Puntos de ranking"
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
          <Button variant="outlined" type="submit" value="another" disabled={saving}>
            Añadir y crear otro
          </Button>
          <Button type="submit" value="close" disabled={saving}>
            Añadir jugador
          </Button>
        </div>
      </form>
    </Modal>
  );
}
