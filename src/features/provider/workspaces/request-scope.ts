import type { ApiRequestOptions } from "@/lib/api/client";

/** Immutable request binding. Never consults the currently selected URL or global state. */
export function workspaceRequestOptions(
  workspaceId: string,
  signal: AbortSignal,
): ApiRequestOptions {
  if (!workspaceId) throw new Error("Provider workspace required");
  return Object.freeze({
    headers: Object.freeze({ "x-workspace-id": workspaceId }),
    signal,
  });
}

export function mergeRequestOptions(
  scope: ApiRequestOptions,
  request?: ApiRequestOptions,
): ApiRequestOptions {
  const headers = new Headers(request?.headers);
  new Headers(scope.headers).forEach((value, key) => headers.set(key, value));
  return {
    ...request,
    headers,
    ...((scope.signal ?? request?.signal)
      ? {
          signal:
            scope.signal && request?.signal
              ? AbortSignal.any([scope.signal, request.signal])
              : (scope.signal ?? request?.signal)!,
        }
      : {}),
  };
}

export function withProviderOptions(
  scope: ApiRequestOptions | undefined,
  request?: ApiRequestOptions,
): ApiRequestOptions | undefined {
  return scope ? mergeRequestOptions(scope, request) : request;
}
