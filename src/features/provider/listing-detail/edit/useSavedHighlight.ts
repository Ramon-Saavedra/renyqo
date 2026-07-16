"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangedFields } from "./changed-fields";
import { NO_CHANGED_FIELDS } from "./changed-fields";

export const SAVED_HIGHLIGHT_MS = 2000;

export interface UseSavedHighlightResult {
  readonly savedFields: ChangedFields;
  readonly flash: (fields: ChangedFields) => void;
}

export function useSavedHighlight(
  durationMs: number = SAVED_HIGHLIGHT_MS,
): UseSavedHighlightResult {
  const [savedFields, setSavedFields] =
    useState<ChangedFields>(NO_CHANGED_FIELDS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const flash = useCallback(
    (fields: ChangedFields) => {
      clearTimer();
      if (fields.size === 0) {
        setSavedFields(NO_CHANGED_FIELDS);
        return;
      }
      setSavedFields(fields);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setSavedFields(NO_CHANGED_FIELDS);
      }, durationMs);
    },
    [clearTimer, durationMs],
  );

  useEffect(() => clearTimer, [clearTimer]);

  return { savedFields, flash };
}
