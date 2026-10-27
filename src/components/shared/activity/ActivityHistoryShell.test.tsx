import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import {
  ActivityHistoryList,
  ActivityHistoryRow,
  ActivityHistoryShell,
} from "./ActivityHistoryShell";

function Harness({
  summary,
}: {
  readonly summary: { readonly label: string; readonly time: string } | null;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <ActivityHistoryShell
      expanded={expanded}
      onToggle={() => setExpanded((current) => !current)}
      summary={summary}
    >
      <ActivityHistoryList>
        <ActivityHistoryRow
          id="activity-1"
          label="Terminvorschlag zurückgezogen"
          time="27.10.2026 · 14:20"
          dateTime="2026-10-27T12:20:00.000Z"
        />
      </ActivityHistoryList>
    </ActivityHistoryShell>
  );
}

describe("ActivityHistoryShell", () => {
  it("shows one latest-entry line until opened", () => {
    render(
      <Harness
        summary={{
          label: "Terminvorschlag zurückgezogen",
          time: "27. Okt., 14:20",
        }}
      />,
    );
    const toggle = screen.getByRole("button", { name: /Letzter Eintrag/ });

    expect(screen.getByRole("region", { name: "Verlauf" })).toBeTruthy();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.textContent).toContain(
      "Verlauf · Letzter Eintrag: Terminvorschlag zurückgezogen · 27. Okt., 14:20",
    );
    expect(screen.queryByRole("listitem")).toBeNull();

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const row = screen.getByRole("listitem");
    expect(row.textContent).toContain("Terminvorschlag zurückgezogen");
    expect(row.className).not.toContain("overflow-y-auto");
    expect(screen.getByRole("list").className).not.toContain("overflow-y-auto");

    fireEvent.click(toggle);
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("uses the short empty indication until opened", () => {
    render(<Harness summary={null} />);
    const toggle = screen.getByRole("button", { name: /Keine Einträge/ });

    expect(toggle.textContent).toContain("Verlauf · Keine Einträge");
    expect(screen.queryByText("Noch keine Einträge.")).toBeNull();
    fireEvent.click(toggle);
    expect(screen.getByText("Noch keine Einträge.")).toBeTruthy();
  });
});
