export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function createApi(appId: string) {
  const base = `/api/${appId}`;

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const init: RequestInit = { method };
    if (body !== undefined) {
      init.headers = { "content-type": "application/json" };
      init.body = JSON.stringify(body);
    }
    const response = await fetch(base + path, init);
    if (!response.ok) throw new ApiError(response.status, await response.text());
    return (await response.json()) as T;
  }

  return {
    get: <T>(path: string) => request<T>("GET", path),
    post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
    put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
    delete: <T>(path: string) => request<T>("DELETE", path),
  };
}

export function createStorage(appId: string) {
  const prefix = `toolkit:${appId}:`;

  return {
    get<T>(key: string, fallback: T): T {
      try {
        const raw = localStorage.getItem(prefix + key);
        return raw === null ? fallback : (JSON.parse(raw) as T);
      } catch {
        return fallback;
      }
    },
    set(key: string, value: unknown): void {
      try {
        localStorage.setItem(prefix + key, JSON.stringify(value));
      } catch {
        // Not persisted; the in-memory state still works for this session.
      }
    },
    remove(key: string): void {
      try {
        localStorage.removeItem(prefix + key);
      } catch {
        // Nothing to clean up if storage is unavailable.
      }
    },
  };
}
