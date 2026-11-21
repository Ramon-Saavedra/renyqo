"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useOptionalProviderWorkspace } from "./scope-context";
import { providerWorkspaceHref } from "./navigation";

export function useProviderRouter() {
  const router = useRouter();
  const scope = useOptionalProviderWorkspace();
  return useMemo(() => {
    const bind = (href: string) =>
      scope && href.startsWith("/provider/")
        ? providerWorkspaceHref(href, scope.current.workspace.id)
        : href;
    return {
      ...router,
      push: (...[href, options]: Parameters<typeof router.push>) => {
        if (!scope?.requestOptions?.signal?.aborted)
          options ? router.push(bind(href), options) : router.push(bind(href));
      },
      replace: (...[href, options]: Parameters<typeof router.replace>) => {
        if (!scope?.requestOptions?.signal?.aborted) {
          if (options) router.replace(bind(href), options);
          else router.replace(bind(href));
        }
      },
    };
  }, [router, scope]);
}
