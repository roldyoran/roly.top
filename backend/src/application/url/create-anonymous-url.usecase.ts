import type { UrlRepositoryPort } from "@/domain/url/url.repository.port";
import type { UrlEntity } from "@/domain/url/url.entity";

interface CreateAnonymousUrlInput {
	originalUrl: string;
}

/**
 * Caso de uso: crea una URL anónima temporal (7 días).
 * No requiere autenticación. El claimToken se genera automáticamente
 * y se usa para reclamar la URL al iniciar sesión.
 */
export class CreateAnonymousUrlUseCase {
	constructor(private readonly urlRepository: UrlRepositoryPort) {}

	async execute(input: CreateAnonymousUrlInput): Promise<UrlEntity> {
		// Generar claim token
		const claimToken = crypto.randomUUID();

		// Calcular expiración (7 días)
		const expiresAt = new Date(
			Date.now() + 7 * 24 * 60 * 60 * 1000,
		).toISOString();

		// Crear URL sin userId, con claimToken y expiresAt
		return this.urlRepository.create({
			originalUrl: input.originalUrl,
			claimToken,
			expiresAt,
		});
	}
}
