import { describe, it, expect, vi } from "vitest";
import { DeleteUrlUseCase } from "@/server/application/url/delete-url.usecase";
import { ForbiddenError, UrlNotFoundError } from "@/server/domain/url/url.errors";
import type { UrlRepositoryPort } from "@/server/domain/url/url.repository.port";

function makeMockRepo(overrides?: Partial<UrlRepositoryPort>) {
	return {
		findById: vi.fn().mockResolvedValue(null),
		findByShortCode: vi.fn().mockResolvedValue(null),
		findByOriginalUrlAndIdentity: vi.fn().mockResolvedValue(null),
		countByIdentity: vi.fn().mockResolvedValue(0),
		findAll: vi.fn().mockResolvedValue([]),
		findByUserId: vi.fn().mockResolvedValue([]),
		create: vi.fn().mockResolvedValue(null),
		createWithShortCode: vi.fn().mockResolvedValue(null),
		findByShortCodeAndIncrementVisits: vi.fn().mockResolvedValue(null),
		update: vi.fn().mockResolvedValue(null),
		delete: vi.fn().mockResolvedValue(undefined),
		findByIdentityWithPagination: vi.fn().mockResolvedValue({
			data: [],
			pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
		}),
		...overrides,
	} as UrlRepositoryPort;
}

function makeUrl(overrides?: Record<string, unknown>) {
	return {
		id: "1",
		originalUrl: "https://example.com",
		shortCode: "abc123456",
		createdAt: "2026-01-01T00:00:00.000Z",
		visits: 0,
		userId: "user-1",
		sessionId: null,
		isActive: true,
		title: null,
		...overrides,
	};
}

describe("DeleteUrlUseCase", () => {
	it("throws UrlNotFoundError when URL does not exist", async () => {
		const repo = makeMockRepo({ findById: vi.fn().mockResolvedValue(null) });
		const useCase = new DeleteUrlUseCase(repo);
		await expect(
			useCase.execute("nonexistent", { userId: "user-1" }),
		).rejects.toThrow(UrlNotFoundError);
	});

	it("throws ForbiddenError when user is not owner", async () => {
		const url = makeUrl({ userId: "owner-1" });
		const repo = makeMockRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new DeleteUrlUseCase(repo);
		await expect(
			useCase.execute("1", { userId: "other-user" }),
		).rejects.toThrow(ForbiddenError);
	});

	it("deletes URL when userId matches", async () => {
		const url = makeUrl({ userId: "user-1" });
		const repo = makeMockRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new DeleteUrlUseCase(repo);
		await useCase.execute("1", { userId: "user-1" });
		expect(repo.delete).toHaveBeenCalledWith("1");
	});

	it("deletes URL when sessionId matches", async () => {
		const url = makeUrl({ userId: null, sessionId: "session-abc" });
		const repo = makeMockRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new DeleteUrlUseCase(repo);
		await useCase.execute("1", { sessionId: "session-abc" });
		expect(repo.delete).toHaveBeenCalledWith("1");
	});

	it("throws ForbiddenError when identity is null", async () => {
		const url = makeUrl();
		const repo = makeMockRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new DeleteUrlUseCase(repo);
		await expect(useCase.execute("1", null)).rejects.toThrow(ForbiddenError);
	});

	it("throws ForbiddenError when URL has userId but identity is sessionId", async () => {
		const url = makeUrl({ userId: "user-1", sessionId: null });
		const repo = makeMockRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new DeleteUrlUseCase(repo);
		await expect(
			useCase.execute("1", { sessionId: "session-abc" }),
		).rejects.toThrow(ForbiddenError);
	});

	it("throws ForbiddenError when URL has sessionId but identity is userId", async () => {
		const url = makeUrl({ userId: null, sessionId: "session-abc" });
		const repo = makeMockRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new DeleteUrlUseCase(repo);
		await expect(
			useCase.execute("1", { userId: "user-1" }),
		).rejects.toThrow(ForbiddenError);
	});
});
