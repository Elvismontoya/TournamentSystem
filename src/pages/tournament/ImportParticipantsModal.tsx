import { Download, FileSpreadsheet, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError } from '../../api/client.ts';
import type { ImportPreview } from '../../api/types.ts';
import { Modal } from '../../components/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Field, Textarea } from '../../components/ui/form.tsx';

interface ImportParticipantsModalProps {
  open: boolean;
  onClose: () => void;
  /** Places still free in the tournament. */
  remaining: number;
  /** Asks the server how it reads the list (without importing). */
  onPreview: (text: string) => Promise<ImportPreview>;
  /** Imports on the server; rejects with ApiError (one detail per invalid line). */
  onImport: (text: string) => Promise<void>;
}

const TEMPLATE = 'Nombre, Delegación, Ranking\nCarlos Silva, Club Universitario, 2150\n';

/** Downloads a CSV with the expected columns. */
function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([TEMPLATE], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plantilla-jugadores.csv';
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Registers many players at once from a pasted list or a CSV file: one player per line,
 * "name, delegation, ranking". The Nr. is assigned in order (next free numbers).
 */
export function ImportParticipantsModal({
  open,
  onClose,
  remaining,
  onPreview,
  onImport,
}: ImportParticipantsModalProps) {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  // How the server reads the current text (refreshed shortly after typing stops).
  const [preview, setPreview] = useState<ImportPreview>({ players: [], errors: [] });
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    if (text.trim() === '') return;
    let active = true;
    const timer = setTimeout(() => {
      onPreview(text).then(
        (result) => {
          if (active) setPreview(result);
        },
        (failure: unknown) => {
          if (active) {
            setImportError(failure instanceof ApiError ? failure.message : 'Error inesperado.');
          }
        },
      );
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // onPreview is recreated on every render; the preview only depends on the text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const { players, errors } = text.trim() === '' ? { players: [], errors: [] } : preview;
  const overCapacity = players.length > remaining;
  const canImport = players.length > 0 && errors.length === 0 && !overCapacity && !importing;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Importar lista de jugadores"
      description="Sube un archivo CSV o pega la lista: una fila por jugador."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!canImport) return;
          setImporting(true);
          setImportError(null);
          onImport(text).then(onClose, (failure: unknown) => {
            setImporting(false);
            setImportError(failure instanceof ApiError ? failure.message : 'No se pudo importar.');
          });
        }}
        className="space-y-5"
      >
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-700 bg-neutral-850 px-6 py-8 text-center transition-colors focus-within:border-primary-500 hover:border-primary-500/60">
          <span className="grid size-11 place-items-center rounded-xl bg-primary-500/15 text-primary-300">
            <FileSpreadsheet className="size-5" aria-hidden="true" />
          </span>
          <span className="font-display text-sm font-medium text-white">
            {fileName ?? 'Elige un archivo CSV'}
          </span>
          <span className="text-xs text-neutral-500">
            Desde Excel: Archivo → Guardar como → CSV · máximo 2 MB
          </span>
          <input
            type="file"
            name="file"
            accept=".csv,.txt,text/csv,text/plain"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setFileName(file.name);
              void file.text().then(setText);
            }}
          />
        </label>

        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="h-px flex-1 bg-neutral-800" />o pega la lista
          <span className="h-px flex-1 bg-neutral-800" />
        </div>

        <Field
          id="import-text"
          label="Lista de jugadores"
          hint="Formato: nombre, delegación, puntos de ranking. La delegación y los puntos son opcionales; el Nr. se asigna en orden."
        >
          <Textarea
            id="import-text"
            name="list"
            rows={6}
            aria-describedby="import-text-hint"
            className="font-mono"
            placeholder={'Carlos Silva, Club Universitario, 2150\nMarcos Ruiz, TM Los Andes, 2080'}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
            }}
          />
        </Field>

        {(errors.length > 0 || overCapacity) && (
          <ul className="flex flex-col gap-1 rounded-xl border border-tertiary-500/40 bg-tertiary-500/10 px-4 py-3 text-sm text-tertiary-200">
            {overCapacity && (
              <li className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                La lista tiene {players.length} jugadores y solo quedan {remaining} cupos.
              </li>
            )}
            {errors.slice(0, 5).map((error) => (
              <li key={error} className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {error}
              </li>
            ))}
            {errors.length > 5 && <li className="pl-6">y {errors.length - 5} líneas más.</li>}
          </ul>
        )}

        {importError && (
          <p role="alert" className="text-sm text-red-300">
            {importError}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-300 hover:underline"
          >
            <Download className="size-4" aria-hidden="true" />
            Descargar plantilla
          </button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canImport}>
              {players.length > 0
                ? `Importar ${String(players.length)} ${players.length === 1 ? 'jugador' : 'jugadores'}`
                : 'Importar'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
