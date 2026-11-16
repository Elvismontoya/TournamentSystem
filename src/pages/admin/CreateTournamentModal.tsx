import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  FilePlus2,
  LoaderCircle,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client.ts';
import { tournamentsApi } from '../../api/tournaments.ts';
import type { Settings, TournamentSummary, TournamentData } from '../../api/types.ts';
import { Modal } from '../../components/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { RequiredMark } from '../../components/ui/form.tsx';
import {
  FormatFields,
  FormSubheading,
  GeneralFields,
  GroupScoringFields,
  MatchRulesFields,
  TiebreakList,
} from '../../features/tournament/settingsForm.tsx';
import {
  generalError,
  NEW_TOURNAMENT_LIMITS,
  newTournamentValues,
  settingsUpdateOf,
  withCopiedRules,
  type SettingsFormValues,
  type SetValue,
} from '../../features/tournament/settingsFormValues.ts';
import {
  bestOfLabel,
  matchRuleText,
  scoringText,
  setRuleText,
} from '../../features/tournament/settingsText.ts';

// Creation wizard: step 1 general data, step 2 format and rules. Everything is saved at once
// (POST /torneos) and the new tournament opens. The same fields are in Configuración.
// "Copiar formato de otro torneo": only step 1 is filled; sport, format and every rule are
// taken from the chosen tournament.

const STEPS = ['Datos generales', 'Formato y reglas'] as const;

type Mode = 'scratch' | 'copy';

/** Tournaments to copy from (loaded when the copy option is chosen). */
type SourceList =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; tournaments: TournamentSummary[] };

