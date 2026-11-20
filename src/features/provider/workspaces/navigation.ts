export const WORKSPACE_QUERY = "workspaceId";

export function providerWorkspaceHref(
  path: string,
  workspaceId: string,
): string {
  const url = new URL(path, "https://renyqo.invalid");
  if (!url.pathname.startsWith("/provider/"))
    throw new Error("Expected provider path");
  url.searchParams.set(WORKSPACE_QUERY, workspaceId);
  return url.pathname + url.search + url.hash;
}
export function workspaceSwitchHref(workspaceId: string): string {
  return providerWorkspaceHref("/provider/dashboard", workspaceId);
}
