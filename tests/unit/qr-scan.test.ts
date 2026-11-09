import { describe, it, expect } from "vitest";
import {
  isHttpUrl,
  isImageType,
  pickImageType,
  scaledAttempts,
} from "@/lib/qr-scan";

describe("isImageType", () => {
  it("accepts image mime types", () => {
    expect(isImageType("image/png")).toBe(true);
    expect(isImageType("image/jpeg")).toBe(true);
  });

  it("rejects non-image types and empty values", () => {
    expect(isImageType("text/plain")).toBe(false);
    expect(isImageType("application/pdf")).toBe(false);
    expect(isImageType("")).toBe(false);
  });
});

describe("pickImageType", () => {
  it("returns the first image type", () => {
    expect(pickImageType(["text/plain", "image/png", "image/jpeg"])).toBe(
      "image/png",
    );
  });

  it("returns null when there is no image", () => {
    expect(pickImageType(["text/plain"])).toBeNull();
    expect(pickImageType([])).toBeNull();
  });
});

describe("isHttpUrl", () => {
  it("accepts http(s) URLs", () => {
    expect(isHttpUrl("https://roly.top/abc")).toBe(true);
    expect(isHttpUrl("http://localhost:4321/")).toBe(true);
    expect(isHttpUrl("  https://example.com  ")).toBe(true);
  });

  it("rejects dangerous schemes and plain text", () => {
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("data:text/html,<h1>x</h1>")).toBe(false);
    expect(isHttpUrl("not a link")).toBe(false);
    expect(isHttpUrl("")).toBe(false);
    expect(isHttpUrl("ftp://files.example.com")).toBe(false);
  });
});

describe("scaledAttempts", () => {
  it("tries full size when the image is small enough", () => {
    expect(scaledAttempts(800, 600, 1400)).toEqual([{ width: 800, height: 600 }]);
  });

  it("tries scaled first and full size as fallback for big images", () => {
    expect(scaledAttempts(2800, 1400, 1400)).toEqual([
      { width: 1400, height: 700 },
      { width: 2800, height: 1400 },
    ]);
  });

  it("never returns zero dimensions", () => {
    for (const a of scaledAttempts(3, 2, 1)) {
      expect(a.width).toBeGreaterThanOrEqual(1);
      expect(a.height).toBeGreaterThanOrEqual(1);
    }
  });
});
