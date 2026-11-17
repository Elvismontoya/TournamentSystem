import { Info, Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Division, Scoring } from '../../api/types.ts';
import { Field, Input, RequiredMark, Select } from '../../components/ui/form.tsx';
import {
  CATEGORIES,
  DIVISIONS,
  FORMATS,
  MODALITIES,
  SPORTS,
  type CatalogItem,
} from '../../constants/catalog.ts';
import type { FormLimits, SetValue, SettingsFormValues } from './settingsFormValues.ts';
import { BEST_OF_VALUES, bestOfLabel, tiebreakersFor } from './settingsText.ts';

// Fields of the tournament's settings form, shared by the creation wizard (step 1: general,
// step 2: format and rules) and Configuración (same fields, plus locks once there are
// results). Values and checks are in settingsFormValues.ts.
interface SectionProps {
  /** Prefix for the ids, so two forms on one page don't clash. */
  idPrefix: string;
  values: SettingsFormValues;
  set: SetValue;
  limits: FormLimits;
}

/** value + onChange for a text input bound to `key`. */
function textProps(
  values: SettingsFormValues,
  set: SetValue,
  key: {
    [K in keyof SettingsFormValues]: SettingsFormValues[K] extends string ? K : never;
  }[keyof SettingsFormValues],
) {
  return {
    value: values[key],
    onChange: (event: { target: { value: string } }) => {
      set(key, event.target.value);
    },
  };
}

const availableNames = (items: CatalogItem[]) =>
  items.filter((item) => item.available).map((item) => item.name);
const unavailableNames = (items: CatalogItem[]) =>
  items.filter((item) => !item.available).map((item) => item.name);

/** Multi-select as checkboxes; items not available yet are shown locked. */
function CheckboxGroup({
  legend,
  items,
  selected,
  onChange,
  hint,
  allowAll = true,
}: {
  legend: string;
  items: CatalogItem[];
  selected: string[];
  onChange: (selected: string[]) => void;
  hint?: string;
  /** Offer "Marcar todas" (when more than two can be chosen). */
  allowAll?: boolean;
}) {
  // Keep the catalog order whatever the click order.
  const toggle = (name: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(name);
    else next.delete(name);
    onChange(items.map((item) => item.name).filter((candidate) => next.has(candidate)));
  };
  const allAvailable = availableNames(items);
  const everyChosen = allAvailable.every((name) => selected.includes(name));

  return (
    <fieldset>
      <div className="flex items-center justify-between gap-3">
        <legend className="font-display text-sm font-medium text-neutral-300">
          {legend}
          <RequiredMark />
        </legend>
        {allowAll && allAvailable.length > 2 && (
          <button
            type="button"
            onClick={() => {
              onChange(everyChosen ? [] : allAvailable);
            }}
            className="text-xs font-medium text-primary-300 hover:text-primary-200"
          >
            {everyChosen ? 'Quitar todas' : 'Marcar todas'}
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => {
          const checked = selected.includes(item.name);
          return (
            <label
              key={item.id}
              title={item.available ? undefined : 'Próximamente'}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                !item.available
                  ? 'cursor-not-allowed border-neutral-800 text-neutral-600'
                  : checked
                    ? 'cursor-pointer border-primary-500/60 bg-primary-500/15 text-white'
                    : 'cursor-pointer border-neutral-700 text-neutral-300 hover:border-neutral-500'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!item.available}
                onChange={(event) => {
                  toggle(item.name, event.target.checked);
                }}
                className="size-4 accent-primary-500"
              />
              {item.name}
              {!item.available && <Lock className="size-3" aria-label="Próximamente" />}
            </label>
          );
        })}
      </div>
      {hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
    </fieldset>
  );
}

/**
 * Step 1 / Configuración "General": name, sport, format, modalities, categories, dates, place.
 * With `copiedFrom`, sport and format come from that tournament (read-only here).
 */
