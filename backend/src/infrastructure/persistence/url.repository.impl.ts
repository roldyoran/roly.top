import { eq, sql, count, and, isNull } from "drizzle-orm";
import type { DrizzleDB } from "@/db";
import { urlsTable } from "@/db/schema";
import type { UrlEntity, CreateUrlInput } from "@/domain/url/url.entity";
import type { UrlRepositoryPort } from "@/domain/url/url.repository.port";

// Generador de shortCode aleatorio sin sesgo (unbiased): 9 chars [a-z0-9]
function generateShortCode(length = 9): string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	const byte = new Uint8Array(1);
	while (result.length < length) {
		crypto.getRandomValues(byte);
		const val = byte[0];
		// 36 * 7 = 252. Descartamos valores >= 252 para eliminar el sesgo del módulo (modulo bias).
		if (val < 252) {
			result += chars[val % chars.length];
		}
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

	async findByOriginalUrl(
		originalUrl: string,
		userId?: string | null,
	): Promise<UrlEntity | null> {
		const conditions = [eq(urlsTable.originalUrl, originalUrl)];
		if (userId !== undefined) {
			if (userId === null) {
				conditions.push(isNull(urlsTable.userId));
			} else {
				conditions.push(eq(urlsTable.userId, userId));
			}
		}

		const [url] = await this.db
			.select()
			.from(urlsTable)
			.where(and(...conditions))
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

	async findByUserIds(userIds: string[]): Promise<UrlEntity[]> {
		if (userIds.length === 0) return [];
		return this.db
			.select()
			.from(urlsTable)
			.where(
				sql`${urlsTable.userId} IN (${sql.join(
					userIds.map((id) => sql`${id}`),
					sql`, `,
				)})`,
			)
			.all();
	}

	async countByUserId(userId: string): Promise<number> {
		const result = await this.db
			.select({ value: count() })
			.from(urlsTable)
			.where(eq(urlsTable.userId, userId));
		return result[0]?.value ?? 0;
	}

	async findByUserShortCode(
		userId: string,
		shortCode: string,
	): Promise<UrlEntity | null> {
		const [url] = await this.db
			.select()
			.from(urlsTable)
			.where(
				and(eq(urlsTable.shortCode, shortCode), eq(urlsTable.userId, userId)),
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
				and(eq(urlsTable.shortCode, shortCode), eq(urlsTable.userId, userId)),
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

	async createForUser(
		userId: string,
		input: CreateUrlInput,
	): Promise<UrlEntity> {
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

	async findByShortCodeAndIncrementVisits(
		shortCode: string,
	): Promise<UrlEntity | null> {
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
			.where(isNull(urlsTable.userId));
	}
}
