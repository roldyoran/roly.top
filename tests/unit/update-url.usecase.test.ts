import { describe, it, expect, vi } from "vitest";
import { UpdateUrlUseCase } from "@/server/application/url/update-url.usecase";
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
		update: vi.fn().mockResolvedValue({
			id: "1",
			originalUrl: "https://updated.com",
			shortCode: "abc123456",
			createdAt: "2026-01-01T00:00:00.000Z",
			visits: 0,
			userId: "user-1",
			sessionId: null,
			isActive: true,
			title: "Updated",
		}),
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

describe("UpdateUrlUseCase", () => {
	it("throws UrlNotFoundError when URL does not exist", async () => {
		const repo = makeMockRepo({ findById: vi.fn().mockResolvedValue(null) });
		const useCase = new UpdateUrlUseCase(repo);
		await expect(
			useCase.execute("nonexistent", { title: "Test" }, { userId: "user-1" }),
		).rejects.toThrow(UrlNotFoundError);
	});

	it("throws ForbiddenError when user is not owner", async () => {
		const url = makeUrl({ userId: "owner-1" });
		const repo = makeMockRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new UpdateUrlUseCase(repo);
		await expect(
			useCase.execute("1", { title: "Test" }, { userId: "other-user" }),
		).rejects.toThrow(ForbiddenError);
	});

	it("allows update when userId matches", async () => {
		const url = makeUrl({ userId: "user-1" });
		const repo = makeMockRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new UpdateUrlUseCase(repo);
		const result = await useCase.execute(
			"1",
			{ title: "Updated" },
			{ userId: "user-1" },
		);
		expect(repo.update).toHaveBeenCalledWith("1", { title: "Updated" });
		expect(result).toBeDefined();
	});

	it("allows update when sessionId matches", async () => {
		const url = makeUrl({ userId: null, sessionId: "session-abc" });
		const repo = makeMockRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new UpdateUrlUseCase(repo);
		const result = await useCase.execute(
			"1",
			{ isActive: false },
			{ sessionId: "session-abc" },
		);
		expect(repo.update).toHaveBeenCalledWith("1", { isActive: false });
		expect(result).toBeDefined();
	});

	it("throws ForbiddenError when identity is null", async () => {
		const url = makeUrl();
		const repo = makeMockRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new UpdateUrlUseCase(repo);
		await expect(
			useCase.execute("1", { title: "Test" }, null),
		).rejects.toThrow(ForbiddenError);
	});

	it("passes all fields to repository update", async () => {
		const url = makeUrl();
		const repo = makeMockRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new UpdateUrlUseCase(repo);
		await useCase.execute(
			"1",
			{ originalUrl: "https://new.com", title: "New", isActive: false },
			{ userId: "user-1" },
		);
		expect(repo.update).toHaveBeenCalledWith("1", {
			originalUrl: "https://new.com",
			title: "New",
			isActive: false,
		});
	});

	it("passes isPublic through when caller is admin", async () => {
		const url = makeUrl();
		const repo = makeMockRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new UpdateUrlUseCase(repo);
		await useCase.execute(
			"1",
			{ isPublic: true },
			{ userId: "user-1" },
			true,
		);
		expect(repo.update).toHaveBeenCalledWith("1", { isPublic: true });
	});

	it("throws ForbiddenError when non-admin owner sets isPublic", async () => {
		const url = makeUrl({ userId: "user-1" });
		const repo = makeMockRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new UpdateUrlUseCase(repo);
		await expect(
			useCase.execute("1", { isPublic: true }, { userId: "user-1" }),
		).rejects.toThrow(ForbiddenError);
	});

	it("allows admin to update any URL without ownership", async () => {
		const url = makeUrl({ userId: "owner-1" });
		const repo = makeMockRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new UpdateUrlUseCase(repo);
		const result = await useCase.execute(
			"1",
			{ isPublic: false },
			null,
			true,
		);
		expect(repo.update).toHaveBeenCalledWith("1", { isPublic: false });
		expect(result).toBeDefined();
	});
});
