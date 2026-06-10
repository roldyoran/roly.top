import axios, { type AxiosInstance } from "axios";

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

	// Basic response interceptor for centralized error handling
	_axiosInstance.interceptors.response.use(
		(response) => response,
		(error) => {
			// Aquí se puede manejar 401 globalmente, logging, retries, etc.
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
export async function getUrlInfoRequest(shortCode: string, signal?: AbortSignal) {
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

// Función para eliminar una URL del usuario autenticado
export async function deleteUrlRequest(shortCode: string, signal?: AbortSignal) {
	const axiosInstance = getAxiosInstance();
	const response = await axiosInstance.delete(`/v1/urls/${shortCode}`, { signal });
	return response.data;
}
