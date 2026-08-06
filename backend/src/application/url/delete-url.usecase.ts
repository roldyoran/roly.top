import type { UrlEntity } from "@/domain/url/url.entity";
import type { UrlRepositoryPort } from "@/domain/url/url.repository.port";
import { UrlNotFoundError } from "@/domain/url/url.errors";

export class DeleteUrlUseCase {
	constructor(private readonly urlRepository: UrlRepositoryPort) {}

	async execute(shortCode: string): Promise<UrlEntity> {
		const deleted = await this.urlRepository.deleteByShortCode(shortCode);
		if (!deleted) {
			throw new UrlNotFoundError(shortCode);
		}
		return deleted;
	}
}
