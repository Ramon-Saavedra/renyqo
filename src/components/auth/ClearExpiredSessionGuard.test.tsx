import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LISTINGS_SEARCH_SESSION_KEY } from "@/features/applicant/listings/utils/listings-search-params";
import { invalidateCurrentUser } from "@/lib/api/use-current-user";
import { ClearExpiredSessionGuard } from "./ClearExpiredSessionGuard";

describe("ClearExpiredSessionGuard", () => {
  afterEach(() => {
    sessionStorage.clear();
    invalidateCurrentUser();
  });

  it("clears the listings search session when the session is expired", () => {
    sessionStorage.setItem(LISTINGS_SEARCH_SESSION_KEY, "query=Freiburg");

    render(
      <ClearExpiredSessionGuard expired>
        <span>Inhalt</span>
      </ClearExpiredSessionGuard>,
    );

    expect(screen.getByText("Inhalt")).toBeInstanceOf(HTMLElement);
    expect(sessionStorage.getItem(LISTINGS_SEARCH_SESSION_KEY)).toBeNull();
  });

  it("keeps the listings search session when the session is active", () => {
    sessionStorage.setItem(LISTINGS_SEARCH_SESSION_KEY, "query=Freiburg");

    render(
      <ClearExpiredSessionGuard expired={false}>
        <span>Inhalt</span>
      </ClearExpiredSessionGuard>,
    );

    expect(sessionStorage.getItem(LISTINGS_SEARCH_SESSION_KEY)).toBe(
      "query=Freiburg",
    );
  });
});
