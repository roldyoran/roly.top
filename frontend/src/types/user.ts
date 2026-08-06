/**
 * Tipos de dominio para usuarios
 */

/** Usuario autenticado */
export interface AuthUser {
	id: string;
	name: string;
	email: string;
	image?: string | null;
	role?: string;
	banned?: boolean;
	banReason?: string | null;
	banExpires?: string | null;
}

/** Usuario de Better Auth (raw) */
export interface BetterAuthUser {
	id: unknown;
	name: unknown;
	email: unknown;
	image: unknown;
	role: unknown;
	banned: unknown;
	banReason: unknown;
	banExpires: unknown;
}
