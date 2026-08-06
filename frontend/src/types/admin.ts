/**
 * Tipos de dominio para administración
 */

/** Usuario para panel admin */
export interface AdminUser {
	id: string;
	name: string;
	email: string;
	image: string | null;
	role: string;
	banned: boolean;
	banReason: string | null;
	banExpires: Date | null;
	urlLimit: number;
	createdAt: Date;
	urlCount: number;
}

/** Estadísticas del dashboard admin */
export interface AdminStats {
	totalUsers: number;
	totalUrls: number;
	totalVisits: number;
	adminUsers: number;
	bannedUsers: number;
}

/** Resultado paginado */
export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

/** URL para panel admin */
export interface AdminUrl {
	id: number;
	originalUrl: string;
	shortCode: string;
	createdAt: string;
	visits: number;
	userId: string | null;
}
