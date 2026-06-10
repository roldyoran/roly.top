import { eq, sql, count, like, desc } from "drizzle-orm";
import type { DrizzleDB } from "@/db";
import { urlsTable } from "@/db/schema";
import { users } from "@/db/auth-schema";
import type { UrlEntity } from "@/domain/url/url.entity";
import type { AdminRepositoryPort } from "@/domain/admin/admin.repository.port";
import type {
	AdminUser,
	AdminStats,
	PaginatedResult,
} from "@/domain/admin/admin.entity";

export class AdminRepository implements AdminRepositoryPort {
	private static instance: AdminRepository | null = null;

	static getInstance(db: DrizzleDB): AdminRepository {
		if (!this.instance) {
			this.instance = new AdminRepository(db);
		}
		return this.instance;
	}

	constructor(private readonly db: DrizzleDB) {}

	async findAllUsers(params: {
		page: number;
		pageSize: number;
		search?: string;
	}): Promise<PaginatedResult<AdminUser>> {
		const { page, pageSize, search } = params;
		const offset = (page - 1) * pageSize;

		const searchCondition = search
			? sql`${like(users.name, `%${search}%`)} OR ${like(users.email, `%${search}%`)}`
			: undefined;

		const [totalResult] = await this.db
			.select({ value: count() })
			.from(users)
			.where(searchCondition);

		const total = totalResult?.value ?? 0;

		const rows = await this.db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				role: users.role,
				banned: users.banned,
				banReason: users.banReason,
				banExpires: users.banExpires,
				urlLimit: users.urlLimit,
				createdAt: users.createdAt,
			})
			.from(users)
			.where(searchCondition)
			.orderBy(desc(users.createdAt))
			.limit(pageSize)
			.offset(offset);

		const userIds = rows.map((r) => r.id);
		const urlCounts =
			userIds.length > 0
				? await this.db
						.select({
							userId: urlsTable.userId,
							count: count(),
						})
						.from(urlsTable)
						.where(
							sql`${urlsTable.userId} IN (${sql.join(
								userIds.map((id) => sql`${id}`),
								sql`, `,
							)})`,
						)
						.groupBy(urlsTable.userId)
				: [];

		const urlCountMap = new Map(urlCounts.map((uc) => [uc.userId, uc.count]));

		const data: AdminUser[] = rows.map((row) => ({
			id: row.id,
			name: row.name,
			email: row.email,
			image: row.image,
			role: row.role ?? "user",
			banned: row.banned ?? false,
			banReason: row.banReason ?? null,
			banExpires: row.banExpires ?? null,
			urlLimit: row.urlLimit ?? 2,
			createdAt: row.createdAt,
			urlCount: urlCountMap.get(row.id) ?? 0,
		}));

		return {
			data,
			total,
			page,
			pageSize,
			totalPages: Math.ceil(total / pageSize),
		};
	}


	async findUserById(userId: string): Promise<AdminUser | null> {
		const [row] = await this.db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				role: users.role,
				banned: users.banned,
				banReason: users.banReason,
				banExpires: users.banExpires,
				urlLimit: users.urlLimit,
				createdAt: users.createdAt,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (!row) return null;

		const [{ value: urlCount }] = await this.db
			.select({ value: count() })
			.from(urlsTable)
			.where(eq(urlsTable.userId, userId));

		return {
			id: row.id,
			name: row.name,
			email: row.email,
			image: row.image,
			role: row.role ?? "user",
			banned: row.banned ?? false,
			banReason: row.banReason ?? null,
			banExpires: row.banExpires ?? null,
			urlLimit: row.urlLimit ?? 2,
			createdAt: row.createdAt,
			urlCount: urlCount ?? 0,
		};
	}

	async findUsersByIds(userIds: string[]): Promise<AdminUser[]> {
		if (userIds.length === 0) return [];

		const rows = await this.db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				role: users.role,
				banned: users.banned,
				banReason: users.banReason,
				banExpires: users.banExpires,
				urlLimit: users.urlLimit,
				createdAt: users.createdAt,
			})
			.from(users)
			.where(
				sql`${users.id} IN (${sql.join(userIds.map((id) => sql`${id}`), sql`, `)})`,
			);

		const urlCounts = await this.db
			.select({ userId: urlsTable.userId, count: count() })
			.from(urlsTable)
			.where(
				sql`${urlsTable.userId} IN (${sql.join(
					userIds.map((id) => sql`${id}`),
					sql`, `,
				)})`,
			)
			.groupBy(urlsTable.userId);

		const urlCountMap = new Map(urlCounts.map((uc) => [uc.userId, uc.count]));

		return rows.map((row) => ({
			id: row.id,
			name: row.name,
			email: row.email,
			image: row.image,
			role: row.role ?? "user",
			banned: row.banned ?? false,
			banReason: row.banReason ?? null,
			banExpires: row.banExpires ?? null,
			urlLimit: row.urlLimit ?? 2,
			createdAt: row.createdAt,
			urlCount: urlCountMap.get(row.id) ?? 0,
		}));
	}


	async banUser(
		userId: string,
		reason?: string,
		expiresAt?: Date,
	): Promise<void> {
		await this.db
			.update(users)
			.set({
				banned: true,
				banReason: reason ?? null,
				banExpires: expiresAt ?? null,
			})
			.where(eq(users.id, userId));
	}

	async unbanUser(userId: string): Promise<void> {
		await this.db
			.update(users)
			.set({
				banned: false,
				banReason: null,
				banExpires: null,
			})
			.where(eq(users.id, userId));
	}

	async updateUserUrlLimit(userId: string, limit: number): Promise<void> {
		await this.db
			.update(users)
			.set({ urlLimit: limit })
			.where(eq(users.id, userId));
	}

	async deleteUser(userId: string): Promise<void> {
		await this.db.delete(urlsTable).where(eq(urlsTable.userId, userId));
		await this.db.delete(users).where(eq(users.id, userId));
	}

	async getStats(): Promise<AdminStats> {
		const [totalUsersResult] = await this.db
			.select({ value: count() })
			.from(users);

		const [totalUrlsResult] = await this.db
			.select({ value: count() })
			.from(urlsTable);

		const [totalVisitsResult] = await this.db
			.select({ value: sql<number>`COALESCE(SUM(${urlsTable.visits}), 0)` })
			.from(urlsTable);

		const [adminUsersResult] = await this.db
			.select({ value: count() })
			.from(users)
			.where(eq(users.role, "admin"));

		const [bannedUsersResult] = await this.db
			.select({ value: count() })
			.from(users)
			.where(eq(users.banned, true));

		return {
			totalUsers: totalUsersResult?.value ?? 0,
			totalUrls: totalUrlsResult?.value ?? 0,
			totalVisits: totalVisitsResult?.value ?? 0,
			adminUsers: adminUsersResult?.value ?? 0,
			bannedUsers: bannedUsersResult?.value ?? 0,
		};
	}

	async findAllUrls(params: {
		page: number;
		pageSize: number;
		search?: string;
	}): Promise<PaginatedResult<UrlEntity>> {
		const { page, pageSize, search } = params;
		const offset = (page - 1) * pageSize;

		const searchCondition = search
			? sql`${like(urlsTable.shortCode, `%${search}%`)} OR ${like(urlsTable.originalUrl, `%${search}%`)}`
			: undefined;

		const [totalResult] = await this.db
			.select({ value: count() })
			.from(urlsTable)
			.where(searchCondition);

		const total = totalResult?.value ?? 0;

		const data = await this.db
			.select()
			.from(urlsTable)
			.where(searchCondition)
			.orderBy(desc(urlsTable.createdAt))
			.limit(pageSize)
			.offset(offset);

		return {
			data,
			total,
			page,
			pageSize,
			totalPages: Math.ceil(total / pageSize),
		};
	}

	async deleteUrlByShortCode(shortCode: string): Promise<UrlEntity | null> {
		const [deleted] = await this.db
			.delete(urlsTable)
			.where(eq(urlsTable.shortCode, shortCode))
			.returning();
		return deleted ?? null;
	}
}
