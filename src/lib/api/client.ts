import { API_URL } from "@/lib/env";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
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

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Netzwerkfehler");
  }
  if (!res.ok) {
    const message = await parseErrorMessage(res);
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export async function apiPostVoid(path: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    throw new ApiError(0, "Netzwerkfehler");
  }
  if (!res.ok) {
    const message = await parseErrorMessage(res);
    throw new ApiError(res.status, message);
  }
}

export async function apiPostFormData<T>(
  path: string,
  body: FormData,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      body,
    });
  } catch {
    throw new ApiError(0, "Netzwerkfehler");
  }
  if (!res.ok) {
    const message = await parseErrorMessage(res);
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Netzwerkfehler");
  }
  if (!res.ok) {
    const message = await parseErrorMessage(res);
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export async function apiPatchVoid(path: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "PATCH",
      credentials: "include",
    });
  } catch {
    throw new ApiError(0, "Netzwerkfehler");
  }
  if (!res.ok) {
    const message = await parseErrorMessage(res);
    throw new ApiError(res.status, message);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "GET",
      credentials: "include",
    });
  } catch {
    throw new ApiError(0, "Netzwerkfehler");
  }
  if (!res.ok) {
    const message = await parseErrorMessage(res);
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}
