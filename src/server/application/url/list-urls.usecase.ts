import type { UrlEntity } from "@/server/domain/url/url.entity";
import type {
	PaginatedResult,
	UrlRepositoryPort,
} from "@/server/domain/url/url.repository.port";

export class ListUrlsUseCase {
	constructor(private readonly urlRepository: UrlRepositoryPort) {}

	async execute(
		identity: { userId: string } | { sessionId: string } | null,
		page: number,
		limit: number,
	): Promise<PaginatedResult<UrlEntity>> {
		return this.urlRepository.findByIdentityWithPagination(
			identity,
			page,
			limit,
		);
	}
}
