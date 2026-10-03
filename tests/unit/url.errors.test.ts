import { describe, it, expect } from "vitest";
import { QuotaReachedError } from "@/server/domain/url/url.errors";
import { AppError } from "@/server/domain/app-error";

describe("QuotaReachedError", () => {
	it("has code QUOTA_REACHED", () => {
		const error = new QuotaReachedError(50);
		expect(error.code).toBe("QUOTA_REACHED");
	});

	it("message includes the limit value", () => {
		const error = new QuotaReachedError(50);
		expect(error.message).toContain("50");
	});

	it("is instanceof AppError", () => {
		const error = new QuotaReachedError(50);
		expect(error).toBeInstanceOf(AppError);
	});

	it("is instanceof Error", () => {
		const error = new QuotaReachedError(50);
		expect(error).toBeInstanceOf(Error);
	});

	it("name is QuotaReachedError", () => {
		const error = new QuotaReachedError(50);
		expect(error.name).toBe("QuotaReachedError");
	});
});
