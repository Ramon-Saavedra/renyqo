import { z } from "zod";
import { apiGet, type ApiRequestOptions } from "@/lib/api/client";
import {
  currentWorkspaceSchema,
  discoverableWorkspaceSchema,
} from "./contracts";

export async function discoverWorkspaces(signal: AbortSignal) {
  return z
    .array(discoverableWorkspaceSchema)
    .parse(await apiGet<unknown>("/api/v1/provider/workspaces", { signal }));
}
export async function readCurrentWorkspace(options: ApiRequestOptions) {
  return currentWorkspaceSchema.parse(
    await apiGet<unknown>("/api/v1/provider/workspaces/current", options),
  );
}
