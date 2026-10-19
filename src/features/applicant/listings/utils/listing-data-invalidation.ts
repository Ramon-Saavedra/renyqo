import { invalidateGlobalAttention } from "@/lib/attention/hooks/use-global-attention";

const EVENT_NAME = "renyqo:listing-application-changed";

export function invalidateListingApplicationData(): void {
  window.dispatchEvent(new Event(EVENT_NAME));
  invalidateGlobalAttention();
}

export function subscribeListingApplicationData(
  listener: () => void,
): () => void {
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
