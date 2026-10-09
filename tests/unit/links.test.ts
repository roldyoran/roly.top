import { describe, it, expect } from "vitest";
import { safeHostname, timeAgo, buildShortUrl } from "@/lib/links";

describe("safeHostname", () => {
	it("extracts the hostname", () => {
		expect(safeHostname("https://example.com/path?q=1")).toBe("example.com");
	});

	it("returns the raw text when it does not parse", () => {
		expect(safeHostname("not-a-url")).toBe("not-a-url");
	});
});

describe("timeAgo", () => {
	const now = new Date("2026-09-05T12:00:00.000Z").getTime();

	it("formats minutes", () => {
		expect(timeAgo("2026-09-05T11:55:00.000Z", now)).toBe("5m");
		expect(timeAgo("2026-09-05T12:00:00.000Z", now)).toBe("1m");
	});

	it("formats hours and days", () => {
		expect(timeAgo("2026-09-05T09:00:00.000Z", now)).toBe("3h");
		expect(timeAgo("2026-08-24T12:00:00.000Z", now)).toBe("12d");
	});

	it("formats months and years", () => {
		expect(timeAgo("2026-07-01T12:00:00.000Z", now)).toBe("2mo");
		expect(timeAgo("2024-09-05T12:00:00.000Z", now)).toBe("2y");
	});

	it("returns empty for invalid dates", () => {
		expect(timeAgo("invalid", now)).toBe("");
	});
});

describe("buildShortUrl", () => {
	it("joins origin and code", () => {
		expect(buildShortUrl("https://roly.top", "abc123")).toBe(
			"https://roly.top/abc123",
		);
	});

	it("strips a trailing slash from the origin", () => {
		expect(buildShortUrl("https://roly.top/", "abc123")).toBe(
			"https://roly.top/abc123",
		);
	});
});
