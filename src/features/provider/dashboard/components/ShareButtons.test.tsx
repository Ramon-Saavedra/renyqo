import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ShareButtons } from "./ShareButtons";

const writeText = vi.fn();

describe("ShareButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText,
      },
    });
  });

  it("renders encoded WhatsApp and Facebook share links", () => {
    render(
      <ShareButtons
        title="Wohnung Mitte"
        shareUrl="https://renyqo.test/objekt/one"
      />,
    );

    expect(
      screen.getByRole("link", { name: "WhatsApp" }).getAttribute("href"),
    ).toContain("https://wa.me/?text=");
    expect(
      screen.getByRole("link", { name: "Facebook" }).getAttribute("href"),
    ).toContain("https://www.facebook.com/sharer/sharer.php");
  });

  it("copies the share url and shows copied feedback", async () => {
    writeText.mockResolvedValue(undefined);

    render(
      <ShareButtons
        title="Wohnung Mitte"
        shareUrl="https://renyqo.test/objekt/one"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Link kopieren" }));

    expect(writeText).toHaveBeenCalledWith("https://renyqo.test/objekt/one");
    await waitFor(() => {
      expect(screen.getByText("Kopiert")).not.toBeNull();
    });
  });

  it("keeps accessible share names in sidebar mode", () => {
    render(
      <ShareButtons
        title="Wohnung Mitte"
        shareUrl="https://renyqo.test/objekt/one"
        variant="sidebar"
      />,
    );

    expect(screen.getByRole("link", { name: "WhatsApp" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "Facebook" })).not.toBeNull();
    expect(screen.queryByText("WhatsApp")).toBeNull();
    expect(screen.queryByText("Facebook")).toBeNull();
  });
});
