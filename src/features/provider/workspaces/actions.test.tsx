import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreateListingAction } from "./CreateListingAction";
import {
  WorkspaceFixture,
  current,
  scopeFor,
  workspaceA,
} from "./testing/workspace-fixture";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

describe("server-driven workspace actions", () => {
  it("enables the existing create destination only when allowed", () => {
    render(
      <WorkspaceFixture>
        <CreateListingAction />
      </WorkspaceFixture>,
    );
    expect(
      screen
        .getByRole("link", { name: "Neues Mietobjekt" })
        .getAttribute("href"),
    ).toBe("/provider/listings/new?workspaceId=" + workspaceA);
  });
  it("does not infer creation from OWNER", () => {
    const projection = current();
    projection.actions.createListing = {
      allowed: false,
      reason: "NOT_PERMITTED",
    };
    render(
      <WorkspaceFixture scope={scopeFor(projection)}>
        <CreateListingAction />
      </WorkspaceFixture>,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("does not infer denial from AGENT", () => {
    render(
      <WorkspaceFixture scope={scopeFor(current(workspaceA, "AGENT"))}>
        <CreateListingAction />
      </WorkspaceFixture>,
    );
    expect(screen.getByRole("link", { name: "Neues Mietobjekt" })).toBeTruthy();
  });
  it("explains growth unavailability without administrative quota data", () => {
    const projection = current();
    projection.actions.createListing = {
      allowed: false,
      reason: "WORKSPACE_GROWTH_UNAVAILABLE",
    };
    render(
      <WorkspaceFixture scope={scopeFor(projection)}>
        <CreateListingAction />
      </WorkspaceFixture>,
    );
    const button = screen.getByRole("button");
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("title")).toContain("derzeit nicht");
    expect(document.body.textContent).not.toMatch(
      /quota|plan|OVER_LIMIT|revision/i,
    );
  });
  it("never enables an action without a validated scope", () => {
    render(<CreateListingAction />);
    expect(screen.queryByRole("link")).toBeNull();
  });
  it("does not show a switcher for a single workspace", () => {
    const scope = scopeFor();
    render(
      <WorkspaceFixture
        scope={{ ...scope, workspaces: scope.workspaces.slice(0, 1) }}
      >
        <WorkspaceSwitcher />
      </WorkspaceFixture>,
    );
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});
