import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CreateAccountForm } from "./CreateAccountForm";
import { createAccountCopy } from "../copy/create-account";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const { fields, consent } = createAccountCopy;

function renderForm(idPrefix = "test") {
  return render(<CreateAccountForm idPrefix={idPrefix} role="applicant" />);
}

describe("CreateAccountForm", () => {
  describe("structure", () => {
    it("renders a form element with noValidate", () => {
      const { container } = renderForm();
      const form = container.querySelector("form");

      expect(form).toBeInstanceOf(HTMLFormElement);
      expect((form as HTMLFormElement).noValidate).toBe(true);
    });
  });

  describe("social sign-in", () => {
    it("renders the Google button using the copy", () => {
      renderForm();

      const button = screen.getByRole("button", {
        name: createAccountCopy.google,
      });

      expect(button.textContent).toContain(createAccountCopy.google);
    });

    it("renders the Apple button using the copy", () => {
      renderForm();

      const button = screen.getByRole("button", {
        name: createAccountCopy.apple,
      });

      expect(button.textContent).toContain(createAccountCopy.apple);
    });
  });

  describe("divider", () => {
    it("renders the divider copy", () => {
      renderForm();

      expect(screen.getByText(createAccountCopy.divider)).toBeInstanceOf(
        HTMLElement,
      );
    });
  });

  describe("name field", () => {
    it("renders a labelled text input with autoComplete=name", () => {
      renderForm();

      const input = screen.getByLabelText(
        fields.name.label,
      ) as HTMLInputElement;

      expect(input.tagName).toBe("INPUT");
      expect(input.getAttribute("type")).toBe("text");
      expect(input.getAttribute("autocomplete")).toBe("name");
      expect(input.getAttribute("placeholder")).toBe(fields.name.placeholder);
      expect(input.required).toBe(true);
    });
  });

  describe("email field", () => {
    it("renders a labelled email input with inputMode and autoComplete email", () => {
      renderForm();

      const input = screen.getByLabelText(
        fields.email.label,
      ) as HTMLInputElement;

      expect(input.getAttribute("type")).toBe("email");
      expect(input.getAttribute("autocomplete")).toBe("email");
      expect(input.getAttribute("inputmode")).toBe("email");
      expect(input.getAttribute("placeholder")).toBe(fields.email.placeholder);
      expect(input.required).toBe(true);
    });
  });

  describe("password field", () => {
    it("renders a labelled password input masked by default", () => {
      renderForm();

      const input = screen.getByLabelText(
        fields.password.label,
      ) as HTMLInputElement;

      expect(input.getAttribute("type")).toBe("password");
      expect(input.getAttribute("autocomplete")).toBe("new-password");
      expect(input.minLength).toBe(8);
      expect(input.required).toBe(true);
    });

    it("renders the suggest password button", () => {
      renderForm();

      expect(
        screen.getByRole("button", {
          name: createAccountCopy.passwordStrength.suggest,
        }),
      ).toBeInstanceOf(HTMLElement);
    });
  });

  describe("idPrefix wiring", () => {
    it("composes input IDs from the given prefix", () => {
      renderForm("foo");

      expect(screen.getByLabelText(fields.name.label).getAttribute("id")).toBe(
        "foo-name",
      );
      expect(screen.getByLabelText(fields.email.label).getAttribute("id")).toBe(
        "foo-email",
      );
      expect(
        screen.getByLabelText(fields.password.label).getAttribute("id"),
      ).toBe("foo-password");
    });

    it("composes the consent checkbox id from the prefix as well", () => {
      renderForm("foo");

      const checkbox = document.getElementById("foo-terms") as HTMLInputElement;

      expect(checkbox).toBeInstanceOf(HTMLInputElement);
      expect(checkbox.getAttribute("type")).toBe("checkbox");
    });

    it("honors a different prefix on a separate render", () => {
      renderForm("bar");

      expect(screen.getByLabelText(fields.name.label).getAttribute("id")).toBe(
        "bar-name",
      );
    });
  });

  describe("consent checkbox", () => {
    it("renders a required checkbox", () => {
      renderForm("test");

      const checkbox = document.getElementById(
        "test-terms",
      ) as HTMLInputElement;

      expect(checkbox.required).toBe(true);
    });

    it("renders the terms link pointing at the terms anchor", () => {
      renderForm();

      const link = screen.getByRole("link", { name: consent.terms });

      expect(link.getAttribute("href")).toBe("#nutzungsbedingungen");
    });

    it("renders the privacy link pointing at the privacy anchor", () => {
      renderForm();

      const link = screen.getByRole("link", { name: consent.privacy });

      expect(link.getAttribute("href")).toBe("#datenschutz");
    });
  });

  describe("submit button", () => {
    it("renders a submit-typed button with the submit copy", () => {
      renderForm();

      const submit = screen.getByRole("button", {
        name: createAccountCopy.submit,
      }) as HTMLButtonElement;

      expect(submit.getAttribute("type")).toBe("submit");
    });
  });

  describe("sign-in footer", () => {
    it("renders the 'already have an account?' copy", () => {
      renderForm();

      expect(screen.getByText(createAccountCopy.alreadyAccount)).toBeInstanceOf(
        HTMLElement,
      );
    });

    it("renders an Anmelden link pointing to /login", () => {
      renderForm();

      const link = screen.getByRole("link", { name: createAccountCopy.signIn });

      expect(link.getAttribute("href")).toBe("/login");
    });
  });
});
