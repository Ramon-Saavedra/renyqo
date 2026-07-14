import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Search } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { RoleCard } from "./RoleCard";

const baseProps = {
  kicker: "Für Suchende",
  title: "Ich suche ein Zuhause",
  description:
    "Bereite dein Mietprofil einmal sauber vor und bewirb dich nur auf Mietobjekte, deren Anforderungen wirklich zu dir passen.",
  points: [
    "Mietprofil mit Nachweisen vorbereiten",
    "Passende Mietobjekte schneller erkennen",
    "Kontakt erst, wenn es wirklich passt",
  ],
  benefits: [
    "Keine wochenlange Funkstille mehr nach deiner Anfrage.",
    "Du siehst vorab, ob ein Mietobjekt wirklich zu deinem Profil passt.",
  ],
  glyph: Search,
  active: false,
  onSelect: () => {},
} as const;

describe("RoleCard", () => {
  it("renders a radio-like role option with its main content", () => {
    render(<RoleCard {...baseProps} />);

    expect(
      screen.getByRole("radio", { name: /ich suche ein zuhause/i }),
    ).toBeInstanceOf(HTMLButtonElement);
    expect(screen.getByText(baseProps.description)).toBeInstanceOf(HTMLElement);
    expect(screen.getAllByRole("listitem")).toHaveLength(
      baseProps.points.length,
    );
  });

  it("reflects the selected state with aria-checked", () => {
    render(<RoleCard {...baseProps} active />);

    expect(screen.getByRole("radio").getAttribute("aria-checked")).toBe("true");
  });

  it("invokes onSelect when clicked or activated by keyboard", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<RoleCard {...baseProps} onSelect={onSelect} />);

    const option = screen.getByRole("radio");
    await user.click(option);
    option.focus();
    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledTimes(2);
  });
});
