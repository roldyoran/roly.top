import { describe, it, expect, vi } from "vitest";
import { ListUrlsUseCase } from "@/server/application/url/list-urls.usecase";
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

describe("ListUrlsUseCase", () => {
	it("calls findByIdentityWithPagination with identity", async () => {
		const repo = makeMockRepo();
		const useCase = new ListUrlsUseCase(repo);
		await useCase.execute({ userId: "user-1" }, 1, 20);
		expect(repo.findByIdentityWithPagination).toHaveBeenCalledWith(
			{ userId: "user-1" },
			1,
			20,
		);
	});

	it("calls findByIdentityWithPagination with null identity", async () => {
		const repo = makeMockRepo();
		const useCase = new ListUrlsUseCase(repo);
		await useCase.execute(null, 2, 10);
		expect(repo.findByIdentityWithPagination).toHaveBeenCalledWith(null, 2, 10);
	});

	it("returns paginated result from repository", async () => {
		const mockResult = {
			data: [
				{
					id: "1",
					originalUrl: "https://example.com",
					shortCode: "abc123456",
					createdAt: "2026-01-01T00:00:00.000Z",
					visits: 5,
					userId: "user-1",
					sessionId: null,
					isActive: true,
					title: "Test",
				},
			],
			pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
		};
		const repo = makeMockRepo({
			findByIdentityWithPagination: vi.fn().mockResolvedValue(mockResult),
		});
		const useCase = new ListUrlsUseCase(repo);
		const result = await useCase.execute({ userId: "user-1" }, 1, 20);
		expect(result).toBe(mockResult);
	});

	it("passes sessionId identity correctly", async () => {
		const repo = makeMockRepo();
		const useCase = new ListUrlsUseCase(repo);
		await useCase.execute({ sessionId: "session-abc" }, 1, 20);
		expect(repo.findByIdentityWithPagination).toHaveBeenCalledWith(
			{ sessionId: "session-abc" },
			1,
			20,
		);
	});
});
