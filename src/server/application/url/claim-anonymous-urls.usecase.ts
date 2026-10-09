import type { UrlRepositoryPort } from "@/server/domain/url/url.repository.port";

export class ClaimAnonymousUrlsUseCase {
	constructor(private readonly urlRepository: UrlRepositoryPort) {}

	async execute(input: {
		userId: string;
		anonymousId: string;
	}): Promise<number> {
		return this.urlRepository.claimAnonymousUrls(input);
	}
}