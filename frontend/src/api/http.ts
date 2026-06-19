import axios, {
	type AxiosError,
	type AxiosInstance,
	type AxiosResponse,
	type InternalAxiosRequestConfig,
} from "axios";

// Devuelve la URL base de la API, preferencia: env VITE_API_BASE_URL -> localStorage apiUrl -> fallback
export function getApiBaseUrl(): string {
	const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
	if (envUrl && envUrl.length > 0) return envUrl;
	const stored = localStorage.getItem("apiUrl");
	if (stored) return stored;
	// En dev, el proxy de Vite redirige /api al backend
	if (import.meta.env.DEV) return "";
	return "";
}

// Devuelve la URL base del frontend para construir URLs cortas
// Preferencia: env VITE_APP_BASE_URL -> window.location.origin
export function getAppBaseUrl(): string {
	const envUrl = import.meta.env.VITE_APP_BASE_URL as string | undefined;
	if (envUrl && envUrl.length > 0) return envUrl;
	if (typeof window !== "undefined") return window.location.origin;
	return "";
}

const CACHE_TTL = 300_000;
const CACHE_MAX = 50;
const CACHE_PREFIX = "cache:";

type CacheEntry = { data: unknown; timestamp: number };

function getAllCacheKeys(): string[] {
	const keys: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith(CACHE_PREFIX)) keys.push(key);
	}
	return keys;
}

function cleanExpiredCache(): void {
	const now = Date.now();
	for (const key of getAllCacheKeys()) {
		try {
			const raw = localStorage.getItem(key);
			if (!raw) continue;
			const entry: CacheEntry = JSON.parse(raw);
			if (now - entry.timestamp > CACHE_TTL) {
				localStorage.removeItem(key);
			}
		} catch {
			localStorage.removeItem(key);
		}
	}
}

function enforceMaxEntries(): void {
	const keys = getAllCacheKeys();
	if (keys.length <= CACHE_MAX) return;
	const entries: { key: string; timestamp: number }[] = [];
	for (const key of keys) {
		try {
			const raw = localStorage.getItem(key);
			if (!raw) continue;
			const entry: CacheEntry = JSON.parse(raw);
			entries.push({ key, timestamp: entry.timestamp });
		} catch {
			localStorage.removeItem(key);
		}
	}
	entries.sort((a, b) => a.timestamp - b.timestamp);
	const toRemove = entries.slice(0, entries.length - CACHE_MAX);
	for (const { key } of toRemove) {
		localStorage.removeItem(key);
	}
}

function setCache(key: string, data: unknown): void {
	const entry: CacheEntry = { data, timestamp: Date.now() };
	localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
	enforceMaxEntries();
}

function getCache(key: string): CacheEntry | null {
	try {
		const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
		if (!raw) return null;
		const entry: CacheEntry = JSON.parse(raw);
		if (Date.now() - entry.timestamp > CACHE_TTL) {
			localStorage.removeItem(`${CACHE_PREFIX}${key}`);
			return null;
		}
		return entry;
	} catch {
		return null;
	}
}

// Singleton axios instance
let _axiosInstance: AxiosInstance | null = null;

export function getAxiosInstance(): AxiosInstance {
	if (_axiosInstance) return _axiosInstance;

	const baseURL = getApiBaseUrl();
	const apiKey = import.meta.env.VITE_API_KEY || "";

	_axiosInstance = axios.create({
		baseURL,
		withCredentials: true,
		headers: {
			"Content-Type": "application/json",
			"x-api-key": apiKey,
		},
	});

	_axiosInstance.interceptors.request.use(
		(config: InternalAxiosRequestConfig) => {
			try {
				if (config?.method && config.method.toLowerCase() === "get") {
					cleanExpiredCache();
					const key = `etag:${config.url}`;
					const etag = localStorage.getItem(key);
					if (etag) {
						config.headers = config.headers || {};
						config.headers["If-None-Match"] = etag;
					}
				}
			} catch (_e) {
				// ignore
			}
			return config;
		},
	);

	// Response interceptor: store ETag + cache GET bodies; handle 304 Not Modified by returning cached payload
	_axiosInstance.interceptors.response.use(
		(response: AxiosResponse) => {
			try {
				if (
					response?.config?.method &&
					response.config.method.toLowerCase() === "get"
				) {
					const etag = response.headers?.etag || response.headers?.ETag;
					if (etag) {
						localStorage.setItem(`etag:${response.config.url}`, String(etag));
					}
					if (response.config.url) setCache(response.config.url, response.data);
				}
			} catch (_e) {
				// ignore cache errors
			}
			return response;
		},
		(error: AxiosError) => {
			const status = error?.response?.status;
			const config = error?.response?.config || error?.config;
			if (status === 304 && config) {
				try {
					const entry = config.url ? getCache(config.url) : null;
					const data = entry ? entry.data : null;
					return Promise.resolve({
						data,
						status: 304,
						headers: error.response?.headers,
						config,
					});
				} catch (_e) {
					return Promise.reject(error);
				}
			}
			return Promise.reject(error);
		},
	);

	return _axiosInstance;
}

// Función para acortar URL
export async function shortenUrlRequest(
	originalUrl: string,
	shortCode?: string,
	signal?: AbortSignal,
) {
	const axiosInstance = getAxiosInstance();
	if (shortCode) {
		const response = await axiosInstance.post(
			"/v1/urls",
			{
				originalUrl: originalUrl,
				shortCode: shortCode,
			},
			{ signal },
		);
		return response.data;
	} else {
		const response = await axiosInstance.post(
			"/v1/urls",
			{
				originalUrl: originalUrl,
			},
			{ signal },
		);
		return response.data;
	}
}

// Función para obtener información de una URL corta
export async function getUrlInfoRequest(
	shortCode: string,
	signal?: AbortSignal,
) {
	const axiosInstance = getAxiosInstance();
	const response = await axiosInstance.get(`/v1/urls/${shortCode}`, { signal });
	return response.data;
}

// Funcion para obtener todas las URLs del usuario autenticado
export async function getUrlsRequest(signal?: AbortSignal) {
	const axiosInstance = getAxiosInstance();
	const response = await axiosInstance.get("/v1/urls", { signal });
	return response.data;
}

// Funcion para obtener URLs públicas (sin auth)
export async function getPublicUrlsRequest(signal?: AbortSignal) {
	const axiosInstance = getAxiosInstance();
	const response = await axiosInstance.get("/v1/urls/public", { signal });
	return response.data;
}

// Funcion para obtener estadísticas públicas (sin auth)
export async function getPublicStatsRequest(signal?: AbortSignal) {
	const axiosInstance = getAxiosInstance();
	const response = await axiosInstance.get("/v1/urls/public/stats", { signal });
	return response.data as { publicUrls: number; totalRedirects: number };
}

// Función para eliminar una URL del usuario autenticado
export async function deleteUrlRequest(
	shortCode: string,
	signal?: AbortSignal,
) {
	const axiosInstance = getAxiosInstance();
	const response = await axiosInstance.delete(`/v1/urls/${shortCode}`, {
		signal,
	});
	return response.data;
}
