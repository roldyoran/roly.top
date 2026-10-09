import { describe, it, expect } from "vitest";
import { getAdminEmails, isAdmin } from "@/server/config/admin";

describe("getAdminEmails", () => {
	it("parses a comma-separated list normalizing case and whitespace", () => {
		expect(getAdminEmails("Admin@Roly.top, user@example.com ")).toEqual([
			"admin@roly.top",
			"user@example.com",
		]);
	});

	it("returns an empty array for empty input", () => {
		expect(getAdminEmails("")).toEqual([]);
		expect(getAdminEmails("   ")).toEqual([]);
	});
});

describe("isAdmin", () => {
	it("returns false when there is no user", () => {
		expect(isAdmin(null, "admin@roly.top")).toBe(false);
		expect(isAdmin(undefined, "admin@roly.top")).toBe(false);
	});

	it("returns false when the allowlist is empty", () => {
		expect(isAdmin({ email: "admin@roly.top" }, "")).toBe(false);
	});

	it("matches emails case-insensitively", () => {
		expect(isAdmin({ email: "Admin@Roly.Top" }, "admin@roly.top")).toBe(
			true,
		);
	});

	it("rejects non-listed emails", () => {
		expect(isAdmin({ email: "other@roly.top" }, "admin@roly.top")).toBe(
			false,
		);
	});
});
