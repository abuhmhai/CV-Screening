const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function fetchApi<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiBase}/api/v1${path}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      return fallback;
    }
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}
