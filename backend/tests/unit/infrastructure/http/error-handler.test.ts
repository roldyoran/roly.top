import { describe, it, expect, beforeAll, afterAll, spyOn } from "bun:test";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import {
	AppError,
	NotFoundError,
	UnauthorizedError,
	ValidationError,
} from "@/domain/app-error";
import { onError, type ApiErrorResponse } from "@/infrastructure/http/error-handler";

/**
 * Mock mínimo del Context de Hono.
 * Solo implementa c.json() porque es lo único que onError usa internamente
 * (a través de errorResponse y de las ramas HTTPException/unknown).
 *
 * Captura las llamadas para poder inspeccionar status y body en los asserts.
 */
function createMockContext() {
	const calls: Array<{ data: unknown; status: number }> = [];
	const ctx = {
		json: <T>(data: T, status: number): Response => {
			calls.push({ data, status });
			return new Response(JSON.stringify(data), {
				status,
				headers: { "Content-Type": "application/json" },
			});
		},
	} as unknown as Context;
	return { ctx, calls };
}

/**
 * Helper para parsear el body JSON de la Response y tiparlo como ApiErrorResponse.
 */
async function readErrorBody(response: Response): Promise<ApiErrorResponse> {
	return (await response.json()) as ApiErrorResponse;
}

describe("onError", () => {
	describe("AppError (rama existente, comportamiento preservado)", () => {
		it("debe formatear un ValidationError con status 400 y code VALIDATION_ERROR", async () => {
			const { ctx, calls } = createMockContext();

			const response = onError(new ValidationError("campo requerido"), ctx);

			expect(calls).toHaveLength(1);
			expect(calls[0]?.status).toBe(400);
			const body = await readErrorBody(response);
			expect(body).toEqual({
				success: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "campo requerido",
					statusCode: 400,
				},
			});
		});

		it("debe formatear un UnauthorizedError con status 401 y code UNAUTHORIZED", async () => {
			const { ctx, calls } = createMockContext();

			const response = onError(new UnauthorizedError(), ctx);

			expect(calls[0]?.status).toBe(401);
			const body = await readErrorBody(response);
			expect(body.error.code).toBe("UNAUTHORIZED");
			expect(body.error.statusCode).toBe(401);
		});

		it("debe formatear un NotFoundError con status 404 y code NOT_FOUND", async () => {
			const { ctx, calls } = createMockContext();

			const response = onError(new NotFoundError("recurso X"), ctx);

			expect(calls[0]?.status).toBe(404);
			const body = await readErrorBody(response);
			expect(body.error.code).toBe("NOT_FOUND");
			expect(body.error.message).toBe("recurso X");
		});

		it("debe formatear un AppError genérico con code custom (no mapeado → 500)", async () => {
			const { ctx, calls } = createMockContext();

			const response = onError(new AppError("boom", "UNKNOWN_CODE"), ctx);

			expect(calls[0]?.status).toBe(500);
			const body = await readErrorBody(response);
			expect(body.error.code).toBe("UNKNOWN_CODE");
			expect(body.error.statusCode).toBe(500);
		});
	});

	describe("HTTPException (rama nueva, fix del 500 en body inválido)", () => {
		it("debe mapear HTTPException 400 (Malformed JSON) a VALIDATION_ERROR, no a 500", async () => {
			const { ctx, calls } = createMockContext();

			const response = onError(
				new HTTPException(400, { message: "Malformed JSON in request body" }),
				ctx,
			);

			expect(calls).toHaveLength(1);
			expect(calls[0]?.status).toBe(400);
			const body = await readErrorBody(response);
			expect(body).toEqual({
				success: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "Malformed JSON in request body",
					statusCode: 400,
				},
			});
		});

		it("debe mapear HTTPException 401 a UNAUTHORIZED", async () => {
			const { ctx, calls } = createMockContext();

			const response = onError(
				new HTTPException(401, { message: "Unauthorized" }),
				ctx,
			);

			expect(calls[0]?.status).toBe(401);
			const body = await readErrorBody(response);
			expect(body.error.code).toBe("UNAUTHORIZED");
			expect(body.error.statusCode).toBe(401);
		});

		it("debe mapear HTTPException 404 a NOT_FOUND", async () => {
			const { ctx, calls } = createMockContext();

			const response = onError(
				new HTTPException(404, { message: "Not Found" }),
				ctx,
			);

			expect(calls[0]?.status).toBe(404);
			const body = await readErrorBody(response);
			expect(body.error.code).toBe("NOT_FOUND");
			expect(body.error.statusCode).toBe(404);
		});

		it("debe mapear HTTPException con status no contemplado a INTERNAL_SERVER_ERROR (500)", async () => {
			const { ctx, calls } = createMockContext();

			const response = onError(
				new HTTPException(503, { message: "Service Unavailable" }),
				ctx,
			);

			expect(calls[0]?.status).toBe(503);
			const body = await readErrorBody(response);
			expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
			expect(body.error.message).toBe("Service Unavailable");
			expect(body.error.statusCode).toBe(503);
		});

		it("debe preservar el message original del HTTPException en el body", async () => {
			const { ctx } = createMockContext();

			const response = onError(
				new HTTPException(400, { message: "Custom parser error" }),
				ctx,
			);

			const body = await readErrorBody(response);
			expect(body.error.message).toBe("Custom parser error");
		});

		it("debe devolver siempre success: false en la respuesta", async () => {
			const { ctx } = createMockContext();

			const response = onError(
				new HTTPException(400, { message: "x" }),
				ctx,
			);

			const body = await readErrorBody(response);
			expect(body.success).toBe(false);
		});
	});

	describe("Error genérico (rama catch-all, comportamiento preservado)", () => {
		// onError hace console.error("[UNHANDLED ERROR]", error) para que el operador
		// vea el stack en logs. En tests eso ensucia la salida. Silenciamos console.error
		// SOLO en este bloque y lo restauramos al terminar.
		let errorSpy: ReturnType<typeof spyOn>;
		beforeAll(() => {
			errorSpy = spyOn(console, "error").mockImplementation(() => {});
		});
		afterAll(() => {
			errorSpy.mockRestore();
		});

		it("debe convertir un Error cualquiera en 500 con INTERNAL_SERVER_ERROR", async () => {
			const { ctx, calls } = createMockContext();

			const response = onError(new Error("algo explotó"), ctx);

			expect(calls).toHaveLength(1);
			expect(calls[0]?.status).toBe(500);
			const body = await readErrorBody(response);
			expect(body).toEqual({
				success: false,
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "Error interno del servidor",
					statusCode: 500,
				},
			});
		});

		it("NO debe filtrar el mensaje original de un Error genérico al cliente", async () => {
			const { ctx } = createMockContext();

			const response = onError(new Error("DB password=hunter2"), ctx);

			const body = await readErrorBody(response);
			expect(body.error.message).toBe("Error interno del servidor");
			expect(body.error.message).not.toContain("hunter2");
		});
	});

	describe("precedencia de ramas (AppError tiene prioridad sobre HTTPException)", () => {
		it("debe usar la rama de AppError aunque el error también sea un Error-like de Hono", async () => {
			const { ctx, calls } = createMockContext();

			const error = new ValidationError("zod dijo que no");

			const response = onError(error, ctx);

			expect(calls[0]?.status).toBe(400);
			const body = await readErrorBody(response);
			expect(body.error.code).toBe("VALIDATION_ERROR");
			expect(body.error.message).toBe("zod dijo que no");
		});
	});
});
