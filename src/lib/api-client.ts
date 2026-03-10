export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  // For 204 No Content, return empty
  if (res.status === 204) {
    return undefined as T;
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) {
      throw new ApiError("Request failed", res.status);
    }
    return undefined as T;
  }

  if (!res.ok) {
    const body = data as { error?: string; code?: string };
    throw new ApiError(
      body?.error ?? "Request failed",
      res.status,
      body?.code
    );
  }

  return data as T;
}

export const apiClient = {
  get: <T = unknown>(url: string) => request<T>(url),

  post: <T = unknown>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T = unknown>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T = unknown>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(url: string) =>
    request<T>(url, { method: "DELETE" }),
};