function Stepper({ step, copying }: { step: number; copying: boolean }) {
  return (
    <ol className="mb-6 flex items-center gap-3">
      {STEPS.map((title, index) => {
        const done = index < step;
        const current = index === step;
        // Copying: the second step is filled from the other tournament.
        const copied = copying && index === 1;
        return (
          <li key={title} className="flex flex-1 items-center gap-3">
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full font-display text-xs font-bold ${
                done
                  ? 'bg-secondary-500 text-neutral-950'
                  : current
                    ? 'bg-primary-600 text-white ring-4 ring-primary-600/20'
                    : 'bg-neutral-800 text-neutral-500'
              }`}
              aria-hidden="true"
            >
              {done ? (
                <Check className="size-4" />
              ) : copied ? (
                <Copy className="size-3.5" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={`font-display text-sm font-medium ${current ? 'text-white' : 'text-neutral-500'}`}
            >
              <span className="sr-only">
                Paso {index + 1} de {STEPS.length}
                {current ? ' (actual)' : ''}:{' '}
              </span>
              {copied ? `${title} (copiado)` : title}
            </span>
            {index < STEPS.length - 1 && (
              <span className="h-px flex-1 bg-neutral-800" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-neutral-800 pt-5 first:border-0 first:pt-0">
      <FormSubheading>{title}</FormSubheading>
      {children}
    </section>
  );
}

const MODES: { value: Mode; title: string; text: string; icon: LucideIcon }[] = [
  {
    value: 'scratch',
    title: 'Desde cero',
    text: 'Defines el formato y las reglas en el paso 2.',
    icon: FilePlus2,
  },
  {
    value: 'copy',
    title: 'Copiar formato de otro torneo',
    text: 'Solo llenas los datos generales; las reglas se copian.',
    icon: Copy,
  },
];

function ModeChoice({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <fieldset className="mb-6">
      <legend className="sr-only">Cómo crear el torneo</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map(({ value, title, text, icon: Icon }) => {
          const checked = mode === value;
          return (
            <label
              key={value}
              className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition-colors ${
                checked
                  ? 'border-primary-500/60 bg-primary-500/10'
                  : 'border-neutral-700 hover:border-neutral-500'
              }`}
            >
              <input
                type="radio"
                name="create-mode"
                checked={checked}
                aria-label={title}
                aria-describedby={`create-mode-${value}`}
                onChange={() => {
                  onChange(value);
                }}
                className="sr-only"
              />
              <Icon
                className={`mt-0.5 size-5 shrink-0 ${checked ? 'text-primary-300' : 'text-neutral-500'}`}
                aria-hidden="true"
              />
              <span>
                <span className="block font-medium text-white">{title}</span>
                <span id={`create-mode-${value}`} className="text-xs text-neutral-400">
                  {text}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** What will be copied from the chosen tournament, in short. */
function CopiedRulesSummary({ source }: { source: TournamentData }) {
  const settings: Settings = source.settings;
  const rows: [string, string][] = [
    ['Deporte y formato', `${settings.sport} · ${settings.format}`],
    [
      'Grupos',
      `De ${String(settings.defaultGroupSize)} · ${
        settings.qualifiersPerGroup === 1 ? 'clasifica el 1.º' : 'clasifican 1.º y 2.º'
      }${settings.seeded ? ' · cabezas de serie por ranking' : ''}`,
    ],
    ['Resultados', settings.scoring === 'points' ? 'Por puntos' : 'Por sets'],
    ['Partidos de grupo', `${matchRuleText(settings)}. ${setRuleText(settings)}.`],
    [
      'Llaves',
      `${bestOfLabel(settings.knockoutSetsPerMatch)}${
        settings.thirdPlaceMatch ? ' · con partido por el 3.er puesto' : ''
      }`,
    ],
    ['Puntuación', scoringText(settings)],
    [
      'Desempate',
      settings.scoring === 'points'
        ? 'Puntos → entre empatados: puntos, sets y puntos de juego → sorteo'
        : 'Puntos → entre empatados: puntos y sets → sorteo',
    ],
  ];
  return (
    <dl className="mt-3 divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-850 text-sm">
      {rows.map(([term, description]) => (
        <div key={term} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[9rem_1fr] sm:gap-3">
          <dt className="text-neutral-500">{term}</dt>
          <dd className="text-neutral-100">{description}</dd>
        </div>
      ))}
    </dl>
  );
}

const selectClass =
  'mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-850 px-3 py-2 text-sm text-neutral-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none';

export function CreateTournamentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode>('scratch');
  const [values, setValues] = useState<SettingsFormValues>(newTournamentValues);
  const [sources, setSources] = useState<SourceList>({ status: 'idle' });
  const [source, setSource] = useState<TournamentData | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const copying = mode === 'copy';

  const set: SetValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setError(null);
  };
  const section = { idPrefix: 'new', values, set, limits: NEW_TOURNAMENT_LIMITS };

  const close = () => {
    if (creating) return;
    onClose();
    // Next time it opens empty, on step 1, from scratch.
    setStep(0);
    setMode('scratch');
    setValues(newTournamentValues());
    setSource(null);
    setSources({ status: 'idle' });
    setError(null);
  };

  const chooseMode = (next: Mode) => {
    setMode(next);
    setError(null);
    if (next === 'copy' && sources.status !== 'ready') {
      setSources({ status: 'loading' });
      tournamentsApi.list().then(
        (tournaments) => {
          setSources({ status: 'ready', tournaments });
        },
        (failure: unknown) => {
          setSources({
            status: 'error',
            message:
              failure instanceof ApiError ? failure.message : 'No se pudieron cargar los torneos.',
          });
        },
      );
    }
  };

  const chooseSource = (id: string) => {
    setError(null);
    if (id === '') {
      setSource(null);
      return;
    }
    setLoadingSource(true);
    tournamentsApi.get(id).then(
      (view) => {
        setSource(view);
        setLoadingSource(false);
        // Show the copied sport and format in step 1.
        setValues((current) => ({
          ...current,
          sport: view.settings.sport,
          format: view.settings.format,
        }));
      },
      (failure: unknown) => {
        setLoadingSource(false);
        setError(failure instanceof ApiError ? failure.message : 'No se pudo leer ese torneo.');
      },
    );
  };

  const next = () => {
    const missing = generalError(values);
    if (missing) {
      setError(missing);
      return;
    }
    setError(null);
    setStep(1);
  };

  const create = async () => {
    if (copying && !source) {
      setError('Elige el torneo del que se copia el formato.');
      return;
    }
    const final = copying && source ? withCopiedRules(values, source) : values;
    const missing = generalError(final);
    if (missing) {
      setError(missing);
      return;
    }
    let update;
    try {
      update = settingsUpdateOf(final);
    } catch (failure) {
      setError((failure as Error).message);
      return;
    }
    setCreating(true);
    try {
      const created = await tournamentsApi.create(update);
      setCreating(false);
      close();
      void navigate(`/torneos/${created.id}`);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : 'No se pudo crear el torneo.');
      setCreating(false);
    }
  };

  // Copying finishes on step 1; from scratch, step 1 leads to step 2.
  const lastStep = copying || step === 1;

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Nuevo torneo"
      description={
        step === 0
          ? copying
            ? 'Llena los datos generales; el formato y las reglas se copian del torneo que elijas. Los campos con * son obligatorios.'
            : 'Datos del torneo. Los campos con * son obligatorios.'
          : 'Cómo se juega: grupos, sets, puntuación y desempates. Podrás cambiarlo en Configuración mientras no haya resultados.'
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (lastStep) void create();
          else next();
        }}
        noValidate
      >
        <Stepper step={step} copying={copying} />

        {step === 0 ? (
          <>
            <ModeChoice mode={mode} onChange={chooseMode} />

            {copying && (
              <div className="mb-6 rounded-xl border border-primary-500/30 bg-primary-500/5 p-4">
                <label
                  htmlFor="copy-source"
                  className="block font-display text-sm font-medium text-neutral-300"
                >
                  Torneo del que se copia el formato
                  <RequiredMark />
                </label>
                {sources.status === 'loading' && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-neutral-400">
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    Cargando torneos…
                  </p>
                )}
                {sources.status === 'error' && (
                  <p className="mt-2 text-sm text-red-300">{sources.message}</p>
                )}
                {sources.status === 'ready' &&
                  (sources.tournaments.length === 0 ? (
                    <p className="mt-2 text-sm text-neutral-400">
                      Todavía no hay torneos para copiar: créalo desde cero.
                    </p>
                  ) : (
                    <select
                      id="copy-source"
                      value={source?.id ?? ''}
                      disabled={loadingSource}
                      onChange={(event) => {
                        chooseSource(event.target.value);
                      }}
                      className={selectClass}
                    >
                      <option value="">Selecciona…</option>
                      {sources.tournaments.map((tournament) => (
                        <option key={tournament.id} value={tournament.id}>
                          {tournament.name}
                          {tournament.startDate ? ` (${tournament.startDate.slice(0, 4)})` : ''}
                        </option>
                      ))}
                    </select>
                  ))}
                {loadingSource && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-neutral-400">
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    Leyendo el formato…
                  </p>
                )}
                {source && !loadingSource && (
                  <>
                    <p className="mt-3 text-xs text-neutral-400">
                      Se copia todo esto (podrás cambiarlo después en Configuración):
                    </p>
                    <CopiedRulesSummary source={source} />
                  </>
                )}
              </div>
            )}

            <GeneralFields
              idPrefix="new"
              values={values}
              set={set}
              copiedFrom={copying && source ? source.name : undefined}
            />
          </>
        ) : (
          <div className="flex flex-col gap-6">
            <StepSection title="Formato">
              <FormatFields {...section} />
            </StepSection>
            <StepSection title="Reglas de los partidos">
              <MatchRulesFields {...section} />
            </StepSection>
            <StepSection title="Puntuación del grupo">
              <GroupScoringFields idPrefix="new" values={values} set={set} />
            </StepSection>
            <StepSection title="Desempate">
              <TiebreakList scoring={values.scoring} />
            </StepSection>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-5 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-neutral-800 pt-5">
          {step === 0 ? (
            <Button variant="ghost" onClick={close}>
              Cancelar
            </Button>
          ) : (
            <Button
              variant="ghost"
              disabled={creating}
              onClick={() => {
                setError(null);
                setStep(0);
              }}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Atrás
            </Button>
          )}
          {lastStep ? (
            <Button type="submit" disabled={creating || loadingSource}>
              {creating && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
              Crear torneo
            </Button>
          ) : (
            <Button type="submit">
              Siguiente
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
