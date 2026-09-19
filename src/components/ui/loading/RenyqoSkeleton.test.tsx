import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RenyqoSkeleton } from "./RenyqoSkeleton";

describe("RenyqoSkeleton", () => {
  it("renders the box variant by default with numeric sizes as px", () => {
    const { container } = render(<RenyqoSkeleton width={40} height={12} />);
    const el = container.querySelector("span");

    expect(el?.classList.contains("sk")).toBe(true);
    expect(el?.style.width).toBe("40px");
    expect(el?.style.height).toBe("12px");
    expect(el?.getAttribute("aria-hidden")).toBe("true");
  });

  it("maps variants to their skeleton class and keeps string sizes verbatim", () => {
    const { container } = render(
      <RenyqoSkeleton variant="circle" width="50%" />,
    );
    const el = container.querySelector("span");

    expect(el?.classList.contains("sk-circle")).toBe(true);
    expect(el?.style.width).toBe("50%");
  });

  it("renders the branded text variant with its requested dimensions", () => {
    const { container } = render(
      <RenyqoSkeleton variant="text" width="75%" height={13} />,
    );
    const el = container.querySelector<HTMLElement>(".sk-text");
    const content = container.querySelector(".sk-text-content");

    expect(el).toBeInstanceOf(HTMLElement);
    expect(el?.style.width).toBe("75%");
    expect(el?.style.height).toBe("13px");
    expect(content?.textContent).toBe("Renyqo Renyqo Renyqo Renyqo Renyqo ");
  });

  it("preserves the pill variant", () => {
    const { container } = render(<RenyqoSkeleton variant="pill" />);
    expect(container.querySelector(".sk-pill")).toBeInstanceOf(HTMLElement);
  });
});
