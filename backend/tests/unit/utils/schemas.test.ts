import { describe, it, expect } from "bun:test";
import { shortCodeSchema, createUrlSchema } from "@/utils/schemas";

describe("shortCodeSchema", () => {
	describe("casos válidos", () => {
		it("debe aceptar un shortCode de letras minúsculas", () => {
			const result = shortCodeSchema.safeParse({ shortCode: "abc" });
			expect(result.success).toBe(true);
		});

		it("debe aceptar un shortCode de números", () => {
			const result = shortCodeSchema.safeParse({ shortCode: "123" });
			expect(result.success).toBe(true);
		});

		it("debe aceptar un shortCode alfanumérico de exactamente 9 caracteres", () => {
			const result = shortCodeSchema.safeParse({ shortCode: "ab1cd2ef3" });
			expect(result.success).toBe(true);
		});

		it("debe aceptar un shortCode de 1 carácter", () => {
			const result = shortCodeSchema.safeParse({ shortCode: "a" });
			expect(result.success).toBe(true);
		});
	});

	describe("casos inválidos", () => {
		it("debe rechazar un shortCode vacío", () => {
			const result = shortCodeSchema.safeParse({ shortCode: "" });
			expect(result.success).toBe(false);
		});

		it("debe rechazar un shortCode de más de 9 caracteres", () => {
			const result = shortCodeSchema.safeParse({ shortCode: "toolong1234" });
			expect(result.success).toBe(false);
		});

		it("debe rechazar un shortCode con letras mayúsculas", () => {
			const result = shortCodeSchema.safeParse({ shortCode: "ABC" });
			expect(result.success).toBe(false);
		});

		it("debe rechazar un shortCode con caracteres especiales", () => {
			const result = shortCodeSchema.safeParse({ shortCode: "hono!" });
			expect(result.success).toBe(false);
		});

		it("debe rechazar un shortCode con espacios", () => {
			const result = shortCodeSchema.safeParse({ shortCode: "ho no" });
			expect(result.success).toBe(false);
		});
	});
});

describe("createUrlSchema", () => {
	describe("casos válidos", () => {
		it("debe aceptar una URL válida sin shortCode", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "https://google.com",
			});
			expect(result.success).toBe(true);
		});

		it("debe aceptar una URL con shortCode opcional válido", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "https://hono.dev",
				shortCode: "hono",
			});
			expect(result.success).toBe(true);
		});

		it("debe aceptar URL con protocolo http", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "http://example.com",
			});
			expect(result.success).toBe(true);
		});

		it("debe aceptar URL con ruta y query params", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "https://example.com/path?foo=bar&baz=1",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("casos inválidos", () => {
		it("debe rechazar cuando originalUrl no es una URL válida", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "no-es-una-url",
			});
			expect(result.success).toBe(false);
		});

		it("debe rechazar cuando falta originalUrl", () => {
			const result = createUrlSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it("debe rechazar cuando shortCode es inválido", () => {
			const result = createUrlSchema.safeParse({
				originalUrl: "https://google.com",
				shortCode: "INVALIDO",
			});
			expect(result.success).toBe(false);
		});

		it("debe rechazar originalUrl vacía", () => {
			const result = createUrlSchema.safeParse({ originalUrl: "" });
			expect(result.success).toBe(false);
		});
	});
});
