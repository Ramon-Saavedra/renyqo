import { API_URL } from "@/lib/env";

export type ApiErrorKind = "http" | "network" | "timeout" | "cancelled";

export interface ApiRequestOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;

  constructor(status: number, message: string, kind: ApiErrorKind = "http") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = kind;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message[0] ?? "";
    return data.message ?? "";
  } catch {
    return "";
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
): Promise<T> {
  const context = createRequestContext(options);

  try {
    let res: Response;
    try {
      res = await fetch(`${API_URL}${path}`, {
        ...init,
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
      const message = await parseErrorMessage(res);
      throw new ApiError(res.status, message, "http");
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
