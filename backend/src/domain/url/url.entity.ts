// Entidad de dominio: representa una URL acortada
// No depende de ningún framework ni librería externa
export interface UrlEntity {
	id: number;
	originalUrl: string;
	shortCode: string;
	createdAt: string;
	visits: number;
	userId: string | null;
	// Token UUID para reclamar URL anónima
	claimToken: string | null;
	// Timestamp ISO de expiración (7 días para URLs anónimas)
	expiresAt: string | null;
}

export interface CreateUrlInput {
	originalUrl: string;
	// Si no se provee, se genera automáticamente
	shortCode?: string;
	userId?: string | null;
	// Token UUID para reclamar URL anónima
	claimToken?: string | null;
	// Timestamp ISO de expiración
	expiresAt?: string | null;
}
