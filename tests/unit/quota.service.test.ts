import { describe, it, expect, vi } from "vitest";
import { QuotaService } from "@/server/application/shared/quota.service";
import { QuotaReachedError } from "@/server/domain/url/url.errors";

function makeMockRepo(count: number) {
	return {
		countByIdentity: vi.fn().mockResolvedValue(count),
	} as any;
}

describe("QuotaService", () => {
	describe("enforceQuota", () => {
		it("does not throw when count is below limit (sessionId)", async () => {
			const service = new QuotaService(makeMockRepo(5));
			await expect(
				service.enforceQuota({ sessionId: "session-1" }, 10),
			).resolves.toBeUndefined();
		});

		it("does not throw when count is 1 below limit", async () => {
			const service = new QuotaService(makeMockRepo(9));
			await expect(
				service.enforceQuota({ sessionId: "session-1" }, 10),
			).resolves.toBeUndefined();
		});

		it("throws QuotaReachedError when count equals limit", async () => {
			const service = new QuotaService(makeMockRepo(10));
			await expect(
				service.enforceQuota({ sessionId: "session-1" }, 10),
			).rejects.toBeInstanceOf(QuotaReachedError);
		});

		it("throws QuotaReachedError when count exceeds limit", async () => {
			const service = new QuotaService(makeMockRepo(15));
			await expect(
				service.enforceQuota({ sessionId: "session-1" }, 10),
			).rejects.toBeInstanceOf(QuotaReachedError);
		});

		it("works with userId identity", async () => {
			const service = new QuotaService(makeMockRepo(0));
			await expect(
				service.enforceQuota({ userId: "user-1" }, 10),
			).resolves.toBeUndefined();
		});

		it("calls countByIdentity with the correct identity", async () => {
			const repo = makeMockRepo(0);
			const service = new QuotaService(repo);
			await service.enforceQuota({ sessionId: "session-42" }, 10);
			expect(repo.countByIdentity).toHaveBeenCalledWith({
				sessionId: "session-42",
			});
		});
	});
});
