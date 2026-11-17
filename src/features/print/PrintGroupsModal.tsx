import { Printer } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { GroupView } from '../../api/types.ts';
import { Modal } from '../../components/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { printInPage, printUrl } from './printing.ts';

const ALL = 'todos';

/** Chooses which group's scoresheet to print (or all of them, one per page). */
export function PrintGroupsModal({
  competition,
  groups,
  onClose,
}: {
  /** Competition key ("Sub 19 · Femenino"). */
  competition: string;
  groups: GroupView[];
  onClose: () => void;
}) {
  const { slug = '' } = useParams();
  const [chosen, setChosen] = useState('0');

  const options = [
    ...groups.map((group, index) => ({
      value: String(index),
      label: `Grupo ${group.name}`,
      detail: `${String(group.players.length)} jugadores · ${String(group.total)} partidos`,
    })),
    { value: ALL, label: 'Todos los grupos', detail: 'Una hoja por grupo' },
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title="Imprimir planilla"
      description={`${competition}: elige el grupo. Se abre el diálogo de imprimir (también puedes guardar en PDF).`}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          printInPage(printUrl(slug, competition, `grupo/${chosen}`));
          onClose();
        }}
        className="space-y-5"
      >
        <fieldset>
          <legend className="sr-only">Grupo</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((option) => {
              const checked = chosen === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                    checked
                      ? 'border-primary-500/60 bg-primary-500/10'
                      : 'border-neutral-700 hover:border-neutral-500'
                  } ${option.value === ALL ? 'sm:col-span-2' : ''}`}
                >
                  <input
                    type="radio"
                    name="print-group"
                    value={option.value}
                    checked={checked}
                    aria-label={option.label}
                    onChange={() => {
                      setChosen(option.value);
                    }}
                    className="size-4 accent-primary-500"
                  />
                  <span>
                    <span className="block font-medium text-white">{option.label}</span>
                    <span className="text-xs text-neutral-400">{option.detail}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            <Printer className="size-4" aria-hidden="true" />
            Imprimir
          </Button>
        </div>
      </form>
    </Modal>
  );
}
