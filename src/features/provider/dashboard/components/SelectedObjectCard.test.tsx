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
  district: "Berlin-Mitte",
  address: "Torstraße 1, 10119 Berlin",
  coldRent: 900,
  livingArea: 60,
  rooms: "2",
  availableFrom: "01.08.2026",
  publishedAt: "02.07.2026, 13:00",
  updatedAt: "01.07.2026, 09:15",
  status: "published",
  activeApplications: 3,
};

describe("SelectedObjectCard", () => {
  it("renders selected object details and actions", () => {
    render(<SelectedObjectCard object={publishedObject} />);

    expect(screen.getByText("Aktuell ausgewählt")).not.toBeNull();
    expect(screen.getByText("Wohnung Mitte Berlin")).not.toBeNull();
    expect(screen.getByText("Torstraße 1, 10119 Berlin")).not.toBeNull();
    expect(screen.getByText("60 m²")).not.toBeNull();
    expect(screen.getByText("900 €")).not.toBeNull();
    expect(screen.getByText("3 / 5 aktiv")).not.toBeNull();
    expect(screen.getByRole("link", { name: /Bearbeiten/i })).not.toBeNull();
    expect(screen.getByRole("link", { name: /Vorschau/i })).not.toBeNull();
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
        }}
      />,
    );

    expect(screen.queryByText("02.07.2026, 13:00")).toBeNull();
    expect(screen.getByText("05.07.2026, 14:30")).not.toBeNull();
    expect(screen.getByText("Zuletzt bearbeitet am")).not.toBeNull();
  });

  it("renders draft status and an empty availability label", () => {
    render(
      <SelectedObjectCard
        object={{
          ...publishedObject,
          availableFrom: null,
          status: "draft",
          activeApplications: 0,
        }}
      />,
    );

    expect(screen.getByText("Offen")).not.toBeNull();
    expect(screen.getByText("Entwurf")).not.toBeNull();
  });
});
