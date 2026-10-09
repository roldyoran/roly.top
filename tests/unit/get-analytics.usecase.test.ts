import { describe, it, expect, vi } from "vitest";
import { GetAnalyticsUseCase } from "@/server/application/analytics/get-analytics.usecase";
import { UrlNotFoundError } from "@/server/domain/url/url.errors";
import type { ClickRepositoryPort } from "@/server/domain/click/click.repository.port";
import type { UrlRepositoryPort } from "@/server/domain/url/url.repository.port";

function makeMockClickRepo(overrides?: Partial<ClickRepositoryPort>) {
	return {
		create: vi.fn().mockResolvedValue(undefined),
		getAnalyticsByUrlId: vi.fn().mockResolvedValue({
			totalClicks: 0,
			clicksByCountry: [],
			clicksByDevice: [],
			clicksByBrowser: [],
		}),
		...overrides,
	} as ClickRepositoryPort;
}

function makeMockUrlRepo(overrides?: Partial<UrlRepositoryPort>) {
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
		findByIdentityWithPagination: vi.fn().mockResolvedValue({
			data: [],
			pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
		}),
		update: vi.fn().mockResolvedValue(null),
		delete: vi.fn().mockResolvedValue(undefined),
		...overrides,
	} as UrlRepositoryPort;
}

describe("GetAnalyticsUseCase", () => {
	it("throws UrlNotFoundError when URL does not exist", async () => {
		const clickRepo = makeMockClickRepo();
		const urlRepo = makeMockUrlRepo({ findById: vi.fn().mockResolvedValue(null) });
		const useCase = new GetAnalyticsUseCase(clickRepo, urlRepo);
		await expect(
			useCase.execute("nonexistent", { userId: "user-1" }),
		).rejects.toThrow(UrlNotFoundError);
	});

	it("throws UrlNotFoundError when user is not owner", async () => {
		const url = {
			id: "1",
			originalUrl: "https://example.com",
			shortCode: "abc",
			createdAt: "2026-01-01",
			visits: 0,
			userId: "owner-1",
			sessionId: null,
			isActive: true,
			title: null,
		};
		const clickRepo = makeMockClickRepo();
		const urlRepo = makeMockUrlRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new GetAnalyticsUseCase(clickRepo, urlRepo);
		await expect(
			useCase.execute("1", { userId: "other-user" }),
		).rejects.toThrow(UrlNotFoundError);
	});

	it("returns analytics when user is owner", async () => {
		const url = {
			id: "1",
			originalUrl: "https://example.com",
			shortCode: "abc",
			createdAt: "2026-01-01",
			visits: 0,
			userId: "user-1",
			sessionId: null,
			isActive: true,
			title: null,
		};
		const mockAnalytics = {
			totalClicks: 10,
			clicksByCountry: [{ country: "US", count: 5 }],
			clicksByDevice: [{ device: "Desktop", count: 8 }],
			clicksByBrowser: [{ browser: "Chrome", count: 7 }],
		};
		const clickRepo = makeMockClickRepo({
			getAnalyticsByUrlId: vi.fn().mockResolvedValue(mockAnalytics),
		});
		const urlRepo = makeMockUrlRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new GetAnalyticsUseCase(clickRepo, urlRepo);
		const result = await useCase.execute("1", { userId: "user-1" });
		expect(result).toBe(mockAnalytics);
		expect(clickRepo.getAnalyticsByUrlId).toHaveBeenCalledWith("1");
	});

	it("works with sessionId identity", async () => {
		const url = {
			id: "1",
			originalUrl: "https://example.com",
			shortCode: "abc",
			createdAt: "2026-01-01",
			visits: 0,
			userId: null,
			sessionId: "session-abc",
			isActive: true,
			title: null,
		};
		const clickRepo = makeMockClickRepo();
		const urlRepo = makeMockUrlRepo({ findById: vi.fn().mockResolvedValue(url) });
		const useCase = new GetAnalyticsUseCase(clickRepo, urlRepo);
		const result = await useCase.execute("1", { sessionId: "session-abc" });
		expect(result).toBeDefined();
	});
});
