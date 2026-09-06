import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MatchBadge } from "./MatchBadge";

describe("MatchBadge", () => {
  it("uses the success-surface token pair for match", () => {
    const { container } = render(<MatchBadge tone="match">Passt</MatchBadge>);
    const badge = container.firstElementChild;
    expect(badge?.className).toContain("bg-success-surface");
    expect(badge?.className).toContain("text-success-on-surface");
    expect(badge?.className).not.toContain("text-primary-foreground");
  });

  it("does not change the not-selected token pair", () => {
    const { container } = render(
      <MatchBadge tone="not-selected">Nicht ausgewählt</MatchBadge>,
    );
    const badge = container.firstElementChild;
    expect(badge?.className).toContain("bg-exit-provider-discarded-bg");
    expect(badge?.className).toContain("text-exit-provider-discarded-fg");
  });
});
