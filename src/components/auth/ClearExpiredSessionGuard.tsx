"use client";

import { invalidateCurrentUser } from "@/lib/api/use-current-user";

interface ClearExpiredSessionGuardProps {
  children: React.ReactNode;
  expired: boolean;
}

/**
 * When the proxy detects a 401 from /auth/me on a protected route,
 * it redirects to /login?session=expired.  This component clears the
 * stale frontend auth cache *during render* so that any descendant
 * that reads the user (e.g. AuthenticatedPublicRedirect) sees a
 * clean state before performing its own redirect logic.
 *
 * IMPORTANT — render-phase side effect:
 * invalidateCurrentUser() is called during the render function, not
 * inside useEffect.  This is intentional: the cache must be cleared
 * BEFORE React renders any descendant component.  If this component
 * is ever moved inside AuthenticatedPublicRedirect, the stale-auth
 * loop will return.
 */
export function ClearExpiredSessionGuard({
  children,
  expired,
}: ClearExpiredSessionGuardProps) {
  if (expired) {
    invalidateCurrentUser();
  }

  return <>{children}</>;
}
