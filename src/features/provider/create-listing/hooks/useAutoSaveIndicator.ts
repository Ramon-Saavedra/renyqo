"use client";

import { useEffect, useRef, useState } from "react";

export type AutoSaveStatus = "saved" | "saving";

const SAVE_DELAY_MS = 700;

interface UseAutoSaveIndicatorResult {
  readonly status: AutoSaveStatus;
}

export function useAutoSaveIndicator(
  watched: ReadonlyArray<unknown>,
): UseAutoSaveIndicatorResult {
  const [status, setStatus] = useState<AutoSaveStatus>("saved");
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setStatus("saving");
    const id = window.setTimeout(() => setStatus("saved"), SAVE_DELAY_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, watched);

  return { status };
}
