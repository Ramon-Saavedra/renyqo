"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EMPTY_FILTERS } from "../types";
import type { ListingFilters, SortKey } from "../types";
import type { ListingsSearchState } from "../utils/listings-search-params";
import {
  listingsSearchUrlHasAliasParam,
  normalizeListingsSearchQuery,
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

function matchesParsedSearchState(
  filters: ListingFilters,
  sort: SortKey,
  parsed: ListingsSearchState,
): boolean {
  return (
    sort === parsed.sort &&
    serializeListingsSearchQuery(filters, sort) ===
      serializeListingsSearchQuery(parsed.filters, parsed.sort)
  );
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
    const incomingParams = new URLSearchParams(incomingQuery);
    if (!listingsSearchUrlHasAliasParam(incomingParams)) return;

    const incoming = serializeListingsSearchQuery(parsed.filters, parsed.sort);
    if (
      !pendingWriteRef.current &&
      !matchesParsedSearchState(filters, sort, parsed)
    ) {
      setFilters(parsed.filters);
      setSortState(parsed.sort);
    }
    lastWrittenRef.current = incoming;
    persistListingsSearchQuery(incoming);
    pendingWriteRef.current = true;
    const href = incoming.length > 0 ? `${pathname}?${incoming}` : pathname;
    router.replace(href, { scroll: false });
  }, [filters, incomingQuery, parsed, pathname, router, sort]);

  useEffect(() => {
    const incomingParams = new URLSearchParams(incomingQuery);
    if (listingsSearchUrlHasAliasParam(incomingParams)) return;

    const incoming = serializeListingsSearchQuery(parsed.filters, parsed.sort);
    if (incoming === lastWrittenRef.current) {
      pendingWriteRef.current = false;
      persistListingsSearchQuery(incoming);
      if (matchesParsedSearchState(filters, sort, parsed)) {
        return;
      }
    } else if (pendingWriteRef.current) {
      return;
    } else {
      lastWrittenRef.current = incoming;
      persistListingsSearchQuery(incoming);
    }

    setFilters(parsed.filters);
    setSortState(parsed.sort);
  }, [filters, incomingQuery, parsed, sort]);

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
      const next = {
        ...filters,
        ...patch,
        query: normalizeListingsSearchQuery(patch.query ?? filters.query),
      };
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
