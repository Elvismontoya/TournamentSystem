import { LoaderCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { ApiError } from '../../api/client.ts';
import type { Gender, NewPlayer, Player } from '../../api/types.ts';
import { Modal } from '../../components/Modal.tsx';
import { useToast } from '../../components/toast/toastContext.ts';
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

type FormField = 'name' | 'delegation' | 'ranking' | 'gender' | 'category';
type FormValues = Record<FormField, string>;
type FormErrors = Partial<Record<FormField, string>>;

const DELEGATION_REQUIRED = 'Escribe la liga, delegación o club (o «Independiente»).';

/** What's wrong with each field (empty when everything is valid). */
function validate(form: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (form.name.trim() === '') errors.name = 'Escribe el nombre del jugador.';
  else if (form.name.trim().length < 3) errors.name = 'El nombre es muy corto.';
  if (form.delegation.trim() === '') errors.delegation = DELEGATION_REQUIRED;
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

/** Registers one player by hand, in the individual event (the only one for now). */
export function AddParticipantModal({
  open,
  onClose,
  categories,
  defaultCategory,
  defaultGender,
  onAdd,
}: AddParticipantModalProps) {
  const toast = useToast();
  const empty: FormValues = {
    name: '',
    delegation: '',
    ranking: '',
    gender: GENDERS.find((option) => option.value === defaultGender)?.label ?? '',
    category: defaultCategory,
  };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const set = (field: FormField) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    // The field's message goes away as soon as it is changed.
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  /** Props that tie a control to its field's error message. */
  const invalid = (field: FormField, id: string) =>
    errors[field] ? { 'aria-invalid': true, 'aria-describedby': `${id}-error` } : {};

  const close = () => {
    if (saving) return;
    setErrors({});
    onClose();
  };

  const submit = async (another: boolean) => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error('Revisa los datos', 'Hay campos con errores (marcados en rojo).');
      return;
    }
    setSaving(true);
    let added: Player;
    try {
      added = await onAdd({
        name: form.name.trim(),
        delegation: form.delegation.trim(),
        ranking: form.ranking.trim() === '' ? null : Number(form.ranking),
        gender: GENDERS.find((option) => option.label === form.gender)?.value ?? null,
        category: form.category,
        individual: true,
      });
    } catch (failure) {
      toast.error(
        'No se pudo inscribir al jugador',
        failure instanceof ApiError ? failure.message : 'Ocurrió un error inesperado.',
      );
      return;
    } finally {
      setSaving(false);
    }
    toast.success(
      'Jugador inscrito',
      `${added.name} quedó inscrito con el Nr. ${String(added.bib)} (${form.category}).`,
    );
    if (another) {
      // Keep league, gender and category: the next player is often from the same list.
      setForm((current) => ({ ...current, name: '', ranking: '' }));
      nameRef.current?.focus();
    } else {
      setForm(empty);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
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
        <Field id="participant-name" label="Nombre completo" required error={errors.name}>
          <Input
            ref={nameRef}
            id="participant-name"
            name="name"
            type="text"
            autoComplete="off"
            placeholder="Carlos Silva"
            value={form.name}
            onChange={set('name')}
            {...invalid('name', 'participant-name')}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="participant-delegation"
            label="Liga, delegación o club"
            required
            hint="Si no tiene, escribe «Independiente»."
            error={errors.delegation}
          >
            <Input
              id="participant-delegation"
              name="delegation"
              type="text"
              placeholder="Club Universitario"
              aria-describedby="participant-delegation-hint"
              value={form.delegation}
              onChange={set('delegation')}
              {...invalid('delegation', 'participant-delegation')}
            />
          </Field>
          <Field id="participant-gender" label="Género" required error={errors.gender}>
            <Select
              id="participant-gender"
              options={GENDERS.map((option) => option.label)}
              value={form.gender}
              onChange={set('gender')}
              {...invalid('gender', 'participant-gender')}
            />
          </Field>
          <Field id="participant-category" label="Categoría" required error={errors.category}>
            <Select
              id="participant-category"
              options={categories}
              value={form.category}
              onChange={set('category')}
              {...invalid('category', 'participant-category')}
            />
          </Field>
          <Field
            id="participant-ranking"
            label="Puntos de ranking"
            hint="Define su lugar como cabeza de serie."
            error={errors.ranking}
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
              {...invalid('ranking', 'participant-ranking')}
            />
          </Field>
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={close} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="outlined" type="submit" value="another" disabled={saving}>
            Añadir y crear otro
          </Button>
          <Button type="submit" value="close" disabled={saving}>
            {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            Añadir jugador
          </Button>
        </div>
      </form>
    </Modal>
  );
}
