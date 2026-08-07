import type { UrlRepositoryPort } from "@/domain/url/url.repository.port";
import type { UrlEntity } from "@/domain/url/url.entity";
import { NotFoundError } from "@/domain/app-error";
import {
	UrlExpiredError,
	UrlAlreadyClaimedError,
} from "@/domain/url/url.errors";

interface ClaimUrlInput {
	claimToken: string;
	userId: string;
}

/**
 * Caso de uso: reclama una URL anónima para un usuario autenticado.
 * Verifica que la URL exista, no esté expirada y no haya sido reclamada.
 */
export class ClaimUrlUseCase {
	constructor(private readonly urlRepository: UrlRepositoryPort) {}

	async execute(input: ClaimUrlInput): Promise<UrlEntity> {
		// 1. Buscar por claimToken
		const url = await this.urlRepository.findByClaimToken(input.claimToken);
		if (!url) {
			throw new NotFoundError("URL no encontrada o token inválido");
		}

		// 2. Verificar que no esté expirada
		if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
			throw new UrlExpiredError();
		}

		// 3. Verificar que no haya sido reclamada ya
		if (url.userId) {
			throw new UrlAlreadyClaimedError();
		}

		// 4. Reclamar: asignar userId, limpiar claimToken y expiresAt
		const claimed = await this.urlRepository.claimUrl(
			input.claimToken,
			input.userId,
		);
		if (!claimed) {
			throw new NotFoundError("Error al reclamar la URL");
		}

		return claimed;
	}
}
