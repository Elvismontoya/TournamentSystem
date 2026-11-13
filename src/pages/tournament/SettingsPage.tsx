import { GripVertical, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Field, Input, Select } from '../../components/ui/form.tsx';
import { SectionHeader } from '../../components/ui/SectionHeader.tsx';
import {
  BEST_OF_OPTIONS,
  FORMAT_OPTIONS,
  PARTICIPANT_TYPE_OPTIONS,
  SPORT_OPTIONS,
} from '../../constants/labels.ts';

// Mockup: settings for any sport, filled with a table tennis example (ITTF defaults).
// Saving does nothing yet.

const TIEBREAKERS = [
  'Puntos en el grupo',
  'Enfrentamiento directo entre empatados',
  'Diferencia de sets (juegos ganados / perdidos)',
  'Diferencia de puntos de juego',
];

function SettingsCard({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <Card className="grid gap-6 md:grid-cols-[14rem_1fr]">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-neutral-400">{text}</p>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </Card>
  );
}

export function SettingsPage() {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
      className="flex flex-col gap-6"
    >
      <SectionHeader title="Configuración" text="Datos generales, formato y reglas del torneo.">
        <Button type="submit">Guardar cambios</Button>
      </SectionHeader>

      <SettingsCard title="General" text="Cómo se verá el torneo en su página pública.">
        <Field id="settings-name" label="Nombre del torneo">
          <Input id="settings-name" name="name" defaultValue="Open Nacional 2026" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="settings-sport" label="Deporte">
            <Select
              id="settings-sport"
              name="sport"
              options={SPORT_OPTIONS}
              defaultValue="Tenis de mesa"
            />
          </Field>
          <Field id="settings-category" label="Categoría">
            <Input id="settings-category" name="category" defaultValue="Individual masculino" />
          </Field>
          <Field id="settings-start" label="Fecha de inicio">
            <Input id="settings-start" name="startDate" type="date" defaultValue="2026-11-15" />
          </Field>
          <Field id="settings-end" label="Fecha de fin">
            <Input id="settings-end" name="endDate" type="date" defaultValue="2026-11-16" />
          </Field>
          <Field id="settings-location" label="Lugar">
            <Input id="settings-location" name="location" defaultValue="Coliseo Central" />
          </Field>
          <Field id="settings-tables" label="Canchas o mesas disponibles">
            <Input id="settings-tables" name="tables" type="number" min={1} defaultValue={8} />
          </Field>
        </div>
      </SettingsCard>

      <SettingsCard title="Formato" text="Participantes, fases y cupos.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="settings-participants" label="Participantes">
            <Select
              id="settings-participants"
              name="participantType"
              options={PARTICIPANT_TYPE_OPTIONS}
              defaultValue="Individual"
            />
          </Field>
          <Field id="settings-format" label="Formato">
            <Select
              id="settings-format"
              name="format"
              options={FORMAT_OPTIONS}
              defaultValue="Grupos + eliminación"
            />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field id="settings-slots" label="Cupos">
            <Input id="settings-slots" name="slots" type="number" min={2} defaultValue={16} />
          </Field>
          <Field id="settings-group-size" label="Participantes por grupo">
            <Input
              id="settings-group-size"
              name="groupSize"
              type="number"
              min={3}
              defaultValue={4}
            />
          </Field>
          <Field id="settings-qualify" label="Clasifican por grupo">
            <Input id="settings-qualify" name="qualify" type="number" min={1} defaultValue={2} />
          </Field>
        </div>
        <label className="flex items-center gap-3 text-sm text-neutral-300">
          <input
            type="checkbox"
            name="seeded"
            defaultChecked
            className="size-4 accent-primary-500"
          />
          Usar el ranking para ubicar cabezas de serie en el sorteo
        </label>
      </SettingsCard>

      <SettingsCard
        title="Reglas de tenis de mesa"
        text="Estas opciones cambian según el deporte elegido. Aquí: juegos por partido y puntos por juego."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="settings-best-of-groups" label="Fase de grupos">
            <Select
              id="settings-best-of-groups"
              name="bestOfGroups"
              options={BEST_OF_OPTIONS}
              defaultValue="Al mejor de 5 juegos"
            />
          </Field>
          <Field id="settings-best-of-ko" label="Llaves (cuadro principal)">
            <Select
              id="settings-best-of-ko"
              name="bestOfKnockout"
              options={BEST_OF_OPTIONS}
              defaultValue="Al mejor de 7 juegos"
            />
          </Field>
          <Field id="settings-game-points" label="Puntos por juego">
            <Input
              id="settings-game-points"
              name="gamePoints"
              type="number"
              min={1}
              defaultValue={11}
            />
          </Field>
          <Field id="settings-margin" label="Diferencia mínima para ganar">
            <Input id="settings-margin" name="margin" type="number" min={1} defaultValue={2} />
          </Field>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Puntuación del grupo"
        text="Puntos en la tabla según el resultado. Los valores por defecto dependen del deporte."
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <Field id="settings-win" label="Victoria">
            <Input id="settings-win" name="pointsWin" type="number" min={0} defaultValue={2} />
          </Field>
          <Field id="settings-loss" label="Derrota">
            <Input id="settings-loss" name="pointsLoss" type="number" min={0} defaultValue={1} />
          </Field>
          <Field id="settings-walkover" label="No presentado (W.O.)">
            <Input
              id="settings-walkover"
              name="pointsWalkover"
              type="number"
              min={0}
              defaultValue={0}
            />
          </Field>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Desempate"
        text="Orden de criterios cuando dos o más participantes empatan en puntos. Arrastra para reordenar."
      >
        <ol className="flex flex-col gap-2">
          {TIEBREAKERS.map((criterion, index) => (
            <li
              key={criterion}
              className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-850 px-3 py-2.5 text-sm"
            >
              <GripVertical className="size-4 text-neutral-600" aria-hidden="true" />
              <span className="w-5 font-display text-neutral-500">{index + 1}.</span>
              <span className="text-neutral-100">{criterion}</span>
            </li>
          ))}
        </ol>
      </SettingsCard>

      <Card className="flex flex-wrap items-center justify-between gap-4 border-red-500/30">
        <div>
          <h3 className="font-semibold text-red-300">Eliminar torneo</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Se borrarán jugadores, partidos y resultados. No se puede deshacer.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 font-display text-sm font-medium text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Eliminar torneo
        </button>
      </Card>
    </form>
  );
}
