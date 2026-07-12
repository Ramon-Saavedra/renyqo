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
  it("renders a radiogroup with the correct aria-label", () => {
    render(<StatusFilter value="alle" onChange={vi.fn()} counts={COUNTS} />);
    expect(
      screen.getByRole("radiogroup", { name: "Statusfilter" }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("renders all filter option buttons", () => {
    render(<StatusFilter value="alle" onChange={vi.fn()} counts={COUNTS} />);
    expect(screen.getByRole("radio", { name: /Alle/ })).toBeInstanceOf(
      HTMLElement,
    );
    expect(
      screen.getByRole("radio", { name: /Veröffentlicht/ }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByRole("radio", { name: /Entwürfe/ })).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByRole("radio", { name: /Pausiert/ })).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByRole("radio", { name: /Archiviert/ })).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByRole("radio", { name: /Klärung nötig/ })).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("marks the active filter as aria-checked='true'", () => {
    render(<StatusFilter value="draft" onChange={vi.fn()} counts={COUNTS} />);
    expect(
      screen
        .getByRole("radio", { name: /Entwürfe/ })
        .getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("marks non-active filters as aria-checked='false'", () => {
    render(<StatusFilter value="draft" onChange={vi.fn()} counts={COUNTS} />);
    expect(
      screen.getByRole("radio", { name: /Alle/ }).getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("calls onChange with the correct key when a filter button is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatusFilter value="alle" onChange={onChange} counts={COUNTS} />);
    await user.click(screen.getByRole("radio", { name: /Pausiert/ }));
    expect(onChange).toHaveBeenCalledWith("paused");
  });

  it("shows the count for the 'Alle' filter", () => {
    render(<StatusFilter value="alle" onChange={vi.fn()} counts={COUNTS} />);
    const btn = screen.getByRole("radio", { name: /Alle/ });
    expect(btn.textContent).toContain("10");
  });

  it("shows the count for the 'Veröffentlicht' filter", () => {
    render(<StatusFilter value="alle" onChange={vi.fn()} counts={COUNTS} />);
    const btn = screen.getByRole("radio", { name: /Veröffentlicht/ });
    expect(btn.textContent).toContain("4");
  });
});
