import type { AnalyticsData } from "@/server/domain/click/click.entity";
import type { ClickRepositoryPort } from "@/server/domain/click/click.repository.port";
import type { UrlRepositoryPort } from "@/server/domain/url/url.repository.port";
import { UrlNotFoundError } from "@/server/domain/url/url.errors";

export class GetAnalyticsUseCase {
	constructor(
		private readonly clickRepository: ClickRepositoryPort,
		private readonly urlRepository: UrlRepositoryPort,
	) {}

	async execute(
		urlId: string,
		identity: { userId: string } | { sessionId: string } | null,
	): Promise<AnalyticsData> {
		const url = await this.urlRepository.findById(urlId);
		if (!url) {
			throw new UrlNotFoundError();
		}

		if (!this.isOwner(url, identity)) {
			throw new UrlNotFoundError();
		}

		return this.clickRepository.getAnalyticsByUrlId(urlId);
	}

	private isOwner(
		url: { userId: string | null; sessionId: string | null },
		identity: { userId: string } | { sessionId: string } | null,
	): boolean {
		if (!identity) return false;
		if ("userId" in identity && url.userId === identity.userId) return true;
		if ("sessionId" in identity && url.sessionId === identity.sessionId)
			return true;
		return false;
	}
}
