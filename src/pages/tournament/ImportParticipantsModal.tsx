import {
  CircleCheck,
  Download,
  FileSpreadsheet,
  Info,
  LoaderCircle,
  TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';
import { ApiError } from '../../api/client.ts';
import type { CategoryMap, ImportPreview } from '../../api/types.ts';
import { Modal } from '../../components/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { PLAYER_FILE_ACCEPT, readPlayerFile } from '../../features/participants/readPlayerFile.ts';

interface ImportParticipantsModalProps {
  open: boolean;
  onClose: () => void;
  /** The tournament's categories: where each category of the file can go. */
  categories: string[];
  /** Asks the server how it reads the rows (without importing). */
  onPreview: (rows: string[][], categoryMap: CategoryMap) => Promise<ImportPreview>;
  /** Imports on the server; rejects with ApiError (one detail per problem). */
  onImport: (rows: string[][], categoryMap: CategoryMap) => Promise<void>;
}

/** Columns of the federation's spreadsheet (the template). */
const TEMPLATE_ROWS = [
  ['NUMBER', 'NOMBRE', 'LIGA', 'CÓDIGO', 'GÉNERO', 'RK_POINTS', 'IND', 'CATEG'],
  ['1', 'Vanesa Mazo Cardona', 'AMAGÁ', 'AMAGÁ', 'F', '', 'X', 'Sub 19'],
  ['2', 'Martín Puerta Cortes', 'AMAGÁ', 'AMAGÁ', 'M', '1500', 'X', 'Sub 19'],
];

/** Downloads an Excel template with the expected columns. */
async function downloadTemplate() {
  const XLSX = await import('xlsx');
  const sheet = XLSX.utils.aoa_to_sheet(TEMPLATE_ROWS);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Jugadores');
  XLSX.writeFile(book, 'plantilla-jugadores.xlsx');
}

/** "Sub 19: 30 · Sub 16: 12" (players to import, by tournament category). */
function categoriesOf({ players }: ImportPreview): string {
  const counts = new Map<string, number>();
  for (const player of players) {
    const name = player.category ?? 'Sin categoría';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts].map(([name, count]) => `${name}: ${String(count)}`).join(' · ');
}

/** Value of the "don't import" option in the category selects. */
const SKIP = '__skip__';

/**
 * Registers many players at once from an Excel or CSV file (no manual editing), with the
 * federation's columns: number, name, league, gender, RK_POINTS and category, found by their
 * header in any order. Each category of the file goes to one of the tournament's categories
 * (or isn't imported): categories never mix. For now only the individual event: rows without
 * an X in IND are skipped and DB, DX and TEAM are ignored.
 */
export function ImportParticipantsModal({
  open,
  onClose,
  categories,
  onPreview,
  onImport,
}: ImportParticipantsModalProps) {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [categoryMap, setCategoryMap] = useState<CategoryMap>({});
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const read = async (next: string[][], map: CategoryMap) => {
    setReading(true);
    setImportError(null);
    try {
      setPreview(await onPreview(next, map));
    } catch (failure) {
      setImportError(failure instanceof Error ? failure.message : 'No se pudo leer el archivo.');
    } finally {
      setReading(false);
    }
  };

  const choose = async (file: File) => {
    setFileName(file.name);
    setPreview(null);
    setRows(null);
    setCategoryMap({});
    setImportError(null);
    setReading(true);
    try {
      const fileRows = await readPlayerFile(file);
      setRows(fileRows);
      await read(fileRows, {});
    } catch (failure) {
      setImportError(failure instanceof Error ? failure.message : 'No se pudo leer el archivo.');
      setReading(false);
    }
  };

  /** Where a category of the file goes ("" = not chosen yet). */
  const assign = (fileCategory: string, value: string) => {
    if (!rows) return;
    const next: CategoryMap = Object.fromEntries(
      Object.entries(categoryMap).filter(([name]) => name !== fileCategory),
    );
    if (value !== '') next[fileCategory] = value === SKIP ? null : value;
    setCategoryMap(next);
    void read(rows, next);
  };

  const players = preview?.players ?? [];
  const errors = preview?.errors ?? [];
  const fileCategories = preview?.fileCategories ?? [];
  // Unassigned categories are solved with the selects above, not in the file.
  const fileErrors = errors.filter((error) => !error.startsWith('Elige a qué categoría'));
  const canImport =
    rows !== null && players.length > 0 && errors.length === 0 && !importing && !reading;
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Importar lista de jugadores"
      description="Sube el Excel (o CSV) de inscripciones: una fila por jugador."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!canImport) return;
          setImporting(true);
          setImportError(null);
          onImport(rows, categoryMap).then(onClose, (failure: unknown) => {
            setImporting(false);
            setImportError(failure instanceof ApiError ? failure.message : 'No se pudo importar.');
          });
        }}
        className="space-y-5"
      >
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-700 bg-neutral-850 px-6 py-8 text-center transition-colors focus-within:border-primary-500 hover:border-primary-500/60">
          <span className="grid size-11 place-items-center rounded-xl bg-primary-500/15 text-primary-300">
            {reading ? (
              <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <FileSpreadsheet className="size-5" aria-hidden="true" />
            )}
          </span>
          <span className="font-display text-sm font-medium text-white">
            {fileName ?? 'Elige un archivo de Excel o CSV'}
          </span>
          <span className="text-xs text-neutral-500">
            .xlsx, .xls o .csv · se lee la primera hoja · máximo 2 MB
          </span>
          <input
            type="file"
            name="file"
            accept={PLAYER_FILE_ACCEPT}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void choose(file);
              // Choosing the same file again (after fixing it) reads it again.
              event.target.value = '';
            }}
          />
        </label>

        <div className="rounded-xl border border-neutral-800 px-4 py-3 text-xs text-neutral-400">
          <p className="font-medium text-neutral-300">Columnas que se leen (por su título):</p>
          <p className="mt-1">
            <strong className="text-neutral-200">NUMBER</strong> (Nr.) ·{' '}
            <strong className="text-neutral-200">NOMBRE</strong> ·{' '}
            <strong className="text-neutral-200">LIGA</strong> (o CÓDIGO) ·{' '}
            <strong className="text-neutral-200">GÉNERO</strong> (F/M) ·{' '}
            <strong className="text-neutral-200">RK_POINTS</strong> (ranking) ·{' '}
            <strong className="text-neutral-200">CATEG</strong> ·{' '}
            <strong className="text-neutral-200">IND</strong> (X).
          </p>
          <p className="mt-1">
            Por ahora solo se importa individual: las filas sin X en IND se omiten y las columnas
            DB, DX y TEAM no se tienen en cuenta.
          </p>
        </div>

        {fileCategories.length > 0 && (
          <fieldset className="rounded-xl border border-primary-500/30 bg-primary-500/5 px-4 py-3">
            <legend className="px-1 font-display text-sm font-medium text-neutral-200">
              Categorías del archivo
            </legend>
            <p className="text-xs text-neutral-400">
              Cada categoría juega aparte: elige a cuál del torneo va cada una (o «No importar»).
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {fileCategories.map((entry) => {
                const id = `import-category-${entry.name || 'none'}`;
                const value = !entry.assigned ? '' : (entry.target ?? SKIP);
                return (
                  <li key={entry.name} className="grid items-center gap-2 sm:grid-cols-[1fr_14rem]">
                    <label htmlFor={id} className="text-sm text-neutral-200">
                      <strong className="font-medium">{entry.name || 'Sin categoría'}</strong>{' '}
                      <span className="text-neutral-500">
                        ({entry.count} {entry.count === 1 ? 'jugador' : 'jugadores'})
                      </span>
                    </label>
                    <select
                      id={id}
                      value={value}
                      disabled={reading}
                      onChange={(event) => {
                        assign(entry.name, event.target.value);
                      }}
                      className={`h-9 w-full rounded-lg border bg-neutral-850 px-2 text-sm text-neutral-100 focus:border-primary-500 focus:outline-none ${
                        entry.assigned ? 'border-neutral-700' : 'border-tertiary-500/60'
                      }`}
                    >
                      <option value="" disabled>
                        Elegir categoría…
                      </option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                      <option value={SKIP}>No importar</option>
                    </select>
                  </li>
                );
              })}
            </ul>
            {preview && preview.skippedByCategory > 0 && (
              <p className="mt-2 text-xs text-neutral-500">
                {preview.skippedByCategory}{' '}
                {preview.skippedByCategory === 1
                  ? 'jugador no se importa'
                  : 'jugadores no se importan'}{' '}
                (categorías marcadas «No importar»).
              </p>
            )}
          </fieldset>
        )}

        {preview && players.length > 0 && errors.length === 0 && (
          <div
            role="status"
            className="rounded-xl border border-secondary-500/30 bg-secondary-500/10 px-4 py-3 text-sm text-secondary-200"
          >
            <p className="flex items-center gap-2 font-medium">
              <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
              Se leyeron {players.length} {players.length === 1 ? 'jugador' : 'jugadores'} de
              individual.
            </p>
            <p className="mt-1 pl-6 text-xs text-secondary-300">{categoriesOf(preview)}</p>
          </div>
        )}

        {preview && preview.skipped > 0 && (
          <p className="flex items-start gap-2 text-xs text-neutral-400">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {preview.skipped === 1
              ? '1 fila sin X en IND no se importa'
              : `${String(preview.skipped)} filas sin X en IND no se importan`}{' '}
            (juegan solo dobles o equipos).
          </p>
        )}

        {fileErrors.length > 0 && (
          <div className="rounded-xl border border-tertiary-500/40 bg-tertiary-500/10 px-4 py-3 text-sm text-tertiary-200">
            <p className="font-medium">Corrige esto en el archivo y vuelve a elegirlo:</p>
            <ul className="mt-2 flex max-h-48 flex-col gap-1 overflow-y-auto">
              {fileErrors.map((error) => (
                <li key={error} className="flex items-start gap-2">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {importError && (
          <p role="alert" className="text-sm text-red-300">
            {importError}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              void downloadTemplate();
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-300 hover:underline"
          >
            <Download className="size-4" aria-hidden="true" />
            Descargar plantilla (Excel)
          </button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canImport}>
              {importing && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
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
