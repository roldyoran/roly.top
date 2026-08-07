/**
 * Tipos de dominio para URLs
 */

/** Respuesta de URL desde la API */
export interface UrlInfoResponse {
	id: number;
	shortCode: string;
	originalUrl: string;
	visits: number;
	createdAt: string;
}

/** Item de URL para el store (localStorage) */
export interface SavedUrlItem {
	original: string;
	short: string;
	date: string;
}

/** Resultado de una operación de acortamiento */
export interface ShortenResult {
	success: boolean;
	shortCode?: string;
	shortUrl?: string;
	originalUrl?: string;
	error?: string;
}

/** Respuesta de URLs del usuario con límite */
export interface UserUrlsResponse {
	urls: UrlInfoResponse[];
	urlLimit: number;
}

/** Respuesta de creación anónima */
export interface AnonymousUrlResponse {
	id: number;
	originalUrl: string;
	shortCode: string;
	createdAt: string;
	visits: number;
	userId: null;
	claimToken: string;
	expiresAt: string;
}
