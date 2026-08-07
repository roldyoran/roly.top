import { describe, expect, it } from "bun:test";
import { ClaimUrlUseCase } from "@/application/url/claim-url.usecase";
import {
	createMockRepository,
	urlFixture,
} from "../../../__mocks__/url.repository.mock";
import { NotFoundError } from "@/domain/app-error";
import {
	UrlExpiredError,
	UrlAlreadyClaimedError,
} from "@/domain/url/url.errors";

describe("ClaimUrlUseCase", () => {
	it("reclama URL exitosamente", async () => {
		const repo = createMockRepository();
		const claimToken = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
		const userId = "user-123";

		repo.findByClaimToken.mockResolvedValue({
			...urlFixture,
			claimToken,
			expiresAt: new Date(Date.now() + 86400000).toISOString(), // 1 día en el futuro
		});

		repo.claimUrl.mockResolvedValue({
			...urlFixture,
			userId,
			claimToken: null,
			expiresAt: null,
		});

		const useCase = new ClaimUrlUseCase(repo);
		const result = await useCase.execute({ claimToken, userId });

		expect(result.userId).toBe(userId);
		expect(result.claimToken).toBeNull();
		expect(result.expiresAt).toBeNull();
		expect(repo.findByClaimToken).toHaveBeenCalledWith(claimToken);
		expect(repo.claimUrl).toHaveBeenCalledWith(claimToken, userId);
	});

	it("lanza NotFoundError si claimToken no existe", async () => {
		const repo = createMockRepository();
		repo.findByClaimToken.mockResolvedValue(null);

		const useCase = new ClaimUrlUseCase(repo);

		await expect(
			useCase.execute({
				claimToken: "token-inexistente",
				userId: "user-123",
			}),
		).rejects.toThrow(NotFoundError);
	});

	it("lanza UrlExpiredError si la URL está expirada", async () => {
		const repo = createMockRepository();
		repo.findByClaimToken.mockResolvedValue({
			...urlFixture,
			claimToken: "token-123",
			expiresAt: new Date(Date.now() - 86400000).toISOString(), // 1 día en el pasado
		});

		const useCase = new ClaimUrlUseCase(repo);

		await expect(
			useCase.execute({ claimToken: "token-123", userId: "user-123" }),
		).rejects.toThrow(UrlExpiredError);
	});

	it("lanza UrlAlreadyClaimedError si ya tiene userId", async () => {
		const repo = createMockRepository();
		repo.findByClaimToken.mockResolvedValue({
			...urlFixture,
			claimToken: "token-123",
			userId: "otro-usuario",
			expiresAt: new Date(Date.now() + 86400000).toISOString(),
		});

		const useCase = new ClaimUrlUseCase(repo);

		await expect(
			useCase.execute({ claimToken: "token-123", userId: "user-123" }),
		).rejects.toThrow(UrlAlreadyClaimedError);
	});

	it("lanza NotFoundError si claimUrl retorna null", async () => {
		const repo = createMockRepository();
		repo.findByClaimToken.mockResolvedValue({
			...urlFixture,
			claimToken: "token-123",
			expiresAt: new Date(Date.now() + 86400000).toISOString(),
		});
		repo.claimUrl.mockResolvedValue(null);

		const useCase = new ClaimUrlUseCase(repo);

		await expect(
			useCase.execute({ claimToken: "token-123", userId: "user-123" }),
		).rejects.toThrow(NotFoundError);
	});
});
