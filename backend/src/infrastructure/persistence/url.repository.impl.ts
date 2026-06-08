import { eq, sql } from "drizzle-orm";
import type { DrizzleDB } from "@/db";
import { urlsTable } from "@/db/schema";
import type { UrlEntity, CreateUrlInput } from "@/domain/url/url.entity";
import type { UrlRepositoryPort } from "@/domain/url/url.repository.port";

// Generador de shortCode aleatorio: 9 chars [a-z0-9]
function generateShortCode(length = 9): string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	let result = "";
	for (let i = 0; i < length; i++) {
		result += chars[bytes[i] % chars.length];
	}
	return result;
}

// Adaptador secundario: implementación del puerto usando Drizzle + Cloudflare D1
export class UrlRepository implements UrlRepositoryPort {
	constructor(private readonly db: DrizzleDB) {}

	async findAll(): Promise<UrlEntity[]> {
		return this.db.select().from(urlsTable).all();
	}

	async findByShortCode(shortCode: string): Promise<UrlEntity | null> {
		const [url] = await this.db
			.select()
			.from(urlsTable)
			.where(eq(urlsTable.shortCode, shortCode))
			.limit(1);
		return url ?? null;
	}

	async findByOriginalUrl(originalUrl: string): Promise<UrlEntity | null> {
		const [url] = await this.db
			.select()
			.from(urlsTable)
			.where(eq(urlsTable.originalUrl, originalUrl))
			.limit(1);
		return url ?? null;
	}

	async findByUserId(userId: string): Promise<UrlEntity[]> {
		return this.db
			.select()
			.from(urlsTable)
			.where(eq(urlsTable.userId, userId))
			.all();
	}

	async findByUserShortCode(
		userId: string,
		shortCode: string,
	): Promise<UrlEntity | null> {
		const [url] = await this.db
			.select()
			.from(urlsTable)
			.where(
				eq(urlsTable.shortCode, shortCode) && eq(urlsTable.userId, userId),
			)
			.limit(1);
		return url ?? null;
	}

	async deleteByShortCode(shortCode: string): Promise<UrlEntity | null> {
		const [deleted] = await this.db
			.delete(urlsTable)
			.where(eq(urlsTable.shortCode, shortCode))
			.returning();
		return deleted ?? null;
	}

	async deleteByUserShortCode(
		userId: string,
		shortCode: string,
	): Promise<UrlEntity | null> {
		const [deleted] = await this.db
			.delete(urlsTable)
			.where(
				eq(urlsTable.shortCode, shortCode) && eq(urlsTable.userId, userId),
			)
			.returning();
		return deleted ?? null;
	}

	async deleteAll(): Promise<void> {
		await this.db.delete(urlsTable);
	}

	async create(input: CreateUrlInput): Promise<UrlEntity> {
		const shortCode = input.shortCode ?? generateShortCode();
		const createdAt = new Date().toISOString();

		const [created] = await this.db
			.insert(urlsTable)
			.values({ originalUrl: input.originalUrl, shortCode, createdAt })
			.returning();

		return created;
	}

	async createForUser(userId: string, input: CreateUrlInput): Promise<UrlEntity> {
		const shortCode = input.shortCode ?? generateShortCode();
		const createdAt = new Date().toISOString();

		const [created] = await this.db
			.insert(urlsTable)
			.values({
				originalUrl: input.originalUrl,
				shortCode,
				createdAt,
				userId,
			})
			.returning();

		return created;
	}

	async incrementVisits(shortCode: string): Promise<UrlEntity | null> {
		const [updated] = await this.db
			.update(urlsTable)
			.set({ visits: sql`${urlsTable.visits} + 1` })
			.where(eq(urlsTable.shortCode, shortCode))
			.returning();
		return updated ?? null;
	}

	async assignAllToUser(userId: string): Promise<void> {
		await this.db
			.update(urlsTable)
			.set({ userId })
			.where(sql`${urlsTable.userId} IS NULL`);
	}
}
