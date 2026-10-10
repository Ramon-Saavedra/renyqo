"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { applicationsCopy } from "../../copy";
import { useApplicantWorkspace } from "../../hooks/useApplicantWorkspace";
import { ApplicationMessage } from "../ApplicationMessage";
import { WorkspaceContent } from "./WorkspaceContent";

const copy = applicationsCopy.workspace;

const OVERVIEW_PATH = "/applicant/applications";

function WorkspaceSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-5">
      <span className="sr-only">{copy.loading}</span>
      <RenyqoSkeleton variant="box" className="h-36 w-full" />
      <RenyqoSkeleton variant="box" className="h-28 w-full" />
      <div className="grid gap-5 lg:grid-cols-5">
        <RenyqoSkeleton variant="box" className="h-72 w-full lg:col-span-3" />
        <RenyqoSkeleton variant="box" className="h-72 w-full lg:col-span-2" />
      </div>
    </div>
  );
}

function WorkspaceMessage({
  title,
  text,
  onRetry,
}: {
  readonly title: string;
  readonly text?: string;
  readonly onRetry?: () => void;
}) {
  return (
    <div role="alert">
      <ApplicationMessage
        title={title}
        {...(text ? { text } : {})}
        action={
          onRetry ? (
            <Button variant="outline" onClick={onRetry}>
              {copy.retry}
            </Button>
          ) : (
            <Link href={OVERVIEW_PATH} className={buttonClass("outline")}>
              {copy.back}
            </Link>
          )
        }
      />
    </div>
  );
}

export function ApplicationWorkspace({
  applicationId,
}: {
  readonly applicationId: string;
}) {
  const { state, refresh, retry } = useApplicantWorkspace(applicationId);

  return (
    <div className="px-0 pt-8 sm:px-gutter">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <Link href={OVERVIEW_PATH} className={buttonClass("ghost", "w-fit")}>
          <AppIcon icon={ArrowLeft} size={15} decorative />
          {copy.back}
        </Link>
        {state.status === "loading" ? <WorkspaceSkeleton /> : null}
        {state.status === "not-found" ? (
          <WorkspaceMessage
            title={copy.notFoundTitle}
            text={copy.notFoundText}
          />
        ) : null}
        {state.status === "error" ? (
          <WorkspaceMessage
            title={
              state.reason === "contract" ? copy.contractError : copy.loadError
            }
            onRetry={retry}
          />
        ) : null}
        {state.status === "ready" ? (
          <>
            {state.refreshFailed ? (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-caption text-warning"
              >
                <span>{copy.refreshError}</span>
                <Button variant="ghost" onClick={refresh}>
                  {copy.retry}
                </Button>
              </div>
            ) : null}
            <WorkspaceContent
              key={state.workspace.application.id}
              workspace={state.workspace}
              refresh={refresh}
              acceptedGeneration={state.acceptedGeneration}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
