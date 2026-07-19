import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateAccountForm } from "./CreateAccountForm";
import { createAccountCopy } from "../copy/create-account";
import { getOnboardingState, register } from "@/lib/api/auth";
import type { UserRole } from "@/lib/api/auth";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/api/auth", () => ({
  register: vi.fn(),
  getOnboardingState: vi.fn(),
  resolveRedirectPath: vi.fn(() => "/provider/dashboard"),
}));

const { fields, consent } = createAccountCopy;

function renderForm(idPrefix = "test", role: UserRole = "applicant") {
  return render(<CreateAccountForm idPrefix={idPrefix} role={role} />);
}

async function fillRequiredAccountFields() {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText(fields.name.label), "Ramon Saavedra");
  await user.type(screen.getByLabelText(fields.email.label), "ramon@test.de");
  await user.type(screen.getByLabelText(fields.password.label), "Secure123");
  await user.click(document.getElementById("test-terms") as HTMLInputElement);

  return user;
}

describe("CreateAccountForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(register).mockResolvedValue({
      id: "user-1",
      name: "Ramon Saavedra",
      email: "ramon@test.de",
      role: "provider",
      providerType: "private",
      companyName: null,
    });
    vi.mocked(getOnboardingState).mockResolvedValue({ nextStep: "dashboard" });
  });

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

  describe("provider identity", () => {
    it("does not render provider identity controls for applicants", () => {
      renderForm("test", "applicant");

      expect(
        screen.queryByRole("combobox", {
          name: createAccountCopy.providerIdentity.ariaLabel,
        }),
      ).toBeNull();
      expect(screen.queryByLabelText(fields.companyName.label)).toBeNull();
    });

    it("renders provider identity controls only for providers", () => {
      renderForm("test", "provider");

      expect(
        screen.getByRole("combobox", {
          name: createAccountCopy.providerIdentity.ariaLabel,
        }),
      ).toBeInstanceOf(HTMLElement);
      expect(
        (
          screen.getByRole("combobox", {
            name: createAccountCopy.providerIdentity.ariaLabel,
          }) as HTMLSelectElement
        ).value,
      ).toBe("private");
      expect(screen.queryByLabelText(fields.companyName.label)).toBeNull();
    });

    it("shows company name field when company provider type is selected", async () => {
      const user = userEvent.setup();
      renderForm("test", "provider");

      await user.selectOptions(
        screen.getByRole("combobox", {
          name: createAccountCopy.providerIdentity.ariaLabel,
        }),
        "company",
      );

      const companyName = screen.getByLabelText(
        fields.companyName.label,
      ) as HTMLInputElement;

      expect(companyName.getAttribute("autocomplete")).toBe("organization");
      expect(companyName.required).toBe(true);
    });

    it("submits private provider identity without company name", async () => {
      renderForm("test", "provider");
      const user = await fillRequiredAccountFields();

      await user.click(
        screen.getByRole("button", { name: createAccountCopy.submit }),
      );

      await waitFor(() => {
        expect(register).toHaveBeenCalledWith(
          expect.objectContaining({
            role: "provider",
            providerType: "private",
          }),
        );
      });
      expect(vi.mocked(register).mock.calls[0]?.[0]).not.toHaveProperty(
        "companyName",
      );
    });

    it("requires company name for company providers", async () => {
      renderForm("test", "provider");
      const user = await fillRequiredAccountFields();

      await user.selectOptions(
        screen.getByRole("combobox", {
          name: createAccountCopy.providerIdentity.ariaLabel,
        }),
        "company",
      );
      await user.click(
        screen.getByRole("button", { name: createAccountCopy.submit }),
      );

      expect(
        await screen.findByText(createAccountCopy.validation.companyName),
      ).toBeInstanceOf(HTMLElement);
      expect(register).not.toHaveBeenCalled();
    });

    it("submits company provider identity with trimmed company name", async () => {
      renderForm("test", "provider");
      const user = await fillRequiredAccountFields();

      await user.selectOptions(
        screen.getByRole("combobox", {
          name: createAccountCopy.providerIdentity.ariaLabel,
        }),
        "company",
      );
      await user.type(
        screen.getByLabelText(fields.companyName.label),
        "  Renyqo Immobilien  ",
      );
      await user.click(
        screen.getByRole("button", { name: createAccountCopy.submit }),
      );

      await waitFor(() => {
        expect(register).toHaveBeenCalledWith(
          expect.objectContaining({
            role: "provider",
            providerType: "company",
            companyName: "Renyqo Immobilien",
          }),
        );
      });
    });
  });

  describe("onboarding handoff", () => {
    it("allows retrying onboarding without registering again", async () => {
      const user = userEvent.setup();
      vi.mocked(getOnboardingState)
        .mockRejectedValueOnce(new Error("onboarding unavailable"))
        .mockResolvedValueOnce({ nextStep: "dashboard" });
      renderForm("test", "applicant");

      await fillRequiredAccountFields();
      await user.click(
        screen.getByRole("button", { name: createAccountCopy.submit }),
      );

      expect(
        await screen.findByText(createAccountCopy.globalErrors.onboarding),
      ).toBeInstanceOf(HTMLElement);
      expect(register).toHaveBeenCalledTimes(1);
      expect(push).not.toHaveBeenCalled();

      await user.click(
        screen.getByRole("button", {
          name: createAccountCopy.retryOnboarding,
        }),
      );

      await waitFor(() => expect(getOnboardingState).toHaveBeenCalledTimes(2));
      expect(register).toHaveBeenCalledTimes(1);
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
