// HTTP client for TournamentSystem-backend. In development Vite forwards /api to the backend
// (vite.config.ts); in production set VITE_API_URL to the backend's URL (…/api).

const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

/** Error answered by the API (or a network failure), with a message ready to show. */
export class ApiError extends Error {
  readonly status: number;
  /** Extra detail, e.g. one message per invalid line of an imported list. */
  readonly details: string[];

  constructor(status: number, message: string, details: string[] = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const UNREACHABLE =
  'No se pudo conectar con el servidor. Revisa que el backend (TournamentSystem-backend) esté corriendo.';

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, UNREACHABLE);
  }

  // 204 No Content (e.g. a delete) has no body.
  const data =
    response.status === 204 ? null : ((await response.json().catch(() => null)) as unknown);
  if (!response.ok) {
    const error =
      typeof data === 'object' && data !== null
        ? (data as { error?: unknown; details?: unknown })
        : {};
    if (typeof error.error !== 'string' && [502, 503, 504].includes(response.status)) {
      // No answer from the API itself (e.g. Vite's dev proxy with the backend stopped).
      throw new ApiError(response.status, UNREACHABLE);
    }
    throw new ApiError(
      response.status,
      typeof error.error === 'string'
        ? error.error
        : `Error del servidor (${String(response.status)}).`,
      Array.isArray(error.details) ? error.details.map(String) : [],
    );
  }
  return data as T;
}
