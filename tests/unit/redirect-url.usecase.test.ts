import { describe, it, expect, vi } from "vitest";
import { RedirectUrlUseCase } from "@/server/application/url/redirect-url.usecase";
import type { UrlRepositoryPort } from "@/server/domain/url/url.repository.port";

function makeMockRepo(overrides?: Partial<UrlRepositoryPort>) {
	return {
		findByShortCode: vi.fn().mockResolvedValue(null),
		findByOriginalUrlAndIdentity: vi.fn().mockResolvedValue(null),
		countByIdentity: vi.fn().mockResolvedValue(0),
		findAll: vi.fn().mockResolvedValue([]),
		findByUserId: vi.fn().mockResolvedValue([]),
		create: vi.fn(),
		createWithShortCode: vi.fn(),
		findByShortCodeAndIncrementVisits: vi.fn().mockResolvedValue(null),
		...overrides,
	} as UrlRepositoryPort;
}

describe("RedirectUrlUseCase", () => {
	it("returns the URL entity when short code exists", async () => {
		const url = {
			id: 1,
			originalUrl: "https://example.com",
			shortCode: "abc123",
			createdAt: "2026-01-01T00:00:00.000Z",
			visits: 5,
			userId: null,
			sessionId: null,
			isActive: true,
			title: null,
		};
		const repo = makeMockRepo({
			findByShortCodeAndIncrementVisits: vi.fn().mockResolvedValue(url),
		});
		const useCase = new RedirectUrlUseCase(repo);
		const result = await useCase.execute("abc123");
		expect(result).toBe(url);
	});

	it("returns null when short code does not exist", async () => {
		const repo = makeMockRepo();
		const useCase = new RedirectUrlUseCase(repo);
		const result = await useCase.execute("nonexistent");
		expect(result).toBeNull();
	});

	it("delegates to findByShortCodeAndIncrementVisits", async () => {
		const repo = makeMockRepo();
		const useCase = new RedirectUrlUseCase(repo);
		await useCase.execute("abc123");
		expect(repo.findByShortCodeAndIncrementVisits).toHaveBeenCalledWith(
			"abc123",
		);
	});
});
