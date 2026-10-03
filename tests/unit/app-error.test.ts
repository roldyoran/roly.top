import { describe, it, expect } from "vitest";
import { AppError, ValidationError } from "@/server/domain/app-error";

describe("AppError", () => {
	it("has correct name, message, and code", () => {
		const error = new AppError("test message", "TEST_CODE");
		expect(error.name).toBe("AppError");
		expect(error.message).toBe("test message");
		expect(error.code).toBe("TEST_CODE");
	});

	it("is instanceof Error", () => {
		const error = new AppError("msg", "CODE");
		expect(error).toBeInstanceOf(Error);
	});

	it("is instanceof AppError", () => {
		const error = new AppError("msg", "CODE");
		expect(error).toBeInstanceOf(AppError);
	});

	it("has correct stack trace", () => {
		const error = new AppError("msg", "CODE");
		expect(error.stack).toBeDefined();
		expect(error.stack).toContain("AppError");
	});
});

describe("ValidationError", () => {
	it("has code VALIDATION_ERROR", () => {
		const error = new ValidationError("invalid data");
		expect(error.code).toBe("VALIDATION_ERROR");
	});

	it("has correct message", () => {
		const error = new ValidationError("field required");
		expect(error.message).toBe("field required");
	});

	it("is instanceof AppError", () => {
		const error = new ValidationError("msg");
		expect(error).toBeInstanceOf(AppError);
	});

	it("is instanceof Error", () => {
		const error = new ValidationError("msg");
		expect(error).toBeInstanceOf(Error);
	});

	it("name is ValidationError", () => {
		const error = new ValidationError("msg");
		expect(error.name).toBe("ValidationError");
	});
});
