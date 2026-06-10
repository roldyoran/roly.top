import { getAxiosInstance } from "./http";

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

export interface AdminUrl {
	id: number;
	originalUrl: string;
	shortCode: string;
	createdAt: string;
	visits: number;
	userId: string | null;
}

export async function getAdminStats(): Promise<AdminStats> {
	const axios = getAxiosInstance();
	const { data } = await axios.get("/v1/admin/stats");
	return data;
}

export async function getAdminUsers(
	page = 1,
	pageSize = 20,
	search?: string,
): Promise<PaginatedResult<AdminUser>> {
	const axios = getAxiosInstance();
	const params: Record<string, string | number> = { page, pageSize };
	if (search) params.search = search;
	const { data } = await axios.get("/v1/admin/users", { params });
	return data;
}

export async function getAdminUser(userId: string): Promise<AdminUser> {
	const axios = getAxiosInstance();
	const { data } = await axios.get(`/v1/admin/users/${userId}`);
	return data;
}

export async function getUsersByIds(userIds: string[]): Promise<AdminUser[]> {
	if (!userIds || userIds.length === 0) return [];
	const axios = getAxiosInstance();
	const params = { ids: userIds.join(",") };
	const { data } = await axios.get(`/v1/admin/users`, { params });
	return data;
}

export async function banUser(
	userId: string,
	reason?: string,
	expiresAt?: string,
): Promise<void> {
	const axios = getAxiosInstance();
	await axios.post(`/v1/admin/users/${userId}/ban`, { reason, expiresAt });
}

export async function unbanUser(userId: string): Promise<void> {
	const axios = getAxiosInstance();
	await axios.post(`/v1/admin/users/${userId}/unban`);
}

export async function updateUserUrlLimit(
	userId: string,
	limit: number,
): Promise<void> {
	const axios = getAxiosInstance();
	await axios.patch(`/v1/admin/users/${userId}/url-limit`, { limit });
}

export async function deleteUser(userId: string): Promise<void> {
	const axios = getAxiosInstance();
	await axios.delete(`/v1/admin/users/${userId}`);
}

export async function getAdminUrls(
	page = 1,
	pageSize = 20,
	search?: string,
): Promise<PaginatedResult<AdminUrl>> {
	const axios = getAxiosInstance();
	const params: Record<string, string | number> = { page, pageSize };
	if (search) params.search = search;
	const { data } = await axios.get("/v1/admin/urls", { params });
	return data;
}

export async function deleteAdminUrl(shortCode: string): Promise<void> {
	const axios = getAxiosInstance();
	await axios.delete(`/v1/admin/urls/${shortCode}`);
}
