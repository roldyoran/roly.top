import type { UrlEntity, CreateUrlInput } from "./url.entity";

// Puerto (interfaz) del repositorio: define el contrato sin conocer la implementación
// La capa de dominio no sabe si la DB es D1, Postgres, SQLite local, etc.
export interface UrlRepositoryPort {
	findAll(): Promise<UrlEntity[]>;
	findByShortCode(shortCode: string): Promise<UrlEntity | null>;
	findByOriginalUrl(
		originalUrl: string,
		userId?: string | null,
	): Promise<UrlEntity | null>;
	findByUserId(userId: string): Promise<UrlEntity[]>;
	findByUserShortCode(
		userId: string,
		shortCode: string,
	): Promise<UrlEntity | null>;
	countByUserId(userId: string): Promise<number>;
	create(input: CreateUrlInput): Promise<UrlEntity>;
	createForUser(userId: string, input: CreateUrlInput): Promise<UrlEntity>;
	deleteByShortCode(shortCode: string): Promise<UrlEntity | null>;
	deleteByUserShortCode(
		userId: string,
		shortCode: string,
	): Promise<UrlEntity | null>;
	deleteAll(): Promise<void>;
	incrementVisits(shortCode: string): Promise<UrlEntity | null>;
	assignAllToUser(userId: string): Promise<void>;
}
