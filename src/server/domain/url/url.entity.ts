export interface UrlEntity {
	id: string;
	originalUrl: string;
	shortCode: string;
	createdAt: string;
	visits: number;
	userId: string | null;
	sessionId: string | null;
	isActive: boolean;
	isPublic: boolean;
	title: string | null;
}

export interface CreateUrlInput {
	originalUrl: string;
	userId?: string | null;
	sessionId?: string | null;
	customAlias?: string;
}

export interface UpdateUrlInput {
	originalUrl?: string;
	title?: string | null;
	isActive?: boolean;
	isPublic?: boolean;
}

/**
 * Item del catálogo público: sin datos sensibles (sin owners). Incluye la
 * URL de destino para que cualquiera vea a dónde apunta cada enlace antes
 * de visitarlo (igual que la lista de "Mis enlaces").
 */
export interface PublicLink {
	shortCode: string;
	originalUrl: string;
	title: string | null;
	clicks: number;
	createdAt: string;
}
