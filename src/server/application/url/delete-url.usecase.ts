import type { UrlEntity } from "@/server/domain/url/url.entity";
import type { UrlRepositoryPort } from "@/server/domain/url/url.repository.port";
import { ForbiddenError, UrlNotFoundError } from "@/server/domain/url/url.errors";

export class DeleteUrlUseCase {
	constructor(private readonly urlRepository: UrlRepositoryPort) {}

	async execute(
		id: string,
		identity: { userId: string } | { sessionId: string } | null,
	): Promise<void> {
		const url = await this.urlRepository.findById(id);
		if (!url) {
			throw new UrlNotFoundError();
		}

		if (!this.isOwner(url, identity)) {
			throw new ForbiddenError();
		}

		await this.urlRepository.delete(id);
	}

	private isOwner(
		url: UrlEntity,
		identity: { userId: string } | { sessionId: string } | null,
	): boolean {
		if (!identity) return false;
		if ("userId" in identity && url.userId === identity.userId) return true;
		if ("sessionId" in identity && url.sessionId === identity.sessionId)
			return true;
		return false;
	}
}
