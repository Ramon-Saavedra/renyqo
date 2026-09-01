import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  TabRefreshProvider,
  useTabRefreshRevision,
} from "./TabRefreshProvider";

function RevisionProbe() {
  const revision = useTabRefreshRevision();
  return <output data-testid="revision">{revision}</output>;
}

function TwoConsumerTree() {
  return (
    <TabRefreshProvider>
      <RevisionProbe />
      <RevisionProbe />
    </TabRefreshProvider>
  );
}

function fireFocus() {
  window.dispatchEvent(new Event("focus"));
}

function revisionValues() {
  return screen.getAllByTestId("revision").map((el) => el.textContent);
}

describe("TabRefreshProvider", () => {
  let now: number;

  beforeEach(() => {
    now = 1_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shares a single refresh trigger across multiple consumers", () => {
    render(<TwoConsumerTree />);

    expect(revisionValues()).toEqual(["0", "0"]);

    act(() => {
      fireFocus();
    });

    expect(revisionValues()).toEqual(["1", "1"]);
  });

  it("coalesces rapid focus events within the window", () => {
    render(<TwoConsumerTree />);

    act(() => {
      fireFocus();
    });
    expect(revisionValues()).toEqual(["1", "1"]);

    act(() => {
      fireFocus();
    });
    expect(revisionValues()).toEqual(["1", "1"]);
  });

  it("bumps the revision again once the window elapses", () => {
    render(<TwoConsumerTree />);

    act(() => {
      fireFocus();
    });
    expect(revisionValues()).toEqual(["1", "1"]);

    now += 300;
    act(() => {
      fireFocus();
    });
    expect(revisionValues()).toEqual(["2", "2"]);
  });
});
