import { describe, it, expect, vi, afterEach } from "vitest";
import { apiFetch, ApiError } from "@/lib/api-client";

function mockFetchOnce(json: unknown, status = 200) {
	const res = {
		ok: status >= 200 && status < 300,
		status,
		json: async () => json,
	} as Response;
	vi.stubGlobal("fetch", vi.fn().mockResolvedValue(res));
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("apiFetch", () => {
	it("returns the parsed body on success", async () => {
		mockFetchOnce({ success: true, data: { total: 3 } });
		const body = await apiFetch<{ success: boolean; data: { total: number } }>(
			"/api/v1/dashboard/summary",
		);
		expect(body.data.total).toBe(3);
	});

	it("appends query params to the URL", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ success: true }),
		} as Response);
		vi.stubGlobal("fetch", fetchMock);

		await apiFetch("/api/v1/dashboard/summary", {
			query: { rangeDays: 30 },
		});
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/v1/dashboard/summary?rangeDays=30",
			expect.objectContaining({ credentials: "include" }),
		);
	});

	it("throws ApiError with the backend code on HTTP errors", async () => {
		mockFetchOnce(
			{
				success: false,
				error: { code: "RATE_LIMITED", message: "Too fast", statusCode: 429 },
			},
			429,
		);
		const err = await apiFetch("/api/v1/urls").catch((e) => e);
		expect(err).toBeInstanceOf(ApiError);
		expect((err as ApiError).code).toBe("RATE_LIMITED");
		expect((err as ApiError).status).toBe(429);
	});

	it("throws NETWORK_ERROR when fetch itself fails", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockRejectedValue(new TypeError("fetch failed")),
		);
		const err = await apiFetch("/api/v1/urls").catch((e) => e);
		expect(err).toBeInstanceOf(ApiError);
		expect((err as ApiError).code).toBe("NETWORK_ERROR");
	});

	it("throws INVALID_RESPONSE when the body is not JSON", async () => {
		// `as unknown as Response`: el mock solo implementa el subconjunto
		// de `Response` que `apiFetch` usa (`ok`/`status`/`json`).
		const broken = {
			ok: false,
			status: 500,
			json: async () => {
				throw new SyntaxError("Unexpected token");
			},
		} as unknown as Response;
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(broken));
		const err = await apiFetch("/api/v1/urls").catch((e) => e);
		expect(err).toBeInstanceOf(ApiError);
		expect((err as ApiError).code).toBe("INVALID_RESPONSE");
	});
});
