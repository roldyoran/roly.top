import type { UrlRepositoryPort } from "@/domain/url/url.repository.port";

/**
 * Caso de uso: lista URLs anónimas expiradas (paginado, con búsqueda).
 * Solo para panel admin.
 */
export class FindExpiredAnonymousUrlsUseCase {
	constructor(private readonly urlRepository: UrlRepositoryPort) {}

	async execute(params: { page: number; pageSize: number; search?: string }) {
		return this.urlRepository.findExpiredAnonymousUrls(params);
	}
}
