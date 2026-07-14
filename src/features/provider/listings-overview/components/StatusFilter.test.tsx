import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { StatusCounts } from "../types";
import { StatusFilter } from "./StatusFilter";

const COUNTS: StatusCounts = {
  alle: 10,
  published: 4,
  draft: 2,
  paused: 1,
  archived: 1,
  attention: 3,
};

describe("StatusFilter", () => {
  it("renders filter options with counts and active state", () => {
    render(<StatusFilter value="draft" onChange={vi.fn()} counts={COUNTS} />);

    expect(
      screen.getByRole("radiogroup", { name: "Statusfilter" }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByRole("radio", { name: /Alle/ }).textContent).toContain(
      "10",
    );
    expect(
      screen
        .getByRole("radio", { name: /Entwürfe/ })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.getByRole("radio", { name: /Klärung nötig/ })).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("calls onChange with the selected filter key", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<StatusFilter value="alle" onChange={onChange} counts={COUNTS} />);

    await user.click(screen.getByRole("radio", { name: /Pausiert/ }));

    expect(onChange).toHaveBeenCalledWith("paused");
  });
});
