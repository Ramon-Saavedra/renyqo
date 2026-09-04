import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SelectedObjectCard } from "./SelectedObjectCard";
import type { DashboardObject } from "../types";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const publishedObject: DashboardObject = {
  id: "object-1",
  title: "Wohnung Mitte",
  fullTitle: "Wohnung Mitte Berlin",
  objectType: "APARTMENT",
  district: "Berlin-Mitte",
  address: "Torstraße 1, 10119 Berlin",
  coldRent: 900,
  livingArea: 60,
  rooms: "2",
  availableFrom: "01.08.2026",
  publishedAt: "02.07.2026, 13:00",
  updatedAt: "01.07.2026, 09:15",
  status: "published",
  activeApplicationsCount: 3,
};

describe("SelectedObjectCard", () => {
  it("renders selected object details and actions", () => {
    render(<SelectedObjectCard object={publishedObject} />);

    const typeChip = screen.getByText("Wohnung");
    expect(typeChip).not.toBeNull();
    expect(typeChip.closest("section")).toBeNull();
    expect(screen.getByText("Aktuell ausgewählt")).not.toBeNull();
    expect(screen.getByText("Wohnung Mitte Berlin")).not.toBeNull();
    expect(screen.getByText("Torstraße 1, 10119 Berlin")).not.toBeNull();
    expect(screen.getByText("60 m²")).not.toBeNull();
    expect(screen.getByText("900 €")).not.toBeNull();
    expect(screen.getByText("3 / 5 aktiv")).not.toBeNull();
    const editLink = screen.getByRole("link", { name: /Bearbeiten/i });
    const previewLink = screen.getByRole("link", { name: /Vorschau/i });
    expect(editLink.className).toContain("bg-transparent");
    expect(editLink.className).toContain("hover:bg-primary-foreground/20");
    expect(previewLink.className).toContain("bg-transparent");
    expect(previewLink.className).toContain("hover:bg-primary-foreground/20");
    const mobileShare = document.querySelector(
      'summary[aria-label="Link kopieren"]',
    );
    expect(mobileShare).toBeInstanceOf(HTMLElement);
    if (!(mobileShare instanceof HTMLElement)) return;
    expect(mobileShare.className).toContain("bg-transparent");
    expect(mobileShare.className).toContain("hover:bg-primary-foreground/20");
    expect(screen.getByText("02.07.2026, 13:00")).not.toBeNull();
    expect(screen.getByText("Veröffentlicht am")).not.toBeNull();
  });

  it("shows the last edited timestamp for drafts", () => {
    render(
      <SelectedObjectCard
        object={{
          ...publishedObject,
          status: "draft",
          publishedAt: null,
          updatedAt: "05.07.2026, 14:30",
          activeApplicationsCount: 0,
        }}
      />,
    );

    expect(screen.queryByText("02.07.2026, 13:00")).toBeNull();
    expect(screen.getByText("05.07.2026, 14:30")).not.toBeNull();
    expect(screen.getByText("Zuletzt bearbeitet am")).not.toBeNull();
  });

  it("uses selectedObject.activeApplicationsCount for the ACTIVE display", () => {
    render(
      <SelectedObjectCard
        object={{ ...publishedObject, activeApplicationsCount: 1 }}
      />,
    );

    expect(screen.getByText("1 / 5 aktiv")).not.toBeNull();
  });

  it("renders draft status and an empty availability label", () => {
    render(
      <SelectedObjectCard
        object={{
          ...publishedObject,
          availableFrom: null,
          status: "draft",
          activeApplicationsCount: 0,
        }}
      />,
    );

    expect(screen.getByText("Offen")).not.toBeNull();
    expect(screen.getByText("Entwurf")).not.toBeNull();
    expect(screen.getByText("0 / 5 aktiv")).not.toBeNull();
  });
});