export function GeneralFields({
  idPrefix,
  values,
  set,
  copiedFrom,
}: Omit<SectionProps, 'limits'> & { copiedFrom?: string }) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const copiedHint = copiedFrom ? `Copiado de «${copiedFrom}».` : undefined;
  return (
    <div className="flex flex-col gap-5">
      <Field id={id('name')} label="Nombre del torneo" required>
        <Input
          id={id('name')}
          type="text"
          maxLength={100}
          placeholder="Open Nacional de Tenis de Mesa 2026"
          {...textProps(values, set, 'name')}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id('sport')} label="Deporte" required hint={copiedHint}>
          <Select
            id={id('sport')}
            options={SPORTS.map((item) => item.name)}
            disabledOptions={unavailableNames(SPORTS)}
            disabled={copiedFrom !== undefined}
            {...textProps(values, set, 'sport')}
          />
        </Field>
        <Field id={id('format')} label="Formato" required hint={copiedHint}>
          <Select
            id={id('format')}
            options={FORMATS.map((item) => item.name)}
            disabledOptions={unavailableNames(FORMATS)}
            disabled={copiedFrom !== undefined}
            {...textProps(values, set, 'format')}
          />
        </Field>
      </div>
      <CheckboxGroup
        legend="Modalidad"
        items={MODALITIES}
        selected={values.modalities}
        onChange={(selected) => {
          set('modalities', selected);
        }}
        hint="Por ahora solo individual; dobles y equipos llegarán más adelante."
      />
      <CheckboxGroup
        legend="Categorías"
        items={CATEGORIES}
        selected={values.categories}
        onChange={(selected) => {
          set('categories', selected);
        }}
        hint="Marca todas las que juega el torneo: cada una juega aparte."
      />
      <CheckboxGroup
        legend="Rama"
        items={DIVISIONS.map((division) => ({
          id: division.value,
          name: division.value,
          available: true,
        }))}
        selected={values.divisions}
        allowAll={false}
        onChange={(selected) => {
          // Mixto goes alone: choosing it clears the others, and the others clear it.
          const added = selected.find((name) => !values.divisions.includes(name as Division));
          const next = (
            added === 'Mixto' ? ['Mixto'] : selected.filter((name) => name !== 'Mixto')
          ) as Division[];
          set('divisions', next);
        }}
        hint="Masculino y femenino juegan aparte; en mixto juegan hombres y mujeres juntos."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id('start')} label="Fecha de inicio" required>
          <Input id={id('start')} type="date" {...textProps(values, set, 'startDate')} />
        </Field>
        <Field id={id('end')} label="Fecha de fin">
          <Input
            id={id('end')}
            type="date"
            min={values.startDate || undefined}
            {...textProps(values, set, 'endDate')}
          />
        </Field>
      </div>
      <Field id={id('location')} label="Lugar">
        <Input
          id={id('location')}
          type="text"
          maxLength={100}
          placeholder="Coliseo Central"
          {...textProps(values, set, 'location')}
        />
      </Field>
    </div>
  );
}

/** Small title inside a step or card. */
export function FormSubheading({ children }: { children: ReactNode }) {
  return (
    <h4 className="font-display text-xs font-semibold tracking-wider text-neutral-400 uppercase">
      {children}
    </h4>
  );
}

/** Format: group size, qualifiers, seeds and the match for 3rd place (no limit of places). */
export function FormatFields({ idPrefix, values, set, limits }: SectionProps) {
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={id('group-size')}
          label="Participantes por grupo"
          required
          hint={`De ${String(limits.minGroupSize)} a ${String(limits.maxGroupSize)}; tamaño sugerido al sortear.`}
        >
          <Input
            id={id('group-size')}
            type="number"
            min={limits.minGroupSize}
            max={limits.maxGroupSize}
            aria-describedby={`${id('group-size')}-hint`}
            {...textProps(values, set, 'defaultGroupSize')}
          />
        </Field>
        <Field
          id={id('qualifiers')}
          label="Clasifican por grupo"
          required
          hint={
            limits.knockoutRulesLocked ? 'Las llaves ya tienen resultados.' : 'Pasan a las llaves.'
          }
        >
          <Select
            id={id('qualifiers')}
            options={['1 (el 1.º)', '2 (1.º y 2.º)']}
            value={values.qualifiersPerGroup === 1 ? '1 (el 1.º)' : '2 (1.º y 2.º)'}
            disabled={limits.knockoutRulesLocked}
            onChange={(event) => {
              set('qualifiersPerGroup', event.target.value.startsWith('1') ? 1 : 2);
            }}
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
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-3 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={values.thirdPlaceMatch}
            disabled={limits.thirdPlaceLocked}
            onChange={(event) => {
              set('thirdPlaceMatch', event.target.checked);
            }}
            className="size-4 accent-primary-500"
          />
          Jugar partido por el 3.er puesto
        </label>
        <p className="pl-7 text-xs text-neutral-500">
          {limits.thirdPlaceLocked
            ? 'Ya tiene resultados: bórralos en Llaves para poder quitarlo.'
            : 'Lo juegan los perdedores de semifinal. Si no se juega, los dos comparten el 3.er puesto.'}
        </p>
      </div>
    </div>
  );
}

const BEST_OF_OPTIONS = BEST_OF_VALUES.map(bestOfLabel);
const bestOfValue = (label: string) => BEST_OF_VALUES[BEST_OF_OPTIONS.indexOf(label)] ?? 5;

const SCORING_OPTIONS: { value: Scoring; title: string; text: string }[] = [
  {
    value: 'points',
    title: 'Por puntos',
    text: 'Se cargan los puntos de cada set (11-8, 9-11…). Desempata también por cociente de puntos.',
  },
  {
    value: 'sets',
    title: 'Por sets',
    text: 'Se carga solo el marcador final en sets (3-1), sin los puntos.',
  },
];

