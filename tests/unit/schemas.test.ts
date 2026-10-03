import { describe, it, expect } from "vitest";
import { createUrlSchema } from "@/server/utils/schemas";

describe("createUrlSchema", () => {
	describe("originalUrl", () => {
		it("accepts valid https URL", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "https://example.com",
			});
			expect(result.success).toBe(true);
		});

		it("accepts valid http URL", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "http://example.com/path?q=1",
			});
			expect(result.success).toBe(true);
		});

		it("rejects missing originalUrl", () => {
			const result = createUrlSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it("rejects ftp URL", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "ftp://example.com",
			});
			expect(result.success).toBe(false);
		});

		it("rejects javascript URL", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "javascript:alert(1)",
			});
			expect(result.success).toBe(false);
		});

		it("rejects non-url string", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "not-a-url",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("customAlias", () => {
		it("accepts valid alias (lowercase alphanumeric, 3-9 chars)", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "https://example.com",
				customAlias: "myalias",
			});
			expect(result.success).toBe(true);
		});

		it("accepts alias with numbers", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "https://example.com",
				customAlias: "abc123",
			});
			expect(result.success).toBe(true);
		});

		it("accepts 3-char alias", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "https://example.com",
				customAlias: "abc",
			});
			expect(result.success).toBe(true);
		});

		it("accepts 9-char alias", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "https://example.com",
				customAlias: "abcdefghi",
			});
			expect(result.success).toBe(true);
		});

		it("accepts missing customAlias (optional)", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "https://example.com",
			});
			expect(result.success).toBe(true);
		});

		it("accepts empty customAlias", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "https://example.com",
				customAlias: "",
			});
			expect(result.success).toBe(true);
		});

		it("rejects alias with uppercase", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "https://example.com",
				customAlias: "MyAlias",
			});
			expect(result.success).toBe(false);
		});

		it("rejects alias with special characters", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "https://example.com",
				customAlias: "my-alias",
			});
			expect(result.success).toBe(false);
		});

		it("rejects alias with spaces", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "https://example.com",
				customAlias: "my alias",
			});
			expect(result.success).toBe(false);
		});

		it("accepts 1-char alias", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "https://example.com",
				customAlias: "a",
			});
			expect(result.success).toBe(true);
		});

		it("rejects 10-char alias (too long)", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "https://example.com",
				customAlias: "abcdefghij",
			});
			expect(result.success).toBe(false);
		});
	});
});
