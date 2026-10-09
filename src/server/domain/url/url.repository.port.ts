import type {
	CreateUrlInput,
	PublicLink,
	UpdateUrlInput,
	UrlEntity,
} from "./url.entity";

export interface PaginatedResult<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface UrlRepositoryPort {
	findById(id: string): Promise<UrlEntity | null>;
	findByShortCode(shortCode: string): Promise<UrlEntity | null>;
	findByOriginalUrlAndIdentity(
		originalUrl: string,
		identity: { userId: string } | { sessionId: string },
	): Promise<UrlEntity | null>;
	countByIdentity(
		identity: { userId: string } | { sessionId: string },
	): Promise<number>;
	findAll(page?: number, limit?: number): Promise<UrlEntity[]>;
	findByUserId(userId: string): Promise<UrlEntity[]>;
	findByIdentityWithPagination(
		identity: { userId: string } | { sessionId: string } | null,
		page: number,
		limit: number,
	): Promise<PaginatedResult<UrlEntity>>;
	create(input: CreateUrlInput): Promise<UrlEntity>;
	// `update`/`delete` existen en el repositorio y los casos de uso desde
	// el inicio, pero faltaban en el puerto: sin ellos `astro check` falla
	// y los mocks tipados como `UrlRepositoryPort` no compilan.
	update(id: string, input: UpdateUrlInput): Promise<UrlEntity>;
	delete(id: string): Promise<void>;
	/**
	 * Catálogo público paginado: solo enlaces activos marcados `isPublic`,
	 * ordenados por clics. Sin PII (ver `PublicLink`).
	 */
	findPublic(page: number, limit: number): Promise<PaginatedResult<PublicLink>>;
	findByShortCodeAndIncrementVisits(shortCode: string): Promise<UrlEntity | null>;
	createWithShortCode(input: CreateUrlInput, shortCode: string): Promise<UrlEntity>;
	claimAnonymousUrls(input: {
		userId: string;
		anonymousId: string;
	}): Promise<number>;
}
