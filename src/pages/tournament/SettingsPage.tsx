import { Check, LoaderCircle, Trash2, TriangleAlert } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ApiError } from '../../api/client.ts';
import type { SettingsUpdate } from '../../api/types.ts';
import { Modal } from '../../components/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { SectionHeader } from '../../components/ui/SectionHeader.tsx';
import {
  FormatFields,
  GeneralFields,
  GroupScoringFields,
  MatchRulesFields,
  TiebreakList,
} from '../../features/tournament/settingsForm.tsx';
import {
  formValuesOf,
  generalError,
  settingsUpdateOf,
  type FormLimits,
  type SetValue,
} from '../../features/tournament/settingsFormValues.ts';
import type { Tournament } from '../../features/tournament/useTournament.ts';

// Configuración: the same fields as the creation wizard (settingsForm), saved with
// PUT /configuracion. Match rules lock once results are entered.
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
  const [values, setValues] = useState(() => formValuesOf(view));
  const [save, setSave] = useState<SaveState>({ status: 'idle' });

  const saved = formValuesOf(view);
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const limits: FormLimits = settings;

  const set: SetValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setSave({ status: 'idle' });
  };
  const section = { idPrefix: 'settings', values, set, limits };

  const submit = async () => {
    const missing = generalError(values);
    if (missing) {
      setSave({ status: 'error', message: missing });
      return;
    }
    let update: SettingsUpdate;
    try {
      update = settingsUpdateOf(values);
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

        <SettingsCard
          title="General"
          text="Cómo se verá el torneo. Los campos con * son obligatorios."
        >
          <GeneralFields idPrefix="settings" values={values} set={set} />
        </SettingsCard>

        <SettingsCard title="Formato" text="Grupos, clasificados y fases.">
          <FormatFields {...section} />
        </SettingsCard>

        <SettingsCard
          title="Reglas de los partidos"
          text="Cómo se cargan los resultados y cuántos sets se juegan."
        >
          <MatchRulesFields {...section} />
        </SettingsCard>

        <SettingsCard
          title="Puntuación del grupo"
          text="Puntos en la tabla según el resultado. Se pueden cambiar en cualquier momento: la tabla se recalcula."
        >
          <GroupScoringFields idPrefix="settings" values={values} set={set} />
        </SettingsCard>

        <SettingsCard
          title="Desempate"
          text="Orden de criterios cuando dos o más participantes empatan en puntos (reglamento ITTF)."
        >
          <TiebreakList scoring={values.scoring} />
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
