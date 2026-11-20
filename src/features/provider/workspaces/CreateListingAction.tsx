"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { useOptionalProviderWorkspace } from "./scope-context";
import { providerWorkspaceHref } from "./navigation";

export function CreateListingAction({ className }: { className?: string }) {
  const scope = useOptionalProviderWorkspace();
  const action = scope?.current.actions.createListing;
  if (!action || (!action.allowed && action.reason === "NOT_PERMITTED"))
    return null;
  const label = (
    <>
      <AppIcon icon={Plus} size={15} strokeWidth={1.7} decorative />
      <span className="hidden sm:inline">Neues Mietobjekt</span>
    </>
  );
  if (!action.allowed)
    return (
      <button
        type="button"
        disabled
        className={className}
        aria-label="Neues Mietobjekt – derzeit nicht verfügbar"
        title="Neue Objekte können derzeit nicht erstellt werden."
      >
        {label}
      </button>
    );
  return (
    <Link
      href={providerWorkspaceHref(
        "/provider/listings/new",
        scope!.current.workspace.id,
      )}
      className={className}
      aria-label="Neues Mietobjekt"
    >
      {label}
    </Link>
  );
}
