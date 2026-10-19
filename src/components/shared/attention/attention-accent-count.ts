import type { AttentionIconGroupId } from "@/lib/attention/chips";


export function attentionIconGroupUsesAccentCount(
  id: AttentionIconGroupId,
): boolean {
  return id === "messages" || id === "file-upload";
}
