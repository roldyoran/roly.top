export interface UrlInfoResponse {
	visits: number;
	createdAt: string;
	originalUrl: string;
	shortCode: string;
	id: number;
}

export interface UrlItem {
	originalUrl: string;
	shortCode: string;
	createdAt: string;
	visits: number;
	id: number;
}

export interface SavedUrlItem {
	original: string;
	short: string;
	date: string;
}

export interface ShortenResult {
	success: boolean;
	shortCode?: string;
	shortUrl?: string;
	originalUrl?: string;
}

export interface UserUrlsResponse {
	urls: UrlInfoResponse[];
	urlLimit: number;
}
