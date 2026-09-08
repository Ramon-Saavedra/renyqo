"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { listingsCopy } from "../copy/listings";

interface AnimatedHeroTitleProps {
  className: string;
}

const TITLES = listingsCopy.hero.titles;
const REDUCE_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const HOLD_MS = 2800;
const ENTER_MS = 700;
const EXIT_MS = 500;

const SIZER_CLASS = "invisible col-start-1 row-start-1 min-w-0 w-full";
const VISIBLE_BASE_CLASS =
  "col-start-1 row-start-1 min-w-0 w-full overflow-hidden";

type Visual =
  | "show"
  | "fade-from"
  | "fade-in"
  | "fade-out"
  | "blur-from"
  | "blur-in"
  | "blur-out"
  | "mask-from"
  | "mask-in"
  | "mask-out";

const VISUAL_CLASS: Record<Visual, string> = {
  show: "opacity-100",
  "fade-from": "translate-y-1 opacity-0",
  "fade-in":
    "translate-y-0 opacity-100 transition duration-700 ease-out motion-reduce:transition-none",
  "fade-out":
    "opacity-0 transition duration-500 ease-out motion-reduce:transition-none",
  "blur-from": "opacity-0 blur-sm",
  "blur-in":
    "opacity-100 blur-none transition duration-700 ease-out motion-reduce:transition-none",
  "blur-out":
    "opacity-0 blur-sm transition duration-500 ease-out motion-reduce:transition-none",
  "mask-from": "opacity-0",
  "mask-in":
    "opacity-100 transition duration-700 ease-out motion-reduce:transition-none",
  "mask-out":
    "opacity-0 transition duration-500 ease-out motion-reduce:transition-none",
};

const ENTER_FROM = ["fade-from", "blur-from", "mask-from"] as const;
const ENTER_TO = ["fade-in", "blur-in", "mask-in"] as const;
const EXIT = ["fade-out", "blur-out", "mask-out"] as const;

type TitleIndex = 0 | 1 | 2;

function nextIndex(current: TitleIndex): TitleIndex {
  if (current === 0) return 1;
  if (current === 1) return 2;
  return 0;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCE_MOTION_QUERY).matches;
}

export function AnimatedHeroTitle({ className }: AnimatedHeroTitleProps) {
  const [index, setIndex] = useState<TitleIndex>(0);
  const [visual, setVisual] = useState<Visual>("show");

  useEffect(() => {
    let runId = 0;
    let timeoutId = 0;
    let frameId = 0;

    const isCurrent = (id: number) => id === runId;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        timeoutId = window.setTimeout(resolve, ms);
      });

    const waitFrames = async (id: number, count: number) => {
      for (let i = 0; i < count; i += 1) {
        if (!isCurrent(id)) return;
        await new Promise<void>((resolve) => {
          frameId = window.requestAnimationFrame(() => resolve());
        });
      }
    };

    const paint = async (id: number, next: Visual) => {
      if (!isCurrent(id)) return;
      setVisual(next);
      await waitFrames(id, 2);
    };

    const runCycle = async (id: number) => {
      let current: TitleIndex = 0;
      await sleep(HOLD_MS);

      while (isCurrent(id)) {
        await paint(id, EXIT[current]);
        if (!isCurrent(id)) return;
        await sleep(EXIT_MS);
        if (!isCurrent(id)) return;

        current = nextIndex(current);
        setIndex(current);
        await paint(id, ENTER_FROM[current]);
        await paint(id, ENTER_TO[current]);
        if (!isCurrent(id)) return;
        await sleep(ENTER_MS + HOLD_MS);
      }
    };

    const stop = () => {
      runId += 1;
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);
    };

    const start = () => {
      stop();
      setIndex(0);
      setVisual("show");
      if (prefersReducedMotion()) return;
      void runCycle(runId);
    };

    const media = window.matchMedia(REDUCE_MOTION_QUERY);
    media.addEventListener("change", start);
    start();

    return () => {
      stop();
      media.removeEventListener("change", start);
    };
  }, []);

  return (
    <div className={className}>
      <h1 className="sr-only">{TITLES[0]}</h1>
      <div aria-hidden="true" className="grid">
        {TITLES.map((title) => (
          <span key={title} className={SIZER_CLASS}>
            {title}
          </span>
        ))}
        <span className={cn(VISIBLE_BASE_CLASS, VISUAL_CLASS[visual])}>
          {TITLES[index]}
        </span>
      </div>
    </div>
  );
}
