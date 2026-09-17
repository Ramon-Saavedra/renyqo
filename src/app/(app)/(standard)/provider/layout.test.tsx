import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProviderLayout from "./layout";

const routeState = vi.hoisted(() => ({ pathname: "/provider/listings" }));

vi.mock("next/navigation", () => ({
  usePathname: () => routeState.pathname,
}));

vi.mock("@/components/layout/account-menu/AccountMenu", () => ({
  AccountMenu: ({ variant }: { variant: string }) => (
    <div>Account menu {variant}</div>
  ),
}));

vi.mock("@/components/layout/app-topbar/AppTopbar", () => ({
  AppTopbar: ({
    children,
    className,
    logoHref,
  }: {
    children: React.ReactNode;
    className: string;
    logoHref: string;
  }) => (
    <header className={className}>
      <a href={logoHref}>Renyqo</a>
      {children}
    </header>
  ),
}));

describe("ProviderLayout", () => {
  it("renders common sticky chrome and preserves page content", () => {
    render(
      <ProviderLayout>
        <main>Provider page content</main>
      </ProviderLayout>,
    );

    expect(
      screen.getByRole("link", { name: "Renyqo" }).getAttribute("href"),
    ).toBe("/provider/dashboard");
    expect(screen.getByText("Account menu full")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Provider page content")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByRole("banner").className).toContain("sticky top-0 z-30");
    expect(screen.getByRole("banner").className).toContain("h-provider-topbar");
  });

  it.each([
    "/provider/get-started",
    "/provider/listings",
    "/provider/listings/listing-1",
  ])("uses the full Provider identity on %s", (pathname) => {
    routeState.pathname = pathname;

    render(
      <ProviderLayout>
        <main>Provider page content</main>
      </ProviderLayout>,
    );

    expect(screen.getByText("Account menu full")).toBeInstanceOf(HTMLElement);
  });

  it("keeps the create-listing route compact", () => {
    routeState.pathname = "/provider/listings/new";

    render(
      <ProviderLayout>
        <main>Provider page content</main>
      </ProviderLayout>,
    );

    expect(screen.getByText("Account menu compact")).toBeInstanceOf(
      HTMLElement,
    );
  });
});
