import { Printer } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { KnockoutView } from '../../api/types.ts';
import { Modal } from '../../components/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Field, Input } from '../../components/ui/form.tsx';
import { entrantSource, entrantText, numberedMatches, printInPage, printUrl } from './printing.ts';

/** Prints a knockout match's scoresheet by its match ID (the number on the bracket). */
export function PrintMatchModal({
  competition,
  knockout,
  onClose,
}: {
  /** Competition key ("Sub 19 · Femenino"). */
  competition: string;
  knockout: KnockoutView;
  onClose: () => void;
}) {
  const { slug = '' } = useParams();
  const matches = numberedMatches(knockout);
  const [value, setValue] = useState(String(matches.at(0)?.id ?? ''));
  const found = matches.find((candidate) => String(candidate.id) === value.trim());
  const first = matches.at(0)?.id ?? 0;
  const last = matches.at(-1)?.id ?? 0;

  return (
    <Modal
      open
      onClose={onClose}
      title="Imprimir partido"
      description={`${competition}: escribe el ID del partido (el número de cada partido en las llaves).`}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!found) return;
          printInPage(printUrl(slug, competition, found.path));
          onClose();
        }}
        className="space-y-5"
      >
        <Field
          id="print-match-id"
          label="ID del partido"
          required
          hint={`Del ${String(first)} al ${String(last)}.`}
        >
          <Input
            id="print-match-id"
            type="number"
            min={first}
            max={last}
            value={value}
            aria-describedby="print-match-id-hint"
            onChange={(event) => {
              setValue(event.target.value);
            }}
          />
        </Field>

        {found ? (
          <div className="rounded-xl border border-neutral-700 px-4 py-3 text-sm">
            <p className="font-display font-semibold text-white">
              #{found.id} · {found.label}
            </p>
            {([0, 1] as const).map((side) => (
              <p key={side} className="text-neutral-300">
                {entrantText(
                  found.match.entrants[side],
                  entrantSource(knockout, found.match.round, found.match.index, side),
                )}
              </p>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-neutral-700 px-4 py-3 text-sm text-neutral-400">
            {value.trim() === ''
              ? 'Escribe un ID.'
              : `No hay ningún partido con el ID ${value.trim()} en estas llaves.`}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!found}>
            <Printer className="size-4" aria-hidden="true" />
            Imprimir
          </Button>
        </div>
      </form>
    </Modal>
  );
}