/** Match rules: how results are entered, best of N sets, points per set and margin. */
export function MatchRulesFields({ idPrefix, values, set, limits }: SectionProps) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const locked = limits.rulesLocked;
  return (
    <div className="flex flex-col gap-5">
      {locked && (
        <p className="flex items-start gap-2 rounded-lg border border-tertiary-500/40 bg-tertiary-500/10 px-3 py-2 text-sm text-tertiary-200">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Ya hay resultados cargados: la forma de cargar resultados, los sets de la fase de grupos,
          los puntos por set y la diferencia mínima no se pueden cambiar.
        </p>
      )}
      <fieldset>
        <legend className="font-display text-sm font-medium text-neutral-300">
          Resultados de cada partido
          <RequiredMark />
        </legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {SCORING_OPTIONS.map((option) => {
            const checked = values.scoring === option.value;
            return (
              <label
                key={option.value}
                className={`flex gap-3 rounded-xl border p-3 text-sm transition-colors ${
                  checked ? 'border-primary-500/60 bg-primary-500/10' : 'border-neutral-700'
                } ${locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-neutral-500'}`}
              >
                <input
                  type="radio"
                  name={id('scoring')}
                  checked={checked}
                  disabled={locked}
                  aria-label={option.title}
                  aria-describedby={id(`scoring-${option.value}`)}
                  onChange={() => {
                    set('scoring', option.value);
                  }}
                  className="mt-0.5 size-4 accent-primary-500"
                />
                <span>
                  <span className="block font-medium text-white">{option.title}</span>
                  <span id={id(`scoring-${option.value}`)} className="text-xs text-neutral-400">
                    {option.text}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id('best-of-groups')} label="Sets en la fase de grupos" required>
          <Select
            id={id('best-of-groups')}
            options={BEST_OF_OPTIONS}
            value={bestOfLabel(values.setsPerMatch)}
            disabled={locked}
            onChange={(event) => {
              set('setsPerMatch', bestOfValue(event.target.value));
            }}
          />
        </Field>
        <Field id={id('best-of-ko')} label="Sets en las llaves" required>
          <Select
            id={id('best-of-ko')}
            options={BEST_OF_OPTIONS}
            value={bestOfLabel(values.knockoutSetsPerMatch)}
            disabled={limits.knockoutRulesLocked}
            onChange={(event) => {
              set('knockoutSetsPerMatch', bestOfValue(event.target.value));
            }}
          />
        </Field>
        {values.scoring === 'points' && (
          <>
            <Field id={id('game-points')} label="Puntos por set" required>
              <Input
                id={id('game-points')}
                type="number"
                min={1}
                disabled={locked}
                {...textProps(values, set, 'gamePoints')}
              />
            </Field>
            <Field
              id={id('margin')}
              label="Diferencia mínima para ganar"
              required
              hint="Con 2: si empatan cerca del final, se sigue hasta sacar 2 de ventaja."
            >
              <Input
                id={id('margin')}
                type="number"
                min={1}
                disabled={locked}
                aria-describedby={`${id('margin')}-hint`}
                {...textProps(values, set, 'winMargin')}
              />
            </Field>
          </>
        )}
      </div>
    </div>
  );
}

/** Group table points per result. */
export function GroupScoringFields({ idPrefix, values, set }: Omit<SectionProps, 'limits'>) {
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      <Field id={id('win')} label="Victoria" required>
        <Input id={id('win')} type="number" min={0} {...textProps(values, set, 'pointsWin')} />
      </Field>
      <Field id={id('loss')} label="Derrota" required>
        <Input id={id('loss')} type="number" min={0} {...textProps(values, set, 'pointsLoss')} />
      </Field>
      <Field id={id('walkover')} label="No presentado (W.O.)" required>
        <Input
          id={id('walkover')}
          type="number"
          min={0}
          {...textProps(values, set, 'pointsWalkover')}
        />
      </Field>
    </div>
  );
}

/** Tie-break order; the point ratio only appears when set points are entered. */
export function TiebreakList({ scoring }: { scoring: Scoring }) {
  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col gap-2">
        {tiebreakersFor(scoring).map((criterion, index) => (
          <li
            key={criterion}
            className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-850 px-3 py-2.5 text-sm"
          >
            <span className="w-5 font-display text-neutral-500">{index + 1}.</span>
            <span className="text-neutral-100">{criterion}</span>
          </li>
        ))}
      </ol>
      {scoring === 'sets' && (
        <p className="flex items-start gap-2 text-xs text-neutral-500">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Sin puntos por set no hay cociente de puntos: tras los sets, se sortea.
        </p>
      )}
    </div>
  );
}
