import { describe, it, expect } from "vitest";
import { getAuthEnv } from "@/server/config/env";

describe("getAuthEnv", () => {
	it("reads values from the worker env object", () => {
		const result = getAuthEnv({
			GOOGLE_CLIENT_ID: "client-id",
			GOOGLE_CLIENT_SECRET: "client-secret",
			BETTER_AUTH_SECRET: "secret",
			BETTER_AUTH_URL: "https://roly.top",
			ADMIN_EMAILS: "admin@roly.top",
			NODE_ENV: "production",
		});

		expect(result.googleClientId).toBe("client-id");
		expect(result.googleClientSecret).toBe("client-secret");
		expect(result.betterAuthSecret).toBe("secret");
		expect(result.betterAuthUrl).toBe("https://roly.top");
		expect(result.adminEmailsRaw).toBe("admin@roly.top");
		expect(result.useSecureCookies).toBe(true);
	});

	it("enables secure cookies for https baseURL even without NODE_ENV", () => {
		const result = getAuthEnv({ BETTER_AUTH_URL: "https://roly.top" });
		expect(result.useSecureCookies).toBe(true);
	});

	it("disables secure cookies for http URLs in development", () => {
		const result = getAuthEnv({
			BETTER_AUTH_URL: "http://localhost:4321",
			NODE_ENV: "development",
		});
		expect(result.useSecureCookies).toBe(false);
	});

	it("defaults to empty credentials when nothing is provided", () => {
		const result = getAuthEnv({});
		expect(result.googleClientId).toBe("");
		expect(result.googleClientSecret).toBe("");
		expect(result.adminEmailsRaw).toBe("");
	});
});
