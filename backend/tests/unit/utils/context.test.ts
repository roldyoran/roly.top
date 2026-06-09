import { describe, it, expect, beforeAll, afterAll, spyOn } from "bun:test";
import { checkEnvMiddleware } from "@/utils/context";

function createMockContext(envKeys: Record<string, string | undefined>) {
	let warnMessages: string[] = [];

	const ctx = {
		env: envKeys,
	} as any;

	return {
		ctx,
		getWarnings: () => warnMessages,
		spyConsole: () => {
			const spy = spyOn(console, "warn").mockImplementation((msg: string) => {
				warnMessages.push(msg);
			});
			return spy;
		},
	};
}

describe("checkEnvMiddleware", () => {
	it("debe llamar a next()", async () => {
		const { ctx } = createMockContext({});
		let nextCalled = false;

		await checkEnvMiddleware(ctx, async () => {
			nextCalled = true;
		});

		expect(nextCalled).toBe(true);
	});

	it("debe emitir warning por cada variable faltante", async () => {
		const warnMessages: string[] = [];
		const spy = spyOn(console, "warn").mockImplementation((msg: string) => {
			warnMessages.push(msg);
		});

		const { ctx } = createMockContext({});

		await checkEnvMiddleware(ctx, async () => {});

		// Debe emitir warnings para todas las claves en ENV_KEYS que no estén definidas
		expect(warnMessages.length).toBeGreaterThan(0);
		expect(warnMessages[0]).toContain("[WARNING]");
		expect(warnMessages[0]).toContain("Variable de entorno no encontrada");

		spy.mockRestore();
	});

	it("no debe emitir warnings cuando todas las variables están definidas", async () => {
		const spy = spyOn(console, "warn").mockImplementation(() => {});

		const { ctx } = createMockContext({
			CLOUFLARE_D1_DATABASES_BINDING: "binding",
			CLOUDFLARE_DATABASE_ID: "db-id",
			SERVICE_ADMIN_API_KEY: "key",
			BETTER_AUTH_SECRET: "secret",
			BETTER_AUTH_URL: "http://localhost",
			GOOGLE_CLIENT_ID: "client-id",
			GOOGLE_CLIENT_SECRET: "client-secret",
		});

		await checkEnvMiddleware(ctx, async () => {});

		expect(spy).not.toHaveBeenCalled();

		spy.mockRestore();
	});

	it("debe emitir warning solo para variables faltantes", async () => {
		const warnMessages: string[] = [];
		const spy = spyOn(console, "warn").mockImplementation((msg: string) => {
			warnMessages.push(msg);
		});

		const { ctx } = createMockContext({
			SERVICE_ADMIN_API_KEY: "key",
			BETTER_AUTH_SECRET: "secret",
		});

		await checkEnvMiddleware(ctx, async () => {});

		// Debe advertir sobre las que faltan pero no sobre las que están definidas
		for (const msg of warnMessages) {
			expect(msg).not.toContain("SERVICE_ADMIN_API_KEY");
			expect(msg).not.toContain("BETTER_AUTH_SECRET");
		}

		spy.mockRestore();
	});

	it("debe incluir el nombre de la variable faltante en el warning", async () => {
		const warnMessages: string[] = [];
		const spy = spyOn(console, "warn").mockImplementation((msg: string) => {
			warnMessages.push(msg);
		});

		const { ctx } = createMockContext({
			GOOGLE_CLIENT_ID: "id",
			GOOGLE_CLIENT_SECRET: "secret",
		});

		await checkEnvMiddleware(ctx, async () => {});

		const missingKeys = [
			"CLOUFLARE_D1_DATABASES_BINDING",
			"CLOUDFLARE_DATABASE_ID",
			"SERVICE_ADMIN_API_KEY",
			"BETTER_AUTH_SECRET",
			"BETTER_AUTH_URL",
		];

		for (const key of missingKeys) {
			expect(warnMessages.some((msg) => msg.includes(key))).toBe(true);
		}

		spy.mockRestore();
	});
});
