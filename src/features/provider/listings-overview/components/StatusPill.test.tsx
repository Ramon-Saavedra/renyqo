import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusPill } from "./StatusPill";

describe("StatusPill", () => {
  it("renders the German label for each status", () => {
    const cases = [
      { status: "published", label: "Veröffentlicht" },
      { status: "draft", label: "Entwurf" },
      { status: "paused", label: "Pausiert" },
      { status: "archived", label: "Archiviert" },
    ] as const;

    for (const { status, label } of cases) {
      const { unmount } = render(<StatusPill status={status} />);
      expect(screen.getByText(label)).toBeInstanceOf(HTMLElement);
      unmount();
    }
  });
});
