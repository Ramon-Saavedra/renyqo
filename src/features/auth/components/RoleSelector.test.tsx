import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RoleSelector } from "./RoleSelector";
import { accountTypeCopy } from "../copy/account-type";

const applicantCopy = accountTypeCopy.roles.applicant;
const providerCopy = accountTypeCopy.roles.provider;

function getApplicantCard() {
  return screen.getByRole("radio", { name: new RegExp(applicantCopy.title, "i") });
}

function getProviderCard() {
  return screen.getByRole("radio", { name: new RegExp(providerCopy.title, "i") });
}

function getWeiterCta() {
  return screen.getByRole("link", { name: accountTypeCopy.next });
}

describe("RoleSelector", () => {
  describe("structure", () => {
    it("renders a radiogroup labelled by accountTypeCopy.title", () => {
      render(<RoleSelector />);

      expect(
        screen.getByRole("radiogroup", { name: accountTypeCopy.title }),
      ).toBeInstanceOf(HTMLElement);
    });

    it("renders exactly one card per Role", () => {
      render(<RoleSelector />);

      expect(screen.getAllByRole("radio")).toHaveLength(2);
    });

    it("uses the applicant copy on the applicant card", () => {
      render(<RoleSelector />);
      const card = getApplicantCard();

      expect(card.textContent).toContain(applicantCopy.kicker);
      expect(card.textContent).toContain(applicantCopy.description);
      applicantCopy.points.forEach((point) => {
        expect(card.textContent).toContain(point);
      });
    });

    it("uses the provider copy on the provider card", () => {
      render(<RoleSelector />);
      const card = getProviderCard();

      expect(card.textContent).toContain(providerCopy.kicker);
      expect(card.textContent).toContain(providerCopy.description);
      providerCopy.points.forEach((point) => {
        expect(card.textContent).toContain(point);
      });
    });

    it("renders the Anmelden link pointing to /login", () => {
      render(<RoleSelector />);

      expect(
        screen
          .getByRole("link", { name: accountTypeCopy.signIn })
          .getAttribute("href"),
      ).toBe("/login");
    });

    it("renders the Weiter CTA with the primary button styling", () => {
      render(<RoleSelector />);

      expect(getWeiterCta().className).toContain("bg-primary");
    });
  });

  describe("default selection", () => {
    it("marks the applicant card as active and the provider card as inactive", () => {
      render(<RoleSelector />);

      expect(getApplicantCard().getAttribute("aria-checked")).toBe("true");
      expect(getProviderCard().getAttribute("aria-checked")).toBe("false");
    });

    it("points the Weiter CTA at /register/create-account?role=applicant", () => {
      render(<RoleSelector />);

      expect(getWeiterCta().getAttribute("href")).toBe(
        "/register/create-account?role=applicant",
      );
    });
  });

  describe("selection interaction", () => {
    it("flips aria-checked when the user picks the provider card", async () => {
      const user = userEvent.setup();
      render(<RoleSelector />);

      await user.click(getProviderCard());

      expect(getProviderCard().getAttribute("aria-checked")).toBe("true");
      expect(getApplicantCard().getAttribute("aria-checked")).toBe("false");
    });

    it("updates the Weiter CTA href to ?role=provider when provider is picked", async () => {
      const user = userEvent.setup();
      render(<RoleSelector />);

      await user.click(getProviderCard());

      expect(getWeiterCta().getAttribute("href")).toBe(
        "/register/create-account?role=provider",
      );
    });

    it("can switch back to applicant after picking provider", async () => {
      const user = userEvent.setup();
      render(<RoleSelector />);

      await user.click(getProviderCard());
      await user.click(getApplicantCard());

      expect(getApplicantCard().getAttribute("aria-checked")).toBe("true");
      expect(getProviderCard().getAttribute("aria-checked")).toBe("false");
      expect(getWeiterCta().getAttribute("href")).toBe(
        "/register/create-account?role=applicant",
      );
    });

    it("keeps applicant active and the CTA stable when its card is re-clicked", async () => {
      const user = userEvent.setup();
      render(<RoleSelector />);

      await user.click(getApplicantCard());

      expect(getApplicantCard().getAttribute("aria-checked")).toBe("true");
      expect(getWeiterCta().getAttribute("href")).toBe(
        "/register/create-account?role=applicant",
      );
    });
  });
});
