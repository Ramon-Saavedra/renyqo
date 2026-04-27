import { render } from "@testing-library/react";
import { describe, it } from "vitest";

import Home from "@/app/(public)/page";

describe("Home page", () => {
  it("renders without errors", () => {
    render(<Home />);
  });
});
