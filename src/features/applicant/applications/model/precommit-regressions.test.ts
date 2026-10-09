import { describe, expect, it } from "vitest";
import { appendUnique } from "./append-unique";
import { downloadMetadata } from "./download-metadata";
import { relativeDayLabel } from "./format-date";

const labels = { today: "Heute", yesterday: "Gestern" };

describe("appendUnique", () => {
  it("deduplicates both previous pages and the new page without mutating either", () => {
    const current = [{ id: "one", value: 1 }];
    const next = [
      { id: "one", value: 2 },
      { id: "two", value: 3 },
      { id: "two", value: 4 },
    ];
    expect(appendUnique(current, next, (item) => item.id)).toEqual([
      current[0],
      next[1],
    ]);
    expect(current).toHaveLength(1);
    expect(next).toHaveLength(3);
  });
});

describe("downloadMetadata", () => {
  it.each([
    ["application/pdf", 'attachment; filename="document.pdf"', "document.pdf"],
    [
      "image/png",
      "attachment; filename*=UTF-8''Pr%C3%BCfung.png",
      "Prüfung.png",
    ],
    ["image/jpeg", 'attachment; filename="document.jpg"', "document.jpg"],
  ])("preserves authoritative safe metadata %s", (mime, header, filename) => {
    expect(downloadMetadata(mime, header)).toEqual({
      mimeType: mime,
      filename,
    });
  });

  it.each([
    null,
    'attachment; filename="../secret.pdf"',
    'attachment; filename="NUL.pdf"',
    'attachment; filename="unsafe.exe"',
    "attachment; filename*=UTF-8''%invalid",
  ])(
    "does not invent a filename or extension for unavailable or unsafe metadata %s",
    (header) => {
      expect(downloadMetadata("application/pdf", header).filename).toBe(
        "Unterlage",
      );
    },
  );

  it("forces unknown active content to an opaque download", () => {
    expect(
      downloadMetadata("image/svg+xml", 'attachment; filename="active.svg"'),
    ).toEqual({ mimeType: "application/octet-stream", filename: "Unterlage" });
  });
});

describe("relative calendar days", () => {
  it.each([
    ["2026-03-29T12:00:00.000Z", "2026-03-29T22:30:00.000Z"],
    ["2026-10-24T12:00:00.000Z", "2026-10-25T22:30:00.000Z"],
  ])("labels yesterday across a DST transition %s", (messageAt, now) => {
    expect(relativeDayLabel(messageAt, new Date(now), labels)).toBe("Gestern");
  });
  it("compares calendar days in the requested timezone", () => {
    expect(
      relativeDayLabel(
        "2026-10-05T02:00:00.000Z",
        new Date("2026-10-05T12:00:00.000Z"),
        labels,
        "America/Santiago",
      ),
    ).toBe("Gestern");
  });
});
