// Reads a player list file (Excel or CSV) into rows of cell texts, as in its first sheet.
// The server finds the columns by their headers (NUMBER, NOMBRE, LIGA, GENERO, TEAM, IND,
// DB, DX, CATEG…) and checks everything. SheetJS reads every format (CSV included); it is
// loaded only when a file is chosen (it is a large library).

/** File types offered by the file picker. */
export const PLAYER_FILE_ACCEPT =
  '.xlsx,.xlsm,.xls,.ods,.csv,.txt,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';

/** A cell as text: whole numbers without decimals (2150, not 2150.0), the rest trimmed. */
function cellText(value: unknown): string {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : String(Math.round(value));
  }
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'boolean') return value ? 'X' : '';
  return ''; // empty cells (and anything else)
}

/** Rows of the first sheet (empty rows included, so row numbers match the sheet's). */
export async function readPlayerFile(file: File): Promise<string[][]> {
  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const firstSheet = workbook.SheetNames.at(0);
    const sheet = firstSheet === undefined ? undefined : workbook.Sheets[firstSheet];
    if (!sheet) throw new Error('empty');
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      blankrows: true,
      defval: '',
      raw: true,
    });
    return rows.map((row) => row.map(cellText));
  } catch {
    throw new Error('No se pudo leer el archivo. Usa un Excel (.xlsx, .xls) o un CSV.');
  }
}
