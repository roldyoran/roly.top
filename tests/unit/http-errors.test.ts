import { describe, it, expect, vi, afterEach } from "vitest";
import { toErrorResponse } from "@/server/infrastructure/http/errors";
import { AppError, ValidationError } from "@/server/domain/app-error";
import { ZodError } from "zod";

afterEach(() => {
	vi.restoreAllMocks();
});

function parseJsonResponse(response: Response) {
	return response.json() as Promise<{
		success: boolean;
		error: { code: string; message: string; statusCode: number };
	}>;
}

describe("toErrorResponse", () => {
	it("returns 400 for ZodError", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const zodError = new ZodError([
			{
				code: "invalid_type",
				expected: "string",
				input: undefined,
				path: ["originalUrl"],
				message: "Required",
			},
		]);
		const response = toErrorResponse(zodError);
		expect(response.status).toBe(400);
		const body = await parseJsonResponse(response);
		expect(body.success).toBe(false);
		expect(body.error.code).toBe("VALIDATION_ERROR");
	});

	it("returns mapped status for AppError with known code", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const error = new AppError("taken", "SHORT_CODE_ALREADY_EXISTS");
		const response = toErrorResponse(error);
		expect(response.status).toBe(409);
		const body = await parseJsonResponse(response);
		expect(body.error.code).toBe("SHORT_CODE_ALREADY_EXISTS");
	});

	it("returns 429 for QUOTA_REACHED", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const error = new AppError("limit", "QUOTA_REACHED");
		const response = toErrorResponse(error);
		expect(response.status).toBe(429);
	});

	it("returns 404 for URL_NOT_FOUND", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const error = new AppError("not found", "URL_NOT_FOUND");
		const response = toErrorResponse(error);
		expect(response.status).toBe(404);
	});

	it("returns 500 for unknown AppError code", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const error = new AppError("something", "UNKNOWN_CODE");
		const response = toErrorResponse(error);
		expect(response.status).toBe(500);
	});

	it("returns 500 for non-AppError unknown error", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const response = toErrorResponse(new Error("unexpected"));
		expect(response.status).toBe(500);
		const body = await parseJsonResponse(response);
		expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
	});

	it("returns success: false in all error responses", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		const responses = [
			toErrorResponse(new ValidationError("bad")),
			toErrorResponse(new AppError("x", "URL_NOT_FOUND")),
			toErrorResponse(new Error("y")),
		];
		for (const res of responses) {
			const body = await parseJsonResponse(res);
			expect(body.success).toBe(false);
		}
	});

	it("includes error message in response body", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const error = new AppError("custom message here", "VALIDATION_ERROR");
		const response = toErrorResponse(error);
		const body = await parseJsonResponse(response);
		expect(body.error.message).toBe("custom message here");
	});
});
