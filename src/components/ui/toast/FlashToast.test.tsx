import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { setFlash } from "@/lib/utils/flash";
import { FlashToast } from "./FlashToast";

describe("FlashToast", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders nothing when no message is pending", () => {
    render(<FlashToast />);

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows a pending message", async () => {
    setFlash("Bewerbungsprofil gespeichert");
    render(<FlashToast />);

    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(
        "Bewerbungsprofil gespeichert",
      ),
    );
  });

  it("consumes the message so a reload does not repeat it", async () => {
    setFlash("Bewerbungsprofil gespeichert");
    const { unmount } = render(<FlashToast />);

    await waitFor(() =>
      expect(screen.getByRole("status")).toBeInstanceOf(HTMLElement),
    );
    expect(sessionStorage.getItem("renyqo.flash")).toBeNull();

    unmount();
    render(<FlashToast />);

    expect(screen.queryByRole("status")).toBeNull();
  });
});
