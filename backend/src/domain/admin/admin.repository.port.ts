import type { UrlEntity } from "@/domain/url/url.entity";
import type { AdminUser, AdminStats, PaginatedResult } from "./admin.entity";

export interface AdminRepositoryPort {
	findAllUsers(params: {
		page: number;
		pageSize: number;
		search?: string;
	}): Promise<PaginatedResult<AdminUser>>;
	findUserById(userId: string): Promise<AdminUser | null>;
	findUsersByIds(userIds: string[]): Promise<AdminUser[]>;
	banUser(userId: string, reason?: string, expiresAt?: Date): Promise<void>;
	unbanUser(userId: string): Promise<void>;
	updateUserUrlLimit(userId: string, limit: number): Promise<void>;
	deleteUser(userId: string): Promise<void>;
	getStats(): Promise<AdminStats>;
	findAllUrls(params: {
		page: number;
		pageSize: number;
		search?: string;
	}): Promise<PaginatedResult<UrlEntity>>;
	deleteUrlByShortCode(shortCode: string): Promise<UrlEntity | null>;
}
