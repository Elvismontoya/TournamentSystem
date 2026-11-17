import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { ApiError } from '../../api/client.ts';
import type { Player, PlayerUpdate } from '../../api/types.ts';
import { Modal } from '../../components/Modal.tsx';
import { useToast } from '../../components/toast/toastContext.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Field, Input, Select } from '../../components/ui/form.tsx';
import { GENDERS } from '../../constants/catalog.ts';

interface EditParticipantModalProps {
  player: Player;
  /** Every registered player, to warn about a Nr. already taken before sending. */
  players: Player[];
  /** The tournament's categories, plus the player's own if it's another one (imported). */
  categories: string[];
  onClose: () => void;
  /** Saves on the server; rejects with ApiError (e.g. Nr. taken). */
  onSave: (playerId: string, entry: PlayerUpdate) => Promise<void>;
}

type FormField = 'name' | 'delegation' | 'bib' | 'ranking' | 'gender' | 'category';
type FormValues = Record<FormField, string>;
type FormErrors = Partial<Record<FormField, string>>;

/** What's wrong with each field (empty when everything is valid). */
function validate(form: FormValues, player: Player, players: Player[]): FormErrors {
  const errors: FormErrors = {};
  if (form.name.trim() === '') errors.name = 'Escribe el nombre del jugador.';
  else if (form.name.trim().length < 3) errors.name = 'El nombre es muy corto.';

  const bib = Number(form.bib);
  if (form.bib.trim() === '') errors.bib = 'Escribe el número del jugador.';
  else if (!Number.isInteger(bib) || bib < 1) errors.bib = 'Debe ser un número entero mayor que 0.';
  else {
    // Quick check before sending; the server checks it again (and decides).
    const owner = players.find((candidate) => candidate.bib === bib && candidate.id !== player.id);
    if (owner) errors.bib = `El Nr. ${String(bib)} ya es de ${owner.name}.`;
  }

  if (!GENDERS.some((option) => option.label === form.gender)) errors.gender = 'Elige el género.';
  if (form.category === '') errors.category = 'Elige la categoría.';

  if (form.ranking.trim() !== '') {
    const ranking = Number(form.ranking);
    if (!Number.isInteger(ranking) || ranking < 0) {
      errors.ranking = 'Debe ser un número entero (0 o más), o déjalo vacío.';
    }
  }
  return errors;
}

/** Edits a registered player's name, league, Nr., gender, category and ranking. */
export function EditParticipantModal({
  player,
  players,
  categories,
  onClose,
  onSave,
}: EditParticipantModalProps) {
  const toast = useToast();
  const [initial] = useState<FormValues>(() => ({
    name: player.name,
    delegation: player.delegation,
    bib: String(player.bib),
    ranking: player.ranking === null ? '' : String(player.ranking),
    gender: GENDERS.find((option) => option.value === player.gender)?.label ?? '',
    category: player.category ?? '',
  }));
  const [form, setForm] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const categoryOptions =
    player.category && !categories.includes(player.category)
      ? [...categories, player.category]
      : categories;

  const set = (field: FormField) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    // The field's message goes away as soon as it is changed.
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  /** Props that tie a control to its field's error message. */
  const invalid = (field: FormField, id: string) =>
    errors[field] ? { 'aria-invalid': true, 'aria-describedby': `${id}-error` } : {};

  const submit = async () => {
    const found = validate(form, player, players);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error('Revisa los datos', 'Hay campos con errores (marcados en rojo).');
      return;
    }
    const unchanged = (Object.keys(form) as FormField[]).every(
      (field) => form[field].trim() === initial[field].trim(),
    );
    if (unchanged) {
      toast.info('Sin cambios', 'No modificaste ningún dato del jugador.');
      onClose();
      return;
    }

    const gender = GENDERS.find((option) => option.label === form.gender)?.value ?? null;
    setSaving(true);
    try {
      await onSave(player.id, {
        name: form.name.trim(),
        delegation: form.delegation.trim(),
        bib: Number(form.bib),
        ranking: form.ranking.trim() === '' ? null : Number(form.ranking),
        gender,
        category: form.category,
      });
      toast.success('Jugador actualizado', `Se guardaron los cambios de ${form.name.trim()}.`);
      onClose();
    } catch (failure) {
      toast.error(
        'No se pudieron guardar los cambios',
        failure instanceof ApiError ? failure.message : 'Ocurrió un error inesperado.',
      );
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={() => {
        if (!saving) onClose();
      }}
      title="Editar jugador"
      description="Los campos con * son obligatorios. Los cambios se ven en los grupos, partidos y llaves; los resultados no cambian."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="space-y-5"
        noValidate
      >
        <Field id="edit-participant-name" label="Nombre completo" required error={errors.name}>
          <Input
            id="edit-participant-name"
            type="text"
            autoComplete="off"
            value={form.name}
            onChange={set('name')}
            {...invalid('name', 'edit-participant-name')}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="edit-participant-delegation" label="Liga, delegación o club">
            <Input
              id="edit-participant-delegation"
              type="text"
              value={form.delegation}
              onChange={set('delegation')}
            />
          </Field>
          <Field id="edit-participant-bib" label="Número (Nr.)" required error={errors.bib}>
            <Input
              id="edit-participant-bib"
              type="number"
              min={1}
              value={form.bib}
              onChange={set('bib')}
              {...invalid('bib', 'edit-participant-bib')}
            />
          </Field>
          <Field id="edit-participant-gender" label="Género" required error={errors.gender}>
            <Select
              id="edit-participant-gender"
              options={GENDERS.map((option) => option.label)}
              value={form.gender}
              onChange={set('gender')}
              {...invalid('gender', 'edit-participant-gender')}
            />
          </Field>
          <Field id="edit-participant-category" label="Categoría" required error={errors.category}>
            <Select
              id="edit-participant-category"
              options={categoryOptions}
              value={form.category}
              onChange={set('category')}
              {...invalid('category', 'edit-participant-category')}
            />
          </Field>
          <Field
            id="edit-participant-ranking"
            label="Puntos de ranking"
            hint="Cambia su lugar en la lista y como cabeza de serie en el próximo sorteo."
            error={errors.ranking}
          >
            <Input
              id="edit-participant-ranking"
              type="number"
              min={0}
              aria-describedby="edit-participant-ranking-hint"
              value={form.ranking}
              onChange={set('ranking')}
              {...invalid('ranking', 'edit-participant-ranking')}
            />
          </Field>
        </div>

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
