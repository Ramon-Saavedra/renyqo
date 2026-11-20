import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ListingMatrix } from "@/features/provider/dashboard/components/ListingMatrix";
import { emptyAttentionTotals } from "@/lib/attention/fixtures";
import type { DashboardObject } from "@/features/provider/dashboard/types";
import {
  current,
  scopeFor,
  WorkspaceFixture,
  workspaceA,
} from "./testing/workspace-fixture";
vi.mock(
  "@/features/provider/dashboard/api/provider-listing-applications",
  () => ({ getProviderActiveApplications: vi.fn().mockResolvedValue([]) }),
);
const listing: DashboardObject = {
  id: "listing",
  title: "Objekt",
  fullTitle: "Objekt",
  objectType: null,
  district: "Berlin",
  address: "Berlin",
  coldRent: 1,
  livingArea: 1,
  rooms: "1",
  availableFrom: null,
  publishedAt: null,
  updatedAt: null,
  status: "published",
  displayOrder: 1,
  activeApplicationsCount: 0,
  attention: emptyAttentionTotals(),
  needsAttention: false,
};
describe("reorder projection", () => {
  it.each(["OWNER", "AGENT"] as const)(
    "does not expose denied reorder controls for %s",
    (role) => {
      const projection = current(workspaceA, role);
      projection.actions.reorderListings.allowed = false;
      render(
        <WorkspaceFixture scope={scopeFor(projection)}>
          <ListingMatrix
            objects={[listing]}
            selectedId={null}
            onSelect={() => {}}
          />
        </WorkspaceFixture>,
      );
      expect(
        screen.queryByRole("button", { name: /Drag-and-drop/ }),
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: /Position.*ändern/ }),
      ).toBeNull();
    },
  );
  it("uses allowed rather than inferring from AGENT", () => {
    render(
      <WorkspaceFixture scope={scopeFor(current(workspaceA, "AGENT"))}>
        <ListingMatrix
          objects={[listing]}
          selectedId={null}
          onSelect={() => {}}
        />
      </WorkspaceFixture>,
    );
    expect(screen.getByRole("button", { name: /Drag-and-drop/ })).toBeTruthy();
  });
  it("keeps RETIRED history visible without offering an active ordering slot", () => {
    render(
      <WorkspaceFixture>
        <ListingMatrix
          objects={[{ ...listing, status: "retired", displayOrder: null }]}
          selectedId={null}
          onSelect={() => {}}
        />
      </WorkspaceFixture>,
    );
    expect(screen.getAllByText("Objekt").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Drag-and-drop/ })).toBeNull();
  });
});
