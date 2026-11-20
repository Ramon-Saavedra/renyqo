"use client";
import type { ReactNode } from "react";
import { FormAlert } from "@/components/ui/form/FormAlert";
import { useProviderWorkspace } from "./scope-context";
export function ListingCreationGate({ children }: { children: ReactNode }) {
  const { current } = useProviderWorkspace();
  if (current.actions.createListing.allowed) return children;
  return (
    <FormAlert
      variant="error"
      message="Neue Objekte können in diesem Arbeitsbereich derzeit nicht erstellt werden."
    />
  );
}
