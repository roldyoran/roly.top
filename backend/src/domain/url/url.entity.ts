// Entidad de dominio: representa una URL acortada
// No depende de ningún framework ni librería externa
export interface UrlEntity {
	id: number;
	originalUrl: string;
	shortCode: string;
	createdAt: string;
	visits: number;
	userId: string | null;
}

export interface CreateUrlInput {
	originalUrl: string;
	// Si no se provee, se genera automáticamente
	shortCode?: string;
}
