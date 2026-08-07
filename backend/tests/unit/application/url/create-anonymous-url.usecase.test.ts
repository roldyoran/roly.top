import { describe, expect, it } from "bun:test";
import { CreateAnonymousUrlUseCase } from "@/application/url/create-anonymous-url.usecase";
import {
	createMockRepository,
	urlFixture,
} from "../../../__mocks__/url.repository.mock";

describe("CreateAnonymousUrlUseCase", () => {
	it("crea URL anónima con claimToken y expiresAt correctos", async () => {
		const repo = createMockRepository();
		const now = new Date("2026-06-01T00:00:00.000Z");
		const fixedNow = now.getTime();

		// Fijar Date.now para controlar expiresAt
		const originalDateNow = Date.now;
		Date.now = () => fixedNow;

		repo.create.mockImplementation(async (input) => ({
			...urlFixture,
			claimToken: input.claimToken ?? null,
			expiresAt: input.expiresAt ?? null,
		}));

		const useCase = new CreateAnonymousUrlUseCase(repo);
		const result = await useCase.execute({
			originalUrl: "https://example.com",
		});

		// claimToken debe ser un UUID válido
		expect(result.claimToken).toBeTruthy();
		expect(result.claimToken).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);

		// expiresAt debe ser 7 días en el futuro
		expect(result.expiresAt).toBeTruthy();
		const expiresDate = new Date(result.expiresAt!);
		const expectedExpiry = new Date(fixedNow + 7 * 24 * 60 * 60 * 1000);
		expect(expiresDate.toISOString()).toBe(expectedExpiry.toISOString());

		// Restaurar Date.now
		Date.now = originalDateNow;
	});

	it("no asigna userId", async () => {
		const repo = createMockRepository();
		repo.create.mockImplementation(async (input) => ({
			...urlFixture,
			claimToken: input.claimToken ?? null,
			expiresAt: input.expiresAt ?? null,
		}));

		const useCase = new CreateAnonymousUrlUseCase(repo);
		const result = await useCase.execute({
			originalUrl: "https://example.com",
		});

		expect(result.userId).toBeNull();
	});

	it("retorna la URL creada con el originalUrl correcto", async () => {
		const repo = createMockRepository();
		repo.create.mockImplementation(async (input) => ({
			...urlFixture,
			originalUrl: input.originalUrl,
			claimToken: input.claimToken ?? null,
			expiresAt: input.expiresAt ?? null,
		}));

		const useCase = new CreateAnonymousUrlUseCase(repo);
		const result = await useCase.execute({
			originalUrl: "https://test.dev/path",
		});

		expect(result.originalUrl).toBe("https://test.dev/path");
		expect(repo.create).toHaveBeenCalledTimes(1);
	});
});
