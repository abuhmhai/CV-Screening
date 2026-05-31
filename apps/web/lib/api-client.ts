const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

function buildHeaders(token?: string | null, extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extra as Record<string, string>)
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<ApiResult<T>> {
  const { token, ...init } = options;
  try {
    const response = await fetch(`${apiBase}/api/v1${path}`, {
      ...init,
      headers: buildHeaders(token, init.headers),
      cache: "no-store"
    });

    if (!response.ok) {
      let error = response.statusText;
      try {
        const body = (await response.json()) as { message?: string | string[] };
        if (Array.isArray(body.message)) error = body.message.join(", ");
        else if (body.message) error = body.message;
      } catch {
        /* ignore */
      }
      return { ok: false, error, status: response.status };
    }

    if (response.status === 204) {
      return { ok: true, status: response.status };
    }

    const data = (await response.json()) as T;
    return { ok: true, data, status: response.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: message };
  }
}

export function getApiBase(): string {
  return apiBase;
}
