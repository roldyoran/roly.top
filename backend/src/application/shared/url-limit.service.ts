import type { UserRepositoryPort } from "@/domain/user/user.repository.port";
import { UrlLimitReachedError } from "@/domain/app-error";

/** Límite de URLs para admins (sin límite práctico) */
const ADMIN_URL_LIMIT = 999;

/** Límite de URLs por defecto para usuarios normales */
const DEFAULT_USER_URL_LIMIT = 2;

/**
 * Servicio de dominio para verificar y gestionar límites de URLs por usuario.
 * Encapsula la lógica de negocio de límites (regla: admin = 999, usuario = 2 por defecto).
 */
export class UrlLimitService {
	constructor(private readonly userRepository: UserRepositoryPort) {}

	/**
	 * Obtiene el límite de URLs aplicable al usuario.
	 * @param userId - ID del usuario
	 * @returns El límite de URLs
	 */
	async getLimitForUser(userId: string): Promise<number> {
		const dbUser = await this.userRepository.findLimitAndRoleById(userId);
		if (dbUser?.role === "admin") return ADMIN_URL_LIMIT;
		return dbUser?.urlLimit ?? DEFAULT_USER_URL_LIMIT;
	}

	/**
	 * Verifica si el usuario puede crear más URLs.
	 * Lanza UrlLimitReachedError si ya alcanzó el límite.
	 * @param userId - ID del usuario
	 * @param currentUrlCount - Número actual de URLs del usuario
	 */
	async enforceLimit(userId: string, currentUrlCount: number): Promise<void> {
		const limit = await this.getLimitForUser(userId);
		if (currentUrlCount >= limit) {
			throw new UrlLimitReachedError(`Límite de ${limit} URLs alcanzado`);
		}
	}
}
