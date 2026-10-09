import type { UrlRepositoryPort } from "@/server/domain/url/url.repository.port";
import { QuotaReachedError } from "@/server/domain/url/url.errors";

export class QuotaService {
	constructor(
		private readonly urlRepository: Pick<UrlRepositoryPort, "countByIdentity">,
	) {}

	async enforceQuota(
		identity: { userId: string } | { sessionId: string },
		limit: number,
	): Promise<void> {
		const used = await this.urlRepository.countByIdentity(identity);
		if (used >= limit) {
			throw new QuotaReachedError(limit);
		}
	}
}
