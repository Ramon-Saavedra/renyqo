import {
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Candidate } from "../types";

export type Row = { item: Candidate; state: "idle" | "entering" };

type EntryAction =
  | { type: "add"; ids: readonly string[] }
  | { type: "remove"; ids: readonly string[] };

function reduceEnteringIds(
  enteringIds: ReadonlySet<string>,
  action: EntryAction,
): ReadonlySet<string> {
  const nextIds = new Set(enteringIds);
  action.ids.forEach((id) => {
    if (action.type === "add") nextIds.add(id);
    else nextIds.delete(id);
  });
  return nextIds;
}

export function useLaneRows(actives: readonly Candidate[]): Row[] {
  const [enteringIds, dispatchEnteringIds] = useReducer(
    reduceEnteringIds,
    new Set<string>(),
  );
  const activeIds = useRef(new Set(actives.map((item) => item.id)));
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const hasMounted = useRef(false);
  const rows = actives.map((item) => ({
    item,
    state: enteringIds.has(item.id) ? ("entering" as const) : ("idle" as const),
  }));

  useEffect(() => {
    const currentIds = new Set(actives.map((item) => item.id));
    const previousIds = activeIds.current;
    const addedIds = hasMounted.current
      ? actives.map((item) => item.id).filter((id) => !previousIds.has(id))
      : [];

    addedIds.forEach((id) => {
      const timerKey = `e${id}`;
      timers.current[timerKey] = setTimeout(() => {
        delete timers.current[timerKey];
        dispatchEnteringIds({ type: "remove", ids: [id] });
      }, 560);
    });

    if (addedIds.length > 0) {
      dispatchEnteringIds({ type: "add", ids: addedIds });
    }

    const removedIds: string[] = [];
    Object.entries(timers.current).forEach(([timerKey, timer]) => {
      const id = timerKey.slice(1);
      if (currentIds.has(id)) return;
      clearTimeout(timer);
      delete timers.current[timerKey];
      removedIds.push(id);
    });

    if (removedIds.length > 0) {
      dispatchEnteringIds({ type: "remove", ids: removedIds });
    }

    activeIds.current = currentIds;
    hasMounted.current = true;
  }, [actives]);

  useEffect(
    () => () => {
      Object.values(timers.current).forEach(clearTimeout);
    },
    [],
  );

  return rows;
}

export function useBeat(value: unknown): number {
  const [beat, setBeat] = useState(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setBeat((b) => b + 1);
  }, [value]);
  return beat;
}

type ColorScheme = "dark" | "light";

function subscribeColorScheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getColorSchemeSnapshot(): ColorScheme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getColorSchemeServerSnapshot(): ColorScheme {
  return "light";
}

export function useColorScheme(): ColorScheme {
  return useSyncExternalStore(
    subscribeColorScheme,
    getColorSchemeSnapshot,
    getColorSchemeServerSnapshot,
  );
}
