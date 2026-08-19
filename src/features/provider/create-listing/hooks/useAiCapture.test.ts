import { describe, expect, it } from "vitest";

import { normalizeAudioMimeType } from "./useAiCapture";

describe("normalizeAudioMimeType", () => {
  it("strips codec parameters from a webm mimetype", () => {
    expect(normalizeAudioMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
  });

  it("passes through a clean webm mimetype", () => {
    expect(normalizeAudioMimeType("audio/webm")).toBe("audio/webm");
  });

  it("strips codec parameters from an mp4 mimetype", () => {
    expect(normalizeAudioMimeType("audio/mp4;codecs=mp4a.40.2")).toBe(
      "audio/mp4",
    );
  });

  it("passes through a clean mp4 mimetype", () => {
    expect(normalizeAudioMimeType("audio/mp4")).toBe("audio/mp4");
  });

  it("normalizes casing differences", () => {
    expect(normalizeAudioMimeType("AUDIO/WEBM;codecs=opus")).toBe("audio/webm");
    expect(normalizeAudioMimeType("Audio/Mp4")).toBe("audio/mp4");
  });

  it("rejects an unknown mimetype instead of mislabeling it as webm", () => {
    expect(normalizeAudioMimeType("audio/ogg;codecs=opus")).toBeNull();
    expect(normalizeAudioMimeType("audio/wav")).toBeNull();
    expect(normalizeAudioMimeType("")).toBeNull();
  });
});
