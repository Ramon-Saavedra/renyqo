import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(import.meta.dirname, "globals.css"), "utf8");
const layout = readFileSync(resolve(import.meta.dirname, "layout.tsx"), "utf8");
const mobileChat = readFileSync(
  resolve(
    import.meta.dirname,
    "../components/shared/conversation/MobileChatView.tsx",
  ),
  "utf8",
);

const roleChats = [
  "../features/provider/dashboard/applicant-workflow/components/MessagesSection.tsx",
  "../features/applicant/applications/components/workspace/MessagesSection.tsx",
].map((file) => readFileSync(resolve(import.meta.dirname, file), "utf8"));

describe("safe-area tokens", () => {
  it("exposes the four platform insets with a zero fallback", () => {
    expect(css).toContain("--safe-area-top: env(safe-area-inset-top, 0px);");
    expect(css).toContain(
      "--safe-area-right: env(safe-area-inset-right, 0px);",
    );
    expect(css).toContain(
      "--safe-area-bottom: env(safe-area-inset-bottom, 0px);",
    );
    expect(css).toContain("--safe-area-left: env(safe-area-inset-left, 0px);");
    expect(
      [...css.matchAll(/env\(safe-area-inset-[a-z]+,\s*([^)]+)\)/g)].map(
        (match) => match[1],
      ),
    ).toEqual(["0px", "0px", "0px", "0px"]);
    expect(css).toContain("@utility pb-safe");
    expect(layout).toContain('viewportFit: "cover"');
  });

  it("lets the shared mobile chat consume the bottom inset once", () => {
    expect(mobileChat).toContain("pb-safe");
    expect(mobileChat).toContain("100dvh");
    expect(mobileChat.match(/pb-safe/g)).toHaveLength(1);
    for (const source of roleChats) {
      expect(source).not.toContain("pb-safe");
      expect(source).not.toContain("safe-area-inset");
    }
  });
});
