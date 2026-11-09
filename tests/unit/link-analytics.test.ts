import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  sharePercent,
  topEntries,
} from "@/lib/link-analytics";

describe("escapeHtml", () => {
  it("escapes markup characters", () => {
    expect(escapeHtml('<b>"MX"&</b>')).toBe(
      "&lt;b&gt;&quot;MX&quot;&amp;&lt;/b&gt;",
    );
  });

  it("leaves plain labels untouched", () => {
    expect(escapeHtml("México")).toBe("México");
  });

  it("handles empty input", () => {
    expect(escapeHtml("")).toBe("");
  });
});

describe("sharePercent", () => {
  it("computes the share of the total", () => {
    expect(sharePercent(25, 100)).toBe(25);
    expect(sharePercent(1, 3)).toBe(33);
  });

  it("returns 0 when there is nothing to share", () => {
    expect(sharePercent(0, 100)).toBe(0);
    expect(sharePercent(5, 0)).toBe(0);
  });

  it("clamps above 100", () => {
    expect(sharePercent(150, 100)).toBe(100);
  });
});

describe("topEntries", () => {
  const entries = [
    { label: "MX", count: 10 },
    { label: "US", count: 30 },
    { label: "ES", count: 20 },
  ];

  it("sorts desc and takes the top N without mutating", () => {
    expect(topEntries(entries, 2)).toEqual([
      { label: "US", count: 30 },
      { label: "ES", count: 20 },
    ]);
    expect(entries[0]).toEqual({ label: "MX", count: 10 });
  });

  it("defaults to 5 entries", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      label: `c${i}`,
      count: i,
    }));
    expect(topEntries(many)).toHaveLength(5);
    expect(topEntries(many)[0]).toEqual({ label: "c7", count: 7 });
  });

  it("returns empty for empty input or non-positive limits", () => {
    expect(topEntries([], 5)).toEqual([]);
    expect(topEntries(entries, 0)).toEqual([]);
  });
});
