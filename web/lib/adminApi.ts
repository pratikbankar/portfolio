/** Browser client for the admin API. All calls go to this origin and are proxied to the API. */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Field name to message, for validation errors. */
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** A plain object is sent as JSON; FormData is sent as a file upload. */
  body?: unknown;
}

const LOGIN_PATH = '/admin/login';

export async function api<T = unknown>(path: string, { method = 'GET', body }: Options = {}): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {},
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }

  const data = await res.json().catch(() => null);
  if (res.ok) return data as T;

  // An expired session goes back to the login page rather than leaving an empty screen.
  if (res.status === 401 && window.location.pathname !== LOGIN_PATH) {
    // A full page load on purpose: it discards every piece of admin state held in memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(LOGIN_PATH);
  }

  const error = data?.error as { message?: string; details?: Array<{ path: string; message: string }> } | undefined;
  if (!error?.message) {
    throw new ApiError(res.status, `Server error (${res.status}). The server may be waking up; try again in a minute.`);
  }
  const fields = Object.fromEntries((error.details ?? []).map((d) => [d.path.split('.')[0], d.message]));
  throw new ApiError(res.status, error.message, fields);
}

export interface UploadedFile {
  id: string;
  contentType: string;
  filename: string;
}

export function uploadFile(file: File): Promise<UploadedFile> {
  const form = new FormData();
  form.append('file', file);
  return api<UploadedFile>('/admin/files', { method: 'POST', body: form });
}

export interface Dashboard {
  counts: Record<string, number>;
  unreadMessages: number;
  publishedAt: string | null;
  hasUnpublishedChanges: boolean;
}
