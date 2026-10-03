import { describe, it, expect } from "vitest";
import { DEFAULT_SITE_URL, getSiteUrl, siteHost } from "@/lib/site";

describe("getSiteUrl", () => {
	it("returns the default when nothing is configured", () => {
		expect(getSiteUrl("")).toBe(DEFAULT_SITE_URL);
		expect(getSiteUrl("   ")).toBe(DEFAULT_SITE_URL);
		expect(getSiteUrl("not-a-url")).toBe(DEFAULT_SITE_URL);
	});

	it("trims whitespace and trailing slashes", () => {
		expect(getSiteUrl("  https://ejemplo.com///  ")).toBe("https://ejemplo.com");
	});

	it("keeps a valid configured base untouched", () => {
		expect(getSiteUrl("https://mi-dominio.dev")).toBe("https://mi-dominio.dev");
	});
});

describe("siteHost", () => {
	it("strips the protocol for display next to the short code", () => {
		expect(siteHost("https://mi-dominio.dev")).toBe("mi-dominio.dev");
		expect(siteHost("http://localhost:4321")).toBe("localhost:4321");
	});

	it("falls back to the default host", () => {
		expect(siteHost("")).toBe("roly.top");
	});
});
