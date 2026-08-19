import { API_URL } from "@/lib/env";
import { clearCsrfToken, csrfTokenPath, getCsrfToken } from "./csrf";

export type ApiErrorKind = "http" | "network" | "timeout" | "cancelled";

export interface ApiRequestOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly code: string | null;

  constructor(
    status: number,
    message: string,
    kind: ApiErrorKind = "http",
    code: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = kind;
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

async function parseErrorDetails(
  res: Response,
): Promise<{ message: string; code: string | null }> {
  try {
    const data = (await res.json()) as {
      message?: string | string[];
      code?: string;
    };
    const message = Array.isArray(data.message)
      ? (data.message[0] ?? "")
      : (data.message ?? "");
    return { message, code: data.code ?? null };
  } catch {
    return { message: "", code: null };
  }
}

interface RequestContext {
  signal: AbortSignal;
  cleanup: () => void;
  getAbortKind: () => "timeout" | "cancelled" | null;
}

function createRequestContext(options?: ApiRequestOptions): RequestContext {
  const controller = new AbortController();
  let timeoutTriggered = false;
  let cancellationTriggered = false;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => {
    timeoutTriggered = true;
    controller.abort();
  }, timeoutMs);

  const handleExternalAbort = () => {
    cancellationTriggered = true;
    controller.abort(options?.signal?.reason);
  };

  if (options?.signal) {
    if (options.signal.aborted) {
      handleExternalAbort();
    } else {
      options.signal.addEventListener("abort", handleExternalAbort, {
        once: true,
      });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      options?.signal?.removeEventListener("abort", handleExternalAbort);
    },
    getAbortKind: () => {
      if (timeoutTriggered) return "timeout";
      if (cancellationTriggered) return "cancelled";
      return null;
    },
  };
}

async function apiRequest<T>(
  path: string,
  init: RequestInit,
  options: ApiRequestOptions | undefined,
  parse: (response: Response) => Promise<T>,
  csrfRetryAttempt = 0,
): Promise<T> {
  const context = createRequestContext(options);

  try {
    const method = init.method?.toUpperCase() ?? "GET";
    const isMutating = !["GET", "HEAD", "OPTIONS"].includes(method);
    const isCsrfRequest = path === csrfTokenPath;
    const csrfToken =
      isMutating && !isCsrfRequest ? await getCsrfToken() : null;
    if (context.signal.aborted) {
      throw new ApiError(0, "Anfrage abgebrochen", "cancelled");
    }
    const headers = new Headers(init.headers);
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
    let res: Response;
    try {
      res = await fetch(`${API_URL}${path}`, {
        ...init,
        headers,
        signal: context.signal,
      });
    } catch {
      const abortKind = context.getAbortKind();
      if (abortKind === "timeout") {
        throw new ApiError(0, "Zeitüberschreitung", "timeout");
      }
      if (abortKind === "cancelled") {
        throw new ApiError(0, "Anfrage abgebrochen", "cancelled");
      }
      throw new ApiError(0, "Netzwerkfehler", "network");
    }

    if (!res.ok) {
      const details = await parseErrorDetails(res);
      if (
        res.status === 403 &&
        details.code === "CSRF_TOKEN_INVALID" &&
        csrfRetryAttempt === 0 &&
        isMutating &&
        !isCsrfRequest
      ) {
        clearCsrfToken();
        await getCsrfToken(true);
        return apiRequest(path, init, options, parse, 1);
      }
      throw new ApiError(res.status, details.message, "http", details.code);
    }

    return parse(res);
  } finally {
    context.cleanup();
  }
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest(
    path,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    options,
    (response) => response.json() as Promise<T>,
  );
}

export async function apiPostVoid(
  path: string,
  options?: ApiRequestOptions,
): Promise<void> {
  return apiRequest(
    path,
    { method: "POST", credentials: "include" },
    options,
    async () => undefined,
  );
}

export async function apiPostJsonVoid(
  path: string,
  body: unknown,
  options?: ApiRequestOptions,
): Promise<void> {
  return apiRequest(
    path,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    options,
    async () => undefined,
  );
}

export async function apiPostFormData<T>(
  path: string,
  body: FormData,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest(
    path,
    {
      method: "POST",
      credentials: "include",
      body,
    },
    options,
    (response) => response.json() as Promise<T>,
  );
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest(
    path,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    options,
    (response) => response.json() as Promise<T>,
  );
}

export async function apiPatchVoid(
  path: string,
  options?: ApiRequestOptions,
): Promise<void> {
  return apiRequest(
    path,
    { method: "PATCH", credentials: "include" },
    options,
    async () => undefined,
  );
}

export async function apiDelete<T>(
  path: string,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest(
    path,
    {
      method: "DELETE",
      credentials: "include",
    },
    options,
    (response) => response.json() as Promise<T>,
  );
}

export async function apiDeleteVoid(
  path: string,
  options?: ApiRequestOptions,
): Promise<void> {
  return apiRequest(
    path,
    { method: "DELETE", credentials: "include" },
    options,
    async () => undefined,
  );
}

export async function apiGet<T>(
  path: string,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest(
    path,
    {
      method: "GET",
      credentials: "include",
    },
    options,
    (response) => response.json() as Promise<T>,
  );
}
