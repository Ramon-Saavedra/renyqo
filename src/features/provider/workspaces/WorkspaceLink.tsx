"use client";
import Link from "next/link";
import type { ComponentProps } from "react";
import { useOptionalProviderWorkspace } from "./scope-context";
import { providerWorkspaceHref } from "./navigation";

export default function WorkspaceLink({
  href,
  ...props
}: ComponentProps<typeof Link>) {
  const scope = useOptionalProviderWorkspace();
  const bound =
    scope && typeof href === "string" && href.startsWith("/provider/")
      ? providerWorkspaceHref(href, scope.current.workspace.id)
      : href;
  return <Link {...props} href={bound} />;
}
