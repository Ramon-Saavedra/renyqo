import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatCards } from "./StatCards";

describe("StatCards", () => {
  it("renders dashboard counters and supporting labels", () => {
    render(
      <StatCards
        totalObjects={4}
        publishedObjects={3}
        draftObjects={1}
        newApplications={7}
      />,
    );

    expect(screen.getByText("Anzahl Objekte")).not.toBeNull();
    expect(screen.getByText("Neue Bewerbungen")).not.toBeNull();
    expect(screen.getByText("Entwürfe")).not.toBeNull();
    expect(screen.getByText("3 veröffentlicht · 1 Entwurf")).not.toBeNull();
    expect(screen.getByText("Seit gestern")).not.toBeNull();
    expect(screen.getByText("Bereit zur Veröffentlichung")).not.toBeNull();
  });
});
