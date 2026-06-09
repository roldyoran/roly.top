export interface AdminUser {
	id: string;
	name: string;
	email: string;
	image: string | null;
	role: string;
	banned: boolean;
	banReason: string | null;
	banExpires: Date | null;
	urlLimit: number;
	createdAt: Date;
	urlCount: number;
}

export interface AdminStats {
	totalUsers: number;
	totalUrls: number;
	totalVisits: number;
	adminUsers: number;
	bannedUsers: number;
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}
