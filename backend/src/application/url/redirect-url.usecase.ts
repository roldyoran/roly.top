import type { UrlEntity } from "@/domain/url/url.entity";
import type { UrlRepositoryPort } from "@/domain/url/url.repository.port";

// Caso de uso: redirige a la URL original asociada a un shortCode e incrementa el contador de visitas
export class RedirectUrlUseCase {
	constructor(private readonly urlRepository: UrlRepositoryPort) {}

	async execute(shortCode: string): Promise<UrlEntity | null> {
		return this.urlRepository.findByShortCodeAndIncrementVisits(shortCode);
	}
}
