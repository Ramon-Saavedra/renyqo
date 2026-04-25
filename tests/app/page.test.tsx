import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "@/app/page";

vi.mock("next/image", () => ({
  default: ({
    alt,
    className,
    height,
    src,
    width,
  }: {
    alt: string;
    className?: string;
    height: number;
    src: string;
    width: number;
  }) => (
    <img
      alt={alt}
      className={className}
      height={height}
      src={src}
      width={width}
    />
  ),
}));

describe("Home page", () => {
  it("renders the starter heading and links", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /to get started, edit the page\.tsx file\./i,
      }),
    ).toBeDefined();

    expect(
      screen.getByRole("link", {
        name: /deploy now/i,
      }),
    ).toHaveProperty("href", expect.stringContaining("vercel.com/new"));

    expect(
      screen.getByRole("link", {
        name: /documentation/i,
      }),
    ).toHaveProperty("href", expect.stringContaining("nextjs.org/docs"));
  });
});
