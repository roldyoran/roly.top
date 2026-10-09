import { describe, it, expect } from "vitest";
import { originalUrlSchema } from "@/shared/schemas/url.schema";

describe("originalUrlSchema (seguridad)", () => {
	it("accepts normal public URLs", () => {
		expect(() =>
			originalUrlSchema.parse("https://example.com/path?q=1"),
		).not.toThrow();
	});

	it("rejects non-http schemes", () => {
		expect(() => originalUrlSchema.parse("ftp://example.com")).toThrow();
		expect(() =>
			originalUrlSchema.parse("javascript:alert(1)"),
		).toThrow();
	});

	it("rejects localhost and loopback", () => {
		expect(() => originalUrlSchema.parse("http://localhost:3000")).toThrow();
		expect(() =>
			originalUrlSchema.parse("http://localhost.evil.com"),
		).not.toThrow();
		expect(() => originalUrlSchema.parse("http://127.0.0.1/")).toThrow();
		expect(() => originalUrlSchema.parse("http://[::1]/")).toThrow();
	});

	it("rejects IP literals entirely (z.httpUrl allows no IPs)", () => {
		// `z.httpUrl()` exige un hostname con TLD de letras, así que
		// cualquier IPv4/IPv6 literal se rechaza, sea privada o pública.
		expect(() => originalUrlSchema.parse("http://10.0.0.5/")).toThrow();
		expect(() => originalUrlSchema.parse("http://192.168.1.1/")).toThrow();
		expect(() => originalUrlSchema.parse("http://172.16.0.1/")).toThrow();
		expect(() => originalUrlSchema.parse("http://172.32.0.1/")).toThrow();
		expect(() => originalUrlSchema.parse("http://8.8.8.8/")).toThrow();
	});

	it("rejects internal-only domains", () => {
		expect(() =>
			originalUrlSchema.parse("http://intranet.local"),
		).toThrow();
		expect(() =>
			originalUrlSchema.parse("http://app.internal"),
		).toThrow();
	});

	it("rejects overly long URLs", () => {
		const long = `https://example.com/${"a".repeat(2048)}`;
		expect(() => originalUrlSchema.parse(long)).toThrow();
	});
});
