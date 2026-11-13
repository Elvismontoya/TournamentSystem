import { Check, Lock, LoaderCircle, Trash2, TriangleAlert } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ApiError } from '../../api/client.ts';
import type { SettingsUpdate, TournamentView } from '../../api/types.ts';
import { Modal } from '../../components/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Field, Input, Select } from '../../components/ui/form.tsx';
import { SectionHeader } from '../../components/ui/SectionHeader.tsx';
import { FORMAT_OPTIONS, PARTICIPANT_TYPE_OPTIONS, SPORT_OPTIONS } from '../../constants/labels.ts';
import { BEST_OF_VALUES, bestOfLabel } from '../../features/tournament/settingsText.ts';
import type { Tournament } from '../../features/tournament/useTournament.ts';

// Settings for any sport, saved in the API (PUT /configuracion). Match rules lock once results
// are entered; the tie-break order and qualifiers per group are fixed for now.

/** Form values: numbers are kept as typed (strings) until saving. */
interface FormValues {
  name: string;
  sport: string;
  category: string;
  startDate: string;
  endDate: string;
  location: string;
  participantType: string;
  format: string;
  capacity: string;
  defaultGroupSize: string;
  seeded: boolean;
  setsPerMatch: number;
  knockoutSetsPerMatch: number;
  gamePoints: string;
  winMargin: string;
  pointsWin: string;
  pointsLoss: string;
  pointsWalkover: string;
}

/** Fields edited as plain text (inputs and selects). */
type TextKey = {
  [K in keyof FormValues]: FormValues[K] extends string ? K : never;
}[keyof FormValues];

function valuesOf({ name, settings }: TournamentView): FormValues {
  return {
    name,
    sport: settings.sport,
    category: settings.category,
    startDate: settings.startDate ?? '',
    endDate: settings.endDate ?? '',
    location: settings.location,
    participantType: settings.participantType,
    format: settings.format,
    capacity: String(settings.capacity),
    defaultGroupSize: String(settings.defaultGroupSize),
    seeded: settings.seeded,
    setsPerMatch: settings.setsPerMatch,
    knockoutSetsPerMatch: settings.knockoutSetsPerMatch,
    gamePoints: String(settings.gamePoints),
    winMargin: String(settings.winMargin),
    pointsWin: String(settings.pointsWin),
    pointsLoss: String(settings.pointsLoss),
    pointsWalkover: String(settings.pointsWalkover),
  };
}

function integer(value: string, label: string): number {
  const number = Number(value);
  if (value.trim() === '' || !Number.isInteger(number)) {
    throw new Error(`${label}: escribe un número entero.`);
  }
  return number;
}

/** Form → API body; throws Error with a message for the first number that isn't one. */
function updateOf(values: FormValues): SettingsUpdate {
  return {
    name: values.name,
    sport: values.sport,
    category: values.category,
    startDate: values.startDate || null,
    endDate: values.endDate || null,
    location: values.location,
    participantType: values.participantType,
    format: values.format,
    capacity: integer(values.capacity, 'Cupos'),
    defaultGroupSize: integer(values.defaultGroupSize, 'Participantes por grupo'),
    seeded: values.seeded,
    setsPerMatch: values.setsPerMatch,
    knockoutSetsPerMatch: values.knockoutSetsPerMatch,
    gamePoints: integer(values.gamePoints, 'Puntos por set'),
    winMargin: integer(values.winMargin, 'Diferencia mínima'),
    pointsWin: integer(values.pointsWin, 'Victoria'),
    pointsLoss: integer(values.pointsLoss, 'Derrota'),
    pointsWalkover: integer(values.pointsWalkover, 'No presentado (W.O.)'),
  };
}

const TIEBREAKERS = [
  'Puntos en el grupo',
  'Entre los empatados: puntos de los partidos que jugaron entre sí',
  'Entre los empatados: cociente de sets ganados / perdidos',
  'Entre los empatados: cociente de puntos ganados / perdidos',
  'Si siguen empatados: sorteo',
];

const BEST_OF_OPTIONS = BEST_OF_VALUES.map(bestOfLabel);

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

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'saved' }
  | { status: 'error'; message: string };

