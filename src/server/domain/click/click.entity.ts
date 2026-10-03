export interface ClickEntity {
	id: string;
	urlId: string;
	country: string | null;
	device: string | null;
	browser: string | null;
	referer: string | null;
	createdAt: string;
}

export interface CreateClickInput {
	urlId: string;
	country?: string | null;
	device?: string | null;
	browser?: string | null;
	referer?: string | null;
}

export interface AnalyticsData {
	totalClicks: number;
	clicksByCountry: { country: string; count: number }[];
	clicksByDevice: { device: string; count: number }[];
	clicksByBrowser: { browser: string; count: number }[];
}
