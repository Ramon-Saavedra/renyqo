"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EMPTY_FILTERS } from "../types";
import type { ListingFilters, SortKey } from "../types";
import {
  parseListingsSearchParams,
  persistListingsSearchQuery,
  serializeListingsSearchQuery,
} from "../utils/listings-search-params";

export interface UseListingsSearchStateResult {
  readonly filters: ListingFilters;
  readonly sort: SortKey;
  readonly updateFilters: (patch: Partial<ListingFilters>) => void;
  readonly resetFilters: () => void;
  readonly setSort: (sort: SortKey) => void;
}

export function useListingsSearchState(): UseListingsSearchStateResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const incomingQuery = searchParams.toString();
  const parsed = useMemo(
    () => parseListingsSearchParams(new URLSearchParams(incomingQuery)),
    [incomingQuery],
  );
  const [filters, setFilters] = useState(parsed.filters);
  const [sort, setSortState] = useState(parsed.sort);
  const lastWrittenRef = useRef(
    serializeListingsSearchQuery(parsed.filters, parsed.sort),
  );
  const pendingWriteRef = useRef(false);

  useEffect(() => {
    const incoming = serializeListingsSearchQuery(parsed.filters, parsed.sort);
    if (incoming === lastWrittenRef.current) {
      pendingWriteRef.current = false;
      persistListingsSearchQuery(incoming);
      return;
    }
    if (pendingWriteRef.current) return;
    lastWrittenRef.current = incoming;
    persistListingsSearchQuery(incoming);
    setFilters(parsed.filters);
    setSortState(parsed.sort);
  }, [parsed]);

  const write = useCallback(
    (nextFilters: ListingFilters, nextSort: SortKey) => {
      const query = serializeListingsSearchQuery(nextFilters, nextSort);
      lastWrittenRef.current = query;
      persistListingsSearchQuery(query);
      const currentCanonical = serializeListingsSearchQuery(
        parseListingsSearchParams(searchParams).filters,
        parseListingsSearchParams(searchParams).sort,
      );
      if (query === currentCanonical) {
        pendingWriteRef.current = false;
        return;
      }
      pendingWriteRef.current = true;
      const href = query.length > 0 ? `${pathname}?${query}` : pathname;
      router.replace(href, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const updateFilters = useCallback(
    (patch: Partial<ListingFilters>) => {
      const next = { ...filters, ...patch };
      setFilters(next);
      write(next, sort);
    },
    [filters, sort, write],
  );

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    write(EMPTY_FILTERS, sort);
  }, [sort, write]);

  const setSort = useCallback(
    (nextSort: SortKey) => {
      setSortState(nextSort);
      write(filters, nextSort);
    },
    [filters, write],
  );

  return { filters, sort, updateFilters, resetFilters, setSort };
}
