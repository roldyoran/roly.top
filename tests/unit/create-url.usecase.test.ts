import { describe, it, expect, vi } from "vitest";
import { CreateUrlUseCase } from "@/server/application/url/create-url.usecase";
import { AppError } from "@/server/domain/app-error";
import { RESERVED_SHORT_CODES, URL_QUOTA_LIMIT } from "@/server/config/constants";
import type { UrlRepositoryPort } from "@/server/domain/url/url.repository.port";

function makeMockRepo(overrides?: Partial<UrlRepositoryPort>) {
	return {
		findByShortCode: vi.fn().mockResolvedValue(null),
		findByOriginalUrlAndIdentity: vi.fn().mockResolvedValue(null),
		countByIdentity: vi.fn().mockResolvedValue(0),
		findAll: vi.fn().mockResolvedValue([]),
		findByUserId: vi.fn().mockResolvedValue([]),
		create: vi.fn().mockResolvedValue({
			id: 1,
			originalUrl: "https://example.com",
			shortCode: "abc123456",
			createdAt: "2026-01-01T00:00:00.000Z",
			visits: 0,
			userId: null,
			sessionId: null,
			isActive: true,
			title: null,
		}),
		createWithShortCode: vi.fn().mockResolvedValue({
			id: 1,
			originalUrl: "https://example.com",
			shortCode: "custom",
			createdAt: "2026-01-01T00:00:00.000Z",
			visits: 0,
			userId: null,
			sessionId: null,
			isActive: true,
			title: null,
		}),
		findByShortCodeAndIncrementVisits: vi.fn().mockResolvedValue(null),
		...overrides,
	} as UrlRepositoryPort;
}

function makeMockQuota(shouldThrow = false) {
	return {
		enforceQuota: vi.fn().mockImplementation(async () => {
			if (shouldThrow) {
				throw new AppError("limit reached", "QUOTA_REACHED");
			}
		}),
	} as any;
}

describe("CreateUrlUseCase", () => {
	describe("deduplication", () => {
		it("returns existing URL when same originalUrl + sessionId exists", async () => {
			const existing = {
				id: 1,
				originalUrl: "https://example.com",
				shortCode: "existing1",
				createdAt: "2026-01-01T00:00:00.000Z",
				visits: 0,
				userId: null,
				sessionId: "session-123",
				isActive: true,
				title: null,
			};
			const repo = makeMockRepo({
				findByOriginalUrlAndIdentity: vi.fn().mockResolvedValue(existing),
			});
			const useCase = new CreateUrlUseCase(repo);
			const result = await useCase.execute({
				originalUrl: "https://example.com",
				sessionId: "session-123",
			});
			expect(result).toBe(existing);
			expect(repo.create).not.toHaveBeenCalled();
		});

		it("returns existing URL when same originalUrl + userId exists", async () => {
			const existing = {
				id: 1,
				originalUrl: "https://example.com",
				shortCode: "existing1",
				createdAt: "2026-01-01T00:00:00.000Z",
				visits: 0,
				userId: "user-123",
				sessionId: null,
				isActive: true,
				title: null,
			};
			const repo = makeMockRepo({
				findByOriginalUrlAndIdentity: vi.fn().mockResolvedValue(existing),
			});
			const useCase = new CreateUrlUseCase(repo);
			const result = await useCase.execute({
				originalUrl: "https://example.com",
				userId: "user-123",
			});
			expect(result).toBe(existing);
			expect(repo.create).not.toHaveBeenCalled();
		});

		it("does not dedupe when no identity is provided", async () => {
			const repo = makeMockRepo();
			const useCase = new CreateUrlUseCase(repo);
			await useCase.execute({ originalUrl: "https://example.com" });
			expect(repo.findByOriginalUrlAndIdentity).not.toHaveBeenCalled();
			expect(repo.create).toHaveBeenCalled();
		});
	});

	describe("quota", () => {
		it("enforces quota when identity and quotaService provided", async () => {
			const quota = makeMockQuota();
			const repo = makeMockRepo();
			const useCase = new CreateUrlUseCase(repo, quota);
			await useCase.execute({
				originalUrl: "https://example.com",
				sessionId: "session-123",
			});
			expect(quota.enforceQuota).toHaveBeenCalledWith(
				{ sessionId: "session-123" },
				URL_QUOTA_LIMIT,
			);
		});

		it("enforces quota for userId identity", async () => {
			const quota = makeMockQuota();
			const repo = makeMockRepo();
			const useCase = new CreateUrlUseCase(repo, quota);
			await useCase.execute({
				originalUrl: "https://example.com",
				userId: "user-123",
			});
			expect(quota.enforceQuota).toHaveBeenCalledWith(
				{ userId: "user-123" },
				URL_QUOTA_LIMIT,
			);
		});

		it("throws when quota exceeded", async () => {
			const quota = makeMockQuota(true);
			const repo = makeMockRepo();
			const useCase = new CreateUrlUseCase(repo, quota);
			await expect(
				useCase.execute({
					originalUrl: "https://example.com",
					sessionId: "session-123",
				}),
			).rejects.toThrow("limit reached");
		});

		it("skips quota check when no quotaService", async () => {
			const repo = makeMockRepo();
			const useCase = new CreateUrlUseCase(repo, null);
			await useCase.execute({
				originalUrl: "https://example.com",
				sessionId: "session-123",
			});
			expect(repo.create).toHaveBeenCalled();
		});
	});

	describe("custom alias", () => {
		it("uses createWithShortCode for valid custom alias", async () => {
			const repo = makeMockRepo();
			const useCase = new CreateUrlUseCase(repo);
			await useCase.execute({
				originalUrl: "https://example.com",
				customAlias: "myalias",
			});
			expect(repo.createWithShortCode).toHaveBeenCalledWith(
				expect.objectContaining({ originalUrl: "https://example.com" }),
				"myalias",
			);
			expect(repo.create).not.toHaveBeenCalled();
		});

		it("lowercases the alias before using", async () => {
			const repo = makeMockRepo();
			const useCase = new CreateUrlUseCase(repo);
			await useCase.execute({
				originalUrl: "https://example.com",
				customAlias: "MyAlias",
			});
			expect(repo.createWithShortCode).toHaveBeenCalledWith(
				expect.anything(),
				"myalias",
			);
		});

		it("throws when alias is reserved", async () => {
			const repo = makeMockRepo();
			const useCase = new CreateUrlUseCase(repo);
			for (const reserved of RESERVED_SHORT_CODES) {
				await expect(
					useCase.execute({
						originalUrl: "https://example.com",
						customAlias: reserved,
					}),
				).rejects.toThrow("no está disponible");
			}
		});

		it("throws when alias is already taken", async () => {
			const repo = makeMockRepo({
				findByShortCode: vi.fn().mockResolvedValue({
					id: 1,
					shortCode: "taken",
					originalUrl: "https://other.com",
				}),
			});
			const useCase = new CreateUrlUseCase(repo);
			await expect(
				useCase.execute({
					originalUrl: "https://example.com",
					customAlias: "taken",
				}),
			).rejects.toThrow("ya está en uso");
		});
	});

	describe("auto-generate", () => {
		it("calls create when no customAlias", async () => {
			const repo = makeMockRepo();
			const useCase = new CreateUrlUseCase(repo);
			await useCase.execute({ originalUrl: "https://example.com" });
			expect(repo.create).toHaveBeenCalled();
		});
	});
});
