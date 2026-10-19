"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonClass } from "@/components/ui/button/Button";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { applicationsCopy } from "../../copy";
import { useApplicationsOverview } from "../../hooks/useApplicationsOverview";
import {
  toOverviewCardModel,
  type OverviewCardModel,
} from "../../model/overview-card";
import type { OverviewGroup } from "../../model/status";
import { ApplicationMessage } from "../ApplicationMessage";
import { ApplicationCard } from "./ApplicationCard";
import {
  OverviewFilter,
  type OverviewFilterOption,
  type OverviewFilterValue,
} from "./OverviewFilter";

const copy = applicationsCopy.overview;

const GROUP_ORDER: readonly OverviewGroup[] = ["ACTIVE", "WAITING", "DONE"];

const CONTENT_CLASS = "px-gutter pt-10";
const INNER_CLASS = "mx-auto flex w-full max-w-5xl flex-col gap-6";
const TITLE_CLASS =
  "font-display text-heading-xl font-semibold text-foreground";

function OverviewHeader({ summary }: { readonly summary: string | null }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className={TITLE_CLASS}>{copy.title}</h1>
      {summary ? (
        <p className="text-lead text-foreground-secondary">{summary}</p>
      ) : null}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-2.5">
      <span className="sr-only">{copy.loading}</span>
      {[0, 1, 2].map((key) => (
        <RenyqoSkeleton key={key} variant="box" className="h-28 w-full" />
      ))}
    </div>
  );
}

function groupCards(
  cards: readonly OverviewCardModel[],
  filter: OverviewFilterValue,
): readonly {
  readonly group: OverviewGroup;
  readonly cards: readonly OverviewCardModel[];
}[] {
  return GROUP_ORDER.filter((group) => filter === "ALL" || filter === group)
    .map((group) => ({
      group,
      cards: cards.filter((card) => card.status.group === group),
    }))
    .filter((entry) => entry.cards.length > 0);
}

function filterCount(
  filter: OverviewFilterValue,
  counts: {
    readonly all: number;
    readonly active: number;
    readonly waiting: number;
    readonly done: number;
  },
): number {
  switch (filter) {
    case "ALL":
      return counts.all;
    case "ACTIVE":
      return counts.active;
    case "WAITING":
      return counts.waiting;
    case "DONE":
      return counts.done;
  }
}

function filterOptions(counts: {
  readonly all: number;
  readonly active: number;
  readonly waiting: number;
  readonly done: number;
}): readonly OverviewFilterOption[] {
  return [
    { value: "ALL", count: counts.all },
    { value: "ACTIVE", count: counts.active },
    { value: "WAITING", count: counts.waiting },
    { value: "DONE", count: counts.done },
  ];
}

export function ApplicationsOverview() {
  const [filter, setFilter] = useState<OverviewFilterValue>("ALL");
  const { state, counts, filterError, reload, loadMore } =
    useApplicationsOverview(filter);

  if (state.status === "loading" && counts === null) {
    return (
      <div className={CONTENT_CLASS}>
        <div className={INNER_CLASS}>
          <OverviewHeader summary={null} />
          <OverviewSkeleton />
        </div>
      </div>
    );
  }

  if (state.status === "error" && counts === null) {
    return (
      <div className={CONTENT_CLASS}>
        <div className={INNER_CLASS}>
          <OverviewHeader summary={null} />
          <div role="alert">
            <ApplicationMessage
              title={
                filterError === "contract" ? copy.contractError : copy.loadError
              }
              action={
                <Button variant="primary" onClick={reload}>
                  {copy.retry}
                </Button>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  const knownCounts = counts ?? {
    all: 0,
    active: 0,
    waiting: 0,
    done: 0,
  };

  if (knownCounts.all === 0 && state.status === "ready") {
    return (
      <div className={CONTENT_CLASS}>
        <div className={INNER_CLASS}>
          <OverviewHeader summary={null} />
          <ApplicationMessage
            title={copy.emptyTitle}
            text={copy.emptyText}
            action={
              <Link href="/listings" className={buttonClass("primary")}>
                {copy.emptyCta}
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const options = filterOptions(knownCounts);
  const filteredTotal = filterCount(filter, knownCounts);

  if (state.status === "loading" || state.status === "error") {
    return (
      <div className={CONTENT_CLASS}>
        <div className={INNER_CLASS}>
          <OverviewHeader summary={copy.summary(filteredTotal)} />
          <OverviewFilter
            value={filter}
            options={options}
            onChange={setFilter}
          />
          {state.status === "loading" ? (
            <OverviewSkeleton />
          ) : (
            <div role="alert">
              <ApplicationMessage
                title={
                  filterError === "contract"
                    ? copy.contractError
                    : copy.loadError
                }
                action={
                  <Button variant="primary" onClick={reload}>
                    {copy.retry}
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  const cards = state.items.map(toOverviewCardModel);
  const visibleCards =
    filter === "ALL"
      ? cards
      : cards.filter((card) => card.status.group === filter);
  const attention = visibleCards.filter((card) => card.needsAttention).length;
  const summary =
    state.nextCursor === null && attention > 0
      ? `${copy.summary(filteredTotal)} · ${copy.attention(attention)}`
      : copy.summary(filteredTotal);
  const groups = groupCards(cards, filter);

  return (
    <div className={CONTENT_CLASS}>
      <div className={INNER_CLASS}>
        <OverviewHeader summary={summary} />
        <OverviewFilter value={filter} options={options} onChange={setFilter} />
        {groups.length === 0 ? (
          <p className="text-body text-foreground-secondary">
            {copy.emptyFilter}
          </p>
        ) : (
          groups.map((entry) => (
            <section
              key={entry.group}
              aria-labelledby={`applications-group-${entry.group}`}
              className="flex flex-col gap-2.5"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <h2
                  id={`applications-group-${entry.group}`}
                  className="font-display text-meta font-semibold uppercase text-foreground-secondary"
                >
                  {copy.filters[entry.group]}
                </h2>
                <span className="text-caption text-foreground-tertiary">
                  {entry.cards.length}
                </span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {entry.cards.map((card) => (
                  <li key={card.id}>
                    <ApplicationCard card={card} />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
        {state.nextCursor ? (
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="ghost"
              onClick={loadMore}
              disabled={state.loadingMore}
            >
              {state.loadingMore ? copy.loadingMore : copy.loadMore}
            </Button>
            {state.loadMoreFailed ? (
              <p
                role="alert"
                className="text-caption text-foreground-secondary"
              >
                {copy.loadMoreError}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
