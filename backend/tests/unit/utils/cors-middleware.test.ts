import { describe, it, expect } from "bun:test";
import { corsMiddleware } from "@/utils/cors-middleware";

function createMockContext(options?: { origin?: string; method?: string }) {
	const headers: Record<string, string> = {};
	let capturedStatus: number | undefined;

	const ctx = {
		req: {
			header: (name: string) => {
				if (name === "Origin") return options?.origin;
				return undefined;
			},
			method: options?.method ?? "GET",
		},
		header: (name: string, value: string) => {
			headers[name] = value;
		},
		status: (code: number) => {
			capturedStatus = code;
		},
		body: (b: null) => new Response(b, { status: capturedStatus ?? 204 }),
	} as any;

	return { ctx, headers, getStatus: () => capturedStatus };
}

describe("corsMiddleware", () => {
	describe("configuración por defecto", () => {
		it("debe permitir origins por defecto (localhost:5173)", async () => {
			const { ctx, headers } = createMockContext({
				origin: "http://localhost:5173",
			});
			const middleware = corsMiddleware();

			await middleware(ctx, async () => {});

			expect(headers["Access-Control-Allow-Origin"]).toBe(
				"http://localhost:5173",
			);
			expect(headers["Vary"]).toBe("Origin");
		});

		it("debe incluir headers Allow-Methods por defecto", async () => {
			const { ctx, headers } = createMockContext();
			const middleware = corsMiddleware();

			await middleware(ctx, async () => {});

			expect(headers["Access-Control-Allow-Methods"]).toBe(
				"GET, POST, PUT, DELETE, OPTIONS, PATCH",
			);
		});

		it("debe incluir headers Allow-Headers por defecto", async () => {
			const { ctx, headers } = createMockContext();
			const middleware = corsMiddleware();

			await middleware(ctx, async () => {});

			expect(headers["Access-Control-Allow-Headers"]).toBe(
				"Content-Type, x-api-key, Authorization",
			);
		});

		it("debe incluir Max-Age de 24 horas", async () => {
			const { ctx, headers } = createMockContext();
			const middleware = corsMiddleware();

			await middleware(ctx, async () => {});

			expect(headers["Access-Control-Max-Age"]).toBe("86400");
		});

		it("debe incluir Allow-Credentials cuando origin no es wildcard", async () => {
			const { ctx, headers } = createMockContext();
			const middleware = corsMiddleware();

			await middleware(ctx, async () => {});

			expect(headers["Access-Control-Allow-Credentials"]).toBe("true");
		});
	});

	describe("origin personalizado", () => {
		it("debe permitir un solo origin como string", async () => {
			const { ctx, headers } = createMockContext({
				origin: "https://example.com",
			});
			const middleware = corsMiddleware({ origin: "https://example.com" });

			await middleware(ctx, async () => {});

			expect(headers["Access-Control-Allow-Origin"]).toBe(
				"https://example.com",
			);
		});

		it("debe permitir un array de origins", async () => {
			const { ctx, headers } = createMockContext({
				origin: "https://app.example.com",
			});
			const middleware = corsMiddleware({
				origin: ["https://example.com", "https://app.example.com"],
			});

			await middleware(ctx, async () => {});

			expect(headers["Access-Control-Allow-Origin"]).toBe(
				"https://app.example.com",
			);
		});

		it("debe rechazar un origin no listado", async () => {
			const { ctx, headers } = createMockContext({
				origin: "https://evil.com",
			});
			const middleware = corsMiddleware({
				origin: ["https://example.com"],
			});

			await middleware(ctx, async () => {});

			expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
		});

		it("debe usar string directamente cuando origin es un string no coincidente", async () => {
			const { ctx, headers } = createMockContext({
				origin: "https://evil.com",
			});
			const middleware = corsMiddleware({ origin: "https://example.com" });

			await middleware(ctx, async () => {});

			expect(headers["Access-Control-Allow-Origin"]).toBe(
				"https://example.com",
			);
		});
	});

	describe("preflight (OPTIONS)", () => {
		it("debe responder 204 y retornar un body para OPTIONS", async () => {
			const { ctx, headers } = createMockContext({ method: "OPTIONS" });
			const middleware = corsMiddleware();

			const response = await middleware(ctx, async () => {});

			expect(headers["Access-Control-Allow-Methods"]).toBeDefined();
			expect(response).toBeInstanceOf(Response);
		});

		it("debe incluir headers CORS en respuestas OPTIONS", async () => {
			const { ctx, headers } = createMockContext({
				method: "OPTIONS",
				origin: "http://localhost:5173",
			});
			const middleware = corsMiddleware();

			await middleware(ctx, async () => {});

			expect(headers["Access-Control-Allow-Origin"]).toBeDefined();
			expect(headers["Access-Control-Allow-Headers"]).toBeDefined();
			expect(headers["Access-Control-Max-Age"]).toBeDefined();
		});
	});

	describe("wildcard origin (*)", () => {
		it("no debe incluir Allow-Credentials cuando origin es *", async () => {
			const { ctx, headers } = createMockContext();
			const middleware = corsMiddleware({ origin: "*" });

			await middleware(ctx, async () => {});

			expect(headers["Access-Control-Allow-Credentials"]).toBeUndefined();
		});
	});

	describe("options personalizadas", () => {
		it("debe respetar methods personalizados", async () => {
			const { ctx, headers } = createMockContext();
			const middleware = corsMiddleware({ methods: ["GET", "POST"] });

			await middleware(ctx, async () => {});

			expect(headers["Access-Control-Allow-Methods"]).toBe("GET, POST");
		});

		it("debe respetar allowedHeaders personalizados", async () => {
			const { ctx, headers } = createMockContext();
			const middleware = corsMiddleware({
				allowedHeaders: ["X-Custom-Header"],
			});

			await middleware(ctx, async () => {});

			expect(headers["Access-Control-Allow-Headers"]).toBe(
				"X-Custom-Header",
			);
		});

		it("debe respetar maxAge personalizado", async () => {
			const { ctx, headers } = createMockContext();
			const middleware = corsMiddleware({ maxAge: 3600 });

			await middleware(ctx, async () => {});

			expect(headers["Access-Control-Max-Age"]).toBe("3600");
		});
	});

	describe("llamada a next()", () => {
		it("debe llamar a next() en requests que no son OPTIONS", async () => {
			const { ctx } = createMockContext({ method: "GET" });
			const middleware = corsMiddleware();
			let nextCalled = false;

			await middleware(ctx, async () => {
				nextCalled = true;
			});

			expect(nextCalled).toBe(true);
		});
	});
});