function DeleteTournament({ name, onDelete }: { name: string; onDelete: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo eliminar el torneo.');
      setDeleting(false);
    }
  };

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 border-red-500/30">
      <div>
        <h3 className="font-semibold text-red-300">Eliminar torneo</h3>
        <p className="mt-1 text-sm text-neutral-400">
          Se borrarán jugadores, partidos y resultados. No se puede deshacer.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 font-display text-sm font-medium text-red-300 hover:bg-red-500/10"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Eliminar torneo
      </button>

      <Modal
        open={open}
        onClose={() => {
          if (!deleting) setOpen(false);
        }}
        title="¿Eliminar el torneo?"
        description={`«${name}» se borrará con todos sus jugadores, grupos, resultados y llaves.`}
      >
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-300">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outlined"
            disabled={deleting}
            onClick={() => {
              setOpen(false);
            }}
          >
            Cancelar
          </Button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              void confirm();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-display text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-4" aria-hidden="true" />
            )}
            Eliminar definitivamente
          </button>
        </div>
      </Modal>
    </Card>
  );
}

export function SettingsPage() {
  const { view, updateSettings, deleteTournament } = useOutletContext<Tournament>();
  const navigate = useNavigate();
  const { settings } = view;
  const [values, setValues] = useState(() => valuesOf(view));
  const [save, setSave] = useState<SaveState>({ status: 'idle' });

  const saved = valuesOf(view);
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const locked = settings.rulesLocked;

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setSave({ status: 'idle' });
  };
  /** value + onChange for a text field. */
  const text = (key: TextKey) => ({
    value: values[key],
    onChange: (event: { target: { value: string } }) => {
      set(key, event.target.value);
    },
  });

  const submit = async () => {
    let update: SettingsUpdate;
    try {
      update = updateOf(values);
    } catch (error) {
      setSave({ status: 'error', message: (error as Error).message });
      return;
    }
    setSave({ status: 'saving' });
    try {
      await updateSettings(update);
      setSave({ status: 'saved' });
    } catch (error) {
      setSave({
        status: 'error',
        message: error instanceof ApiError ? error.message : 'No se pudieron guardar los cambios.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="flex flex-col gap-6"
        noValidate
      >
        <SectionHeader title="Configuración" text="Datos generales, formato y reglas del torneo.">
          <div className="flex flex-wrap items-center gap-3">
            {dirty && save.status !== 'saving' && (
              <Button
                variant="ghost"
                onClick={() => {
                  setValues(saved);
                  setSave({ status: 'idle' });
                }}
              >
                Descartar
              </Button>
            )}
            <Button type="submit" disabled={!dirty || save.status === 'saving'}>
              {save.status === 'saving' && (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              )}
              Guardar cambios
            </Button>
          </div>
        </SectionHeader>

        <div aria-live="polite">
          {save.status === 'error' && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {save.message}
            </p>
          )}
          {save.status === 'saved' && !dirty && (
            <p className="flex items-center gap-2 rounded-xl border border-secondary-500/40 bg-secondary-500/10 px-4 py-3 text-sm text-secondary-200">
              <Check className="size-4 shrink-0" aria-hidden="true" />
              Cambios guardados.
            </p>
          )}
        </div>

        <SettingsCard title="General" text="Cómo se verá el torneo en su página pública.">
          <Field id="settings-name" label="Nombre del torneo">
            <Input id="settings-name" required maxLength={100} {...text('name')} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="settings-sport" label="Deporte">
              <Select id="settings-sport" options={SPORT_OPTIONS} {...text('sport')} />
            </Field>
            <Field id="settings-category" label="Categoría">
              <Input id="settings-category" maxLength={100} {...text('category')} />
            </Field>
            <Field id="settings-start" label="Fecha de inicio">
              <Input id="settings-start" type="date" {...text('startDate')} />
            </Field>
            <Field id="settings-end" label="Fecha de fin">
              <Input
                id="settings-end"
                type="date"
                min={values.startDate || undefined}
                {...text('endDate')}
              />
            </Field>
            <Field id="settings-location" label="Lugar">
              <Input id="settings-location" maxLength={100} {...text('location')} />
            </Field>
          </div>
        </SettingsCard>

        <SettingsCard title="Formato" text="Participantes, fases y cupos.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="settings-participants" label="Participantes">
              <Select
                id="settings-participants"
                options={PARTICIPANT_TYPE_OPTIONS}
                {...text('participantType')}
              />
            </Field>
            <Field id="settings-format" label="Formato">
              <Select id="settings-format" options={FORMAT_OPTIONS} {...text('format')} />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field
              id="settings-slots"
              label="Cupos"
              hint={`Mínimo ${String(settings.minCapacity)} (inscritos).`}
            >
              <Input
                id="settings-slots"
                type="number"
                min={settings.minCapacity}
                aria-describedby="settings-slots-hint"
                {...text('capacity')}
              />
            </Field>
            <Field
              id="settings-group-size"
              label="Participantes por grupo"
              hint="Tamaño sugerido al sortear."
            >
              <Input
                id="settings-group-size"
                type="number"
                min={settings.minGroupSize}
                max={settings.maxGroupSize}
                aria-describedby="settings-group-size-hint"
                {...text('defaultGroupSize')}
              />
            </Field>
            <Field
              id="settings-qualify"
              label="Clasifican por grupo"
              hint="Por ahora las llaves admiten 1.º y 2.º."
            >
              <Input
                id="settings-qualify"
                type="number"
                value={settings.qualifiersPerGroup}
                disabled
                aria-describedby="settings-qualify-hint"
              />
            </Field>
          </div>
          <label className="flex items-center gap-3 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={values.seeded}
              onChange={(event) => {
                set('seeded', event.target.checked);
              }}
              className="size-4 accent-primary-500"
            />
            Usar el ranking para ubicar cabezas de serie en el sorteo
          </label>
        </SettingsCard>

        <SettingsCard
          title="Reglas de los partidos"
          text="Sets por partido y cómo se gana un set. Se aplican al cargar resultados."
        >
          {locked && (
            <p className="flex items-start gap-2 rounded-lg border border-tertiary-500/40 bg-tertiary-500/10 px-3 py-2 text-sm text-tertiary-200">
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Ya hay resultados cargados: los sets de la fase de grupos, los puntos por set y la
              diferencia mínima no se pueden cambiar.
            </p>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="settings-best-of-groups" label="Fase de grupos">
              <Select
                id="settings-best-of-groups"
                options={BEST_OF_OPTIONS}
                value={bestOfLabel(values.setsPerMatch)}
                disabled={locked}
                onChange={(event) => {
                  set(
                    'setsPerMatch',
                    BEST_OF_VALUES[BEST_OF_OPTIONS.indexOf(event.target.value)] ?? 5,
                  );
                }}
              />
            </Field>
            <Field id="settings-best-of-ko" label="Llaves (cuadro principal)">
              <Select
                id="settings-best-of-ko"
                options={BEST_OF_OPTIONS}
                value={bestOfLabel(values.knockoutSetsPerMatch)}
                disabled={settings.knockoutRulesLocked}
                onChange={(event) => {
                  set(
                    'knockoutSetsPerMatch',
                    BEST_OF_VALUES[BEST_OF_OPTIONS.indexOf(event.target.value)] ?? 5,
                  );
                }}
              />
            </Field>
            <Field id="settings-game-points" label="Puntos por set">
              <Input
                id="settings-game-points"
                type="number"
                min={1}
                disabled={locked}
                {...text('gamePoints')}
              />
            </Field>
            <Field
              id="settings-margin"
              label="Diferencia mínima para ganar"
              hint="Con 2: si empatan cerca del final, se sigue hasta sacar 2 de ventaja."
            >
              <Input
                id="settings-margin"
                type="number"
                min={1}
                disabled={locked}
                aria-describedby="settings-margin-hint"
                {...text('winMargin')}
              />
            </Field>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Puntuación del grupo"
          text="Puntos en la tabla según el resultado. Se pueden cambiar en cualquier momento: la tabla se recalcula."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Field id="settings-win" label="Victoria">
              <Input id="settings-win" type="number" min={0} {...text('pointsWin')} />
            </Field>
            <Field id="settings-loss" label="Derrota">
              <Input id="settings-loss" type="number" min={0} {...text('pointsLoss')} />
            </Field>
            <Field id="settings-walkover" label="No presentado (W.O.)">
              <Input id="settings-walkover" type="number" min={0} {...text('pointsWalkover')} />
            </Field>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Desempate"
          text="Orden de criterios cuando dos o más participantes empatan en puntos (reglamento ITTF). Por ahora no se puede cambiar."
        >
          <ol className="flex flex-col gap-2">
            {TIEBREAKERS.map((criterion, index) => (
              <li
                key={criterion}
                className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-850 px-3 py-2.5 text-sm"
              >
                <span className="w-5 font-display text-neutral-500">{index + 1}.</span>
                <span className="text-neutral-100">{criterion}</span>
              </li>
            ))}
          </ol>
        </SettingsCard>
      </form>

      <DeleteTournament
        name={view.name}
        onDelete={async () => {
          await deleteTournament();
          void navigate('/mis-torneos');
        }}
      />
    </div>
  );
}
