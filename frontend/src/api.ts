export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "") ?? "";

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  token?: string;
  body?: unknown;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { token, body, headers: requestHeaders, ...requestOptions } = options;
  const headers = new Headers(requestHeaders);
  headers.set("Accept", "application/json");
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(apiUrl(path), {
    ...requestOptions,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  let payload: unknown;
  if (response.status !== 204) {
    try {
      payload = await response.json();
    } catch {
      if (response.ok) {
        throw new ApiError("The server returned an unreadable response.", response.status);
      }
    }
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : response.statusText || "The API request failed.";
    throw new ApiError(message, response.status);
  }

  return payload as T;
}
