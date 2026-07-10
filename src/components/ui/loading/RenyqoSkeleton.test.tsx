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
});
