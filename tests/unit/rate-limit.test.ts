import { describe, it, expect, beforeEach } from "vitest";
import {
	checkRateLimit,
	clearRateLimits,
	rateLimitExceededResponse,
} from "@/server/utils/rate-limit";

describe("checkRateLimit", () => {
	beforeEach(() => {
		clearRateLimits();
	});

	it("allows requests below the limit", () => {
		expect(checkRateLimit("k", 3, 60_000, 0).allowed).toBe(true);
		expect(checkRateLimit("k", 3, 60_000, 1_000).allowed).toBe(true);
		expect(checkRateLimit("k", 3, 60_000, 2_000).allowed).toBe(true);
	});

	it("blocks requests once the limit is reached", () => {
		checkRateLimit("k", 2, 60_000, 0);
		checkRateLimit("k", 2, 60_000, 1_000);
		const verdict = checkRateLimit("k", 2, 60_000, 2_000);
		expect(verdict.allowed).toBe(false);
		expect(verdict.retryAfterMs).toBeGreaterThan(0);
	});

	it("resets the counter when the window expires", () => {
		checkRateLimit("k", 1, 60_000, 0);
		expect(checkRateLimit("k", 1, 60_000, 1_000).allowed).toBe(false);
		expect(checkRateLimit("k", 1, 60_000, 60_000).allowed).toBe(true);
	});

	it("tracks different keys independently", () => {
		checkRateLimit("a", 1, 60_000, 0);
		expect(checkRateLimit("a", 1, 60_000, 1_000).allowed).toBe(false);
		expect(checkRateLimit("b", 1, 60_000, 1_000).allowed).toBe(true);
	});
});

describe("rateLimitExceededResponse", () => {
	it("returns a 429 JSON response with Retry-After", async () => {
		const res = rateLimitExceededResponse(2_500);
		expect(res.status).toBe(429);
		expect(res.headers.get("Retry-After")).toBe("3");
		const json = (await res.json()) as {
			success: boolean;
			error: { code: string };
		};
		expect(json.success).toBe(false);
		expect(json.error.code).toBe("RATE_LIMITED");
	});
});
