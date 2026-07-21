import type { SafeUser } from "@/lib/api/auth";
import { getFirstName } from "@/lib/utils/user-name";
import { providerEmptyStateCopy } from "../copy/empty-state";

const welcome = providerEmptyStateCopy.hero.welcome;

export function buildWelcomeGreeting(user: SafeUser | null): string {
  if (!user) return welcome.fallback;

  const firstName = getFirstName(user.name);
  if (!firstName) return welcome.fallback;

  const companyName = user.companyName?.trim();
  if (user.providerType === "company" && companyName) {
    return welcome.company(firstName, companyName);
  }

  return welcome.private(firstName);
}
