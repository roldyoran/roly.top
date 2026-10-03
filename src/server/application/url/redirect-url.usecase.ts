import type { UrlEntity } from "@/server/domain/url/url.entity";
import type { UrlRepositoryPort } from "@/server/domain/url/url.repository.port";

export class RedirectUrlUseCase {
	constructor(private readonly urlRepository: UrlRepositoryPort) {}

	async execute(shortCode: string): Promise<UrlEntity | null> {
		return this.urlRepository.findByShortCodeAndIncrementVisits(shortCode);
	}
}
