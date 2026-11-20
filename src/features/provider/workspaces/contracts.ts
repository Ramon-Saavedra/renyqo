import { z } from "zod";

export const discoverableWorkspaceSchema = z.object({
  workspaceId: z.string().uuid(),
  membershipId: z.string().uuid(),
  role: z.enum(["OWNER", "AGENT"]),
  kind: z.enum(["PERSONAL", "ORGANIZATION"]),
  displayName: z.string().min(1),
});
export const currentWorkspaceSchema = z.object({
  workspace: z.object({
    id: z.string().uuid(),
    displayName: z.string().min(1),
    kind: z.enum(["PERSONAL", "ORGANIZATION"]),
  }),
  membership: z.object({
    id: z.string().uuid(),
    role: z.enum(["OWNER", "AGENT"]),
    colorId: z.string().min(1),
  }),
  actions: z.object({
    createListing: z.union([
      z.object({ allowed: z.literal(true), reason: z.null() }),
      z.object({
        allowed: z.literal(false),
        reason: z.enum(["NOT_PERMITTED", "WORKSPACE_GROWTH_UNAVAILABLE"]),
      }),
    ]),
    reorderListings: z.object({ allowed: z.boolean() }),
  }),
});
export type DiscoverableWorkspace = z.infer<typeof discoverableWorkspaceSchema>;
export type CurrentWorkspace = z.infer<typeof currentWorkspaceSchema>;
