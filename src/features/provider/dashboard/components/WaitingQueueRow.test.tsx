import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WaitingQueueRow } from "./WaitingQueueRow";

describe("WaitingQueueRow", () => {
  it("renders the neutral empty state when waiting count is zero", () => {
    render(
      <WaitingQueueRow waitingCountState={{ status: "success", count: 0 }} />,
    );

    expect(screen.getByRole("status")).not.toBeNull();
    expect(
      screen.getByText(
        "Aktuell keine weiteren passenden Bewerbungen in der Warteschlange",
      ),
    ).not.toBeNull();
    expect(screen.queryByText("0")).toBeNull();
  });

  it("renders singular waiting copy for one waiting application", () => {
    render(
      <WaitingQueueRow waitingCountState={{ status: "success", count: 1 }} />,
    );

    expect(
      screen.getByText("1 weitere passende Bewerbung wartet"),
    ).not.toBeNull();
  });

  it("renders plural waiting copy for multiple waiting applications", () => {
    render(
      <WaitingQueueRow waitingCountState={{ status: "success", count: 3 }} />,
    );

    expect(
      screen.getByText("3 weitere passende Bewerbungen warten"),
    ).not.toBeNull();
  });

  it("renders an explicit error state without inventing zero", () => {
    render(<WaitingQueueRow waitingCountState={{ status: "error" }} />);

    expect(
      screen.getByText("Warteschlange konnte nicht geladen werden."),
    ).not.toBeNull();
    expect(screen.queryByText("0")).toBeNull();
  });

  it("does not expose waiting applicant profile information", () => {
    render(
      <WaitingQueueRow waitingCountState={{ status: "success", count: 2 }} />,
    );

    expect(screen.queryByText(/@/)).toBeNull();
    expect(screen.queryByText(/applicant/i)).toBeNull();
  });
});
