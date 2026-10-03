import type { UrlEntity } from "@/server/domain/url/url.entity";

export interface DashboardClicksByDay {
	date: string;
	clicks: number;
}

export interface DashboardTopLink {
	id: string;
	shortCode: string;
	clicks: number;
}

export interface DashboardPagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface DashboardSummary {
	urls: UrlEntity[];
	pagination: DashboardPagination;
	totalUrls: number;
	totalClicks: number;
	clicksByDay: DashboardClicksByDay[];
	topLinks: DashboardTopLink[];
}

export type DashboardRangeDays = 7 | 30 | 90;