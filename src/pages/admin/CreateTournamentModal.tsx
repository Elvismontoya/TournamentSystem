import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Field, Input, Select } from '../../components/ui/form.tsx';
import { FORMAT_OPTIONS, PARTICIPANT_TYPE_OPTIONS, SPORT_OPTIONS } from '../../constants/labels.ts';

export function CreateTournamentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo torneo"
      description="El torneo se crea como borrador; después podrás inscribir participantes."
    >
      {/* Mockup: nothing is saved; it just opens the example tournament dashboard. */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onClose();
          void navigate('/torneos/open-nacional-2026');
        }}
        className="space-y-5"
      >
        <Field id="name" label="Nombre del torneo">
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Open Nacional de Tenis de Mesa 2026"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="sport" label="Deporte">
            <Select id="sport" name="sport" options={SPORT_OPTIONS} />
          </Field>
          <Field id="format" label="Formato">
            <Select id="format" name="format" options={FORMAT_OPTIONS} />
          </Field>
          <Field id="participantType" label="Participantes">
            <Select
              id="participantType"
              name="participantType"
              options={PARTICIPANT_TYPE_OPTIONS}
            />
          </Field>
          <Field id="category" label="Categoría (opcional)">
            <Input id="category" name="category" type="text" placeholder="Individual masculino" />
          </Field>
          <Field id="startDate" label="Fecha de inicio">
            <Input id="startDate" name="startDate" type="date" />
          </Field>
          <Field id="location" label="Lugar (opcional)">
            <Input id="location" name="location" type="text" placeholder="Coliseo Central" />
          </Field>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Crear torneo</Button>
        </div>
      </form>
    </Modal>
  );
}
