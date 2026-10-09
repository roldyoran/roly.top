import { describe, it, expect, vi } from "vitest";
import { ClaimAnonymousUrlsUseCase } from "@/server/application/url/claim-anonymous-urls.usecase";
import type { UrlRepositoryPort } from "@/server/domain/url/url.repository.port";

function makeMockRepo() {
	return {
		claimAnonymousUrls: vi.fn().mockResolvedValue(2),
	} as unknown as UrlRepositoryPort & {
		claimAnonymousUrls: ReturnType<typeof vi.fn>;
	};
}

describe("ClaimAnonymousUrlsUseCase", () => {
	it("delegates to the repository with userId + anonymousId", async () => {
		const repo = makeMockRepo();
		const useCase = new ClaimAnonymousUrlsUseCase(repo);
		const claimed = await useCase.execute({
			userId: "user-1",
			anonymousId: "anon-abc",
		});
		expect(repo.claimAnonymousUrls).toHaveBeenCalledWith({
			userId: "user-1",
			anonymousId: "anon-abc",
		});
		expect(claimed).toBe(2);
	});

	it("returns 0 when there is nothing to claim", async () => {
		const repo = makeMockRepo();
		repo.claimAnonymousUrls = vi.fn().mockResolvedValue(0);
		const useCase = new ClaimAnonymousUrlsUseCase(repo);
		const claimed = await useCase.execute({
			userId: "user-1",
			anonymousId: "anon-empty",
		});
		expect(claimed).toBe(0);
	});
});
