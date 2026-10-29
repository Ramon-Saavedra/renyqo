import type { DeepLink } from "./deep-link";

const HIGHLIGHT_MS = 1800;

function escapeValue(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`);
}

function isShown(element: HTMLElement): boolean {
  return element.isConnected && element.closest("[hidden]") === null;
}

function findExact(link: DeepLink): HTMLElement | null {
  const selectors = [
    link.requestId
      ? `[data-request-id="${escapeValue(link.requestId)}"]`
      : null,
    link.proposalId
      ? `[data-proposal-id="${escapeValue(link.proposalId)}"]`
      : null,
    link.appointmentId
      ? `[data-appointment-id="${escapeValue(link.appointmentId)}"]`
      : null,
    link.viewingId
      ? `[data-viewing-id="${escapeValue(link.viewingId)}"]`
      : null,
    link.activityId
      ? `[data-activity-id="${escapeValue(link.activityId)}"]`
      : null,
  ];
  for (const selector of selectors) {
    if (!selector) continue;
    const node = document.querySelector(selector);
    if (node instanceof HTMLElement && isShown(node)) return node;
  }
  return null;
}

function findSection(section: DeepLink["section"]): HTMLElement | null {
  if (!section) return null;
  const nodes = document.querySelectorAll(`[data-section="${section}"]`);
  for (const node of nodes) {
    if (node instanceof HTMLElement && isShown(node)) return node;
  }
  return null;
}

/** Scrolls the linked section or exact rendered block. Returns false while an activity row is still missing. */
export function focusDeepLink(link: DeepLink): boolean {
  const exact = findExact(link);
  const section = findSection(link.section);
  const target = exact ?? section;
  if (!(target instanceof HTMLElement)) return link.activityId === null;
  if (typeof target.scrollIntoView === "function") {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  target.classList.add("ring-2", "ring-primary");
  window.setTimeout(() => {
    target.classList.remove("ring-2", "ring-primary");
  }, HIGHLIGHT_MS);
  if (link.activityId && !exact) return false;
  return true;
}
