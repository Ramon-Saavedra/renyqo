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
  describe("structure", () => {
    it("renders a button with role='radio'", () => {
      render(<RoleCard {...baseProps} />);

      expect(
        screen.getByRole("radio", { name: /ich suche ein zuhause/i }),
      ).toBeInstanceOf(HTMLButtonElement);
    });

    it("sets the button type to 'button' to avoid implicit form submits", () => {
      render(<RoleCard {...baseProps} />);

      expect(screen.getByRole("radio").getAttribute("type")).toBe("button");
    });

    it("renders the kicker, title and description text", () => {
      render(<RoleCard {...baseProps} />);

      expect(screen.getByText(baseProps.kicker)).toBeInstanceOf(HTMLElement);
      expect(
        screen.getByRole("heading", { name: baseProps.title }),
      ).toBeInstanceOf(HTMLHeadingElement);
      expect(screen.getByText(baseProps.description)).toBeInstanceOf(
        HTMLElement,
      );
    });

    it("renders every point in a list item", () => {
      render(<RoleCard {...baseProps} />);

      const items = screen.getAllByRole("listitem");

      expect(items).toHaveLength(baseProps.points.length);
      baseProps.points.forEach((point) => {
        expect(screen.getByText(point)).toBeInstanceOf(HTMLElement);
      });
    });

    it("renders the supplied lucide glyph as a decorative svg", () => {
      const { container } = render(<RoleCard {...baseProps} />);
      const svgs = container.querySelectorAll("svg");

      expect(svgs.length).toBeGreaterThan(0);
      svgs.forEach((svg) => {
        expect(svg.getAttribute("aria-hidden")).toBe("true");
      });
    });

    it("renders the rotating benefits region with at least the first benefit visible", () => {
      render(<RoleCard {...baseProps} />);

      expect(screen.getByText(baseProps.benefits[0])).toBeInstanceOf(
        HTMLElement,
      );
    });
  });

  describe("active state", () => {
    it("reflects active=false via aria-checked", () => {
      render(<RoleCard {...baseProps} active={false} />);

      expect(screen.getByRole("radio").getAttribute("aria-checked")).toBe(
        "false",
      );
    });

    it("reflects active=true via aria-checked", () => {
      render(<RoleCard {...baseProps} active />);

      expect(screen.getByRole("radio").getAttribute("aria-checked")).toBe(
        "true",
      );
    });

    it("applies the primary border when active", () => {
      render(<RoleCard {...baseProps} active />);

      expect(screen.getByRole("radio").className).toContain("border-primary");
    });

    it("applies the muted border when inactive", () => {
      render(<RoleCard {...baseProps} active={false} />);
      const button = screen.getByRole("radio");

      expect(button.className).toContain("border-border");
      expect(button.className).not.toContain("border-primary");
    });

    it("renders the side indicator bar only when active", () => {
      const { container, rerender } = render(
        <RoleCard {...baseProps} active={false} />,
      );

      expect(container.querySelector("span.bg-primary.w-0\\.75")).toBeNull();

      rerender(<RoleCard {...baseProps} active />);

      expect(
        container.querySelector("span.bg-primary.w-0\\.75"),
      ).toBeInstanceOf(HTMLElement);
    });
  });

  describe("interaction", () => {
    it("invokes onSelect when the user clicks the card", async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<RoleCard {...baseProps} onSelect={onSelect} />);

      await user.click(screen.getByRole("radio"));

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("invokes onSelect again on subsequent clicks (selection is the parent's job)", async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<RoleCard {...baseProps} active onSelect={onSelect} />);

      const button = screen.getByRole("radio");
      await user.click(button);
      await user.click(button);

      expect(onSelect).toHaveBeenCalledTimes(2);
    });

    it("invokes onSelect when activated via keyboard (Enter)", async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      render(<RoleCard {...baseProps} onSelect={onSelect} />);

      screen.getByRole("radio").focus();
      await user.keyboard("{Enter}");

      expect(onSelect).toHaveBeenCalledTimes(1);
    });
  });
});
