import { and, count, desc, eq, sql } from "drizzle-orm";
import type { DrizzleDB } from "@/server/db";
import { urlsTable } from "@/server/db/schema";
import type {
	CreateUrlInput,
	PublicLink,
	UpdateUrlInput,
	UrlEntity,
} from "@/server/domain/url/url.entity";
import type {
	PaginatedResult,
	UrlRepositoryPort,
} from "@/server/domain/url/url.repository.port";
import {
	RESERVED_SHORT_CODES,
	SHORT_CODE_LENGTH,
} from "@/server/config/constants";
import { shortCodeSchema } from "@/shared/schemas/url.schema";

function generateShortCode(length = SHORT_CODE_LENGTH): string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	const byte = new Uint8Array(1);
	while (result.length < length) {
		crypto.getRandomValues(byte);
		const val = byte[0];
		if (val < 252) {
			result += chars[val % chars.length];
		}
	}
	return result;
}

export class UrlRepository implements UrlRepositoryPort {
	constructor(private readonly db: DrizzleDB) {}

	async findByShortCode(shortCode: string): Promise<UrlEntity | null> {
		const [url] = await this.db
			.select()
			.from(urlsTable)
			.where(eq(urlsTable.shortCode, shortCode))
			.limit(1);
		return url ?? null;
	}

	async findById(id: string): Promise<UrlEntity | null> {
		const [url] = await this.db
			.select()
			.from(urlsTable)
			.where(eq(urlsTable.id, id))
			.limit(1);
		return url ?? null;
	}

	async findByOriginalUrlAndIdentity(
		originalUrl: string,
		identity: { userId: string } | { sessionId: string },
	): Promise<UrlEntity | null> {
		const condition =
			"userId" in identity
				? eq(urlsTable.userId, identity.userId)
				: eq(urlsTable.sessionId, identity.sessionId);

		const [url] = await this.db
			.select()
			.from(urlsTable)
			.where(and(eq(urlsTable.originalUrl, originalUrl), condition))
			.limit(1);
		return url ?? null;
	}

	async countByIdentity(
		identity: { userId: string } | { sessionId: string },
	): Promise<number> {
		const condition =
			"userId" in identity
				? eq(urlsTable.userId, identity.userId)
				: eq(urlsTable.sessionId, identity.sessionId);

		const [result] = await this.db
			.select({ value: count() })
			.from(urlsTable)
			.where(condition);
		return result?.value ?? 0;
	}

	async findAll(page = 1, limit = 50): Promise<UrlEntity[]> {
		return this.db
			.select()
			.from(urlsTable)
			.orderBy(sql`${urlsTable.createdAt} DESC`)
			.limit(limit)
			.offset((page - 1) * limit);
	}

	async findByUserId(userId: string): Promise<UrlEntity[]> {
		return this.db
			.select()
			.from(urlsTable)
			.where(eq(urlsTable.userId, userId));
	}

	async findByIdentityWithPagination(
		identity: { userId: string } | { sessionId: string } | null,
		page: number,
		limit: number,
	): Promise<PaginatedResult<UrlEntity>> {
		const offset = (page - 1) * limit;

		let whereCondition;
		if (identity) {
			whereCondition =
				"userId" in identity
					? eq(urlsTable.userId, identity.userId)
					: eq(urlsTable.sessionId, identity.sessionId);
		}

		const [data, [{ total }]] = await Promise.all([
			this.db
				.select()
				.from(urlsTable)
				.where(whereCondition)
				.limit(limit)
				.offset(offset)
				.orderBy(sql`${urlsTable.createdAt} DESC`),
			this.db
				.select({ total: count() })
				.from(urlsTable)
				.where(whereCondition),
		]);

		return {
			data,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async createWithShortCode(
		input: CreateUrlInput,
		shortCode: string,
	): Promise<UrlEntity> {
		const createdAt = new Date().toISOString();
		const [created] = await this.db
			.insert(urlsTable)
			.values({
				originalUrl: input.originalUrl,
				shortCode,
				createdAt,
				userId: input.userId ?? null,
				sessionId: input.sessionId ?? null,
			})
			.returning();
		return created;
	}

	async create(input: CreateUrlInput): Promise<UrlEntity> {
		const shortCode = await this.generateAvailableShortCode();
		const createdAt = new Date().toISOString();

		const [created] = await this.db
			.insert(urlsTable)
			.values({
				originalUrl: input.originalUrl,
				shortCode,
				createdAt,
				userId: input.userId ?? null,
				sessionId: input.sessionId ?? null,
			})
			.returning();

		return created;
	}

	async update(id: string, input: UpdateUrlInput): Promise<UrlEntity> {
		const fields: Record<string, unknown> = {};
		if (input.originalUrl !== undefined) fields.originalUrl = input.originalUrl;
		if (input.title !== undefined) fields.title = input.title;
		if (input.isActive !== undefined) fields.isActive = input.isActive;
		if (input.isPublic !== undefined) fields.isPublic = input.isPublic;

		const [updated] = await this.db
			.update(urlsTable)
			.set(fields)
			.where(eq(urlsTable.id, id))
			.returning();
		return updated;
	}

	async delete(id: string): Promise<void> {
		// Este método no existía: `DeleteUrlUseCase` y el endpoint admin lo
		// llamaban y rompían en runtime (`this.urlRepository.delete is not
		// a function`). Borrado físico por id; las filas hijas de `clicks`
		// dependen de la FK de la migración.
		await this.db.delete(urlsTable).where(eq(urlsTable.id, id));
	}

	async findPublic(
		page: number,
		limit: number,
	): Promise<PaginatedResult<PublicLink>> {
		const offset = (page - 1) * limit;
		// Solo activos y marcados públicos. Sin owners: el catálogo expone
		// código, destino, título y clics (ver `PublicLink`).
		const condition = and(
			eq(urlsTable.isPublic, true),
			eq(urlsTable.isActive, true),
		);

		const [data, [{ total }]] = await Promise.all([
			this.db
				.select({
					shortCode: urlsTable.shortCode,
					originalUrl: urlsTable.originalUrl,
					title: urlsTable.title,
					clicks: urlsTable.visits,
					createdAt: urlsTable.createdAt,
				})
				.from(urlsTable)
				.where(condition)
				.orderBy(desc(urlsTable.visits))
				.limit(limit)
				.offset(offset),
			this.db
				.select({ total: count() })
				.from(urlsTable)
				.where(condition),
		]);

		return {
			data,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.max(1, Math.ceil(total / limit)),
			},
		};
	}

	async claimAnonymousUrls(input: {
		userId: string;
		anonymousId: string;
	}): Promise<number> {
		// `returning()` en vez de `.execute().rowsAffected`: el tipo
		// `D1Result` de la versión instalada de drizzle no expone
		// `rowsAffected` (fallaba `astro check`) y contar las filas
		// devueltas es portable entre drivers SQLite.
		const claimed = await this.db
			.update(urlsTable)
			.set({ userId: input.userId, sessionId: null })
			.where(
				and(
					eq(urlsTable.sessionId, input.anonymousId),
					sql`${urlsTable.userId} IS NULL`,
				),
			)
			.returning({ id: urlsTable.id });
		return claimed.length;
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

	private async generateAvailableShortCode(): Promise<string> {
		const maxAttempts = 10;
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const candidate = generateShortCode();
			if (!shortCodeSchema.safeParse(candidate).success) continue;
			if (RESERVED_SHORT_CODES.has(candidate)) continue;
			const existing = await this.findByShortCode(candidate);
			if (!existing) return candidate;
		}
		throw new Error("No se pudo generar un shortCode disponible");
	}
}
