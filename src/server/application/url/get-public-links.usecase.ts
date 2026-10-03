import type {
	PaginatedResult,
	UrlRepositoryPort,
} from "@/server/domain/url/url.repository.port";
import type { PublicLink } from "@/server/domain/url/url.entity";

/**
 * Catálogo público de enlaces: lectura anónima, paginada y sin PII.
 * Solo devuelve lo que `findPublic` expone (código, destino, título, clics).
 */
export class GetPublicLinksUseCase {
	constructor(private readonly urlRepository: UrlRepositoryPort) {}

	async execute(
		page: number,
		limit: number,
	): Promise<PaginatedResult<PublicLink>> {
		const safePage = Number.isInteger(page) && page > 0 ? page : 1;
		const safeLimit =
			Number.isInteger(limit) && limit > 0 ? Math.min(limit, 20) : 12;
		return this.urlRepository.findPublic(safePage, safeLimit);
	}
}
