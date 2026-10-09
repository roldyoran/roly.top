import { describe, it, expect, vi } from "vitest";
import { GetPublicLinksUseCase } from "@/server/application/url/get-public-links.usecase";

function makeMockRepo() {
	return {
		findPublic: vi.fn().mockResolvedValue({
			data: [],
			pagination: { page: 1, limit: 12, total: 0, totalPages: 1 },
		}),
	} as any;
}

describe("GetPublicLinksUseCase", () => {
	it("delegates pagination to the repository", async () => {
		const repo = makeMockRepo();
		const result = await new GetPublicLinksUseCase(repo).execute(2, 5);
		expect(repo.findPublic).toHaveBeenCalledWith(2, 5);
		expect(result.pagination.page).toBe(1);
	});

	it("clamps the limit to 20", async () => {
		const repo = makeMockRepo();
		await new GetPublicLinksUseCase(repo).execute(1, 100);
		expect(repo.findPublic).toHaveBeenCalledWith(1, 20);
	});

	it("falls back to page 1 / limit 12 on invalid input", async () => {
		const repo = makeMockRepo();
		await new GetPublicLinksUseCase(repo).execute(0, -3);
		expect(repo.findPublic).toHaveBeenCalledWith(1, 12);
	});
});
