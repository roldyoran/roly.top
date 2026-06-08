import axios from "axios";

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

// Obtiene la instancia de axios configurada
export function getAxiosInstance() {
	const baseURL = getApiBaseUrl();
	const apiKey = import.meta.env.VITE_API_KEY || "";

	return axios.create({
		baseURL,
		withCredentials: true,
		headers: {
			"Content-Type": "application/json",
			"x-api-key": apiKey,
		},
	});
}

// Función para acortar URL
export async function shortenUrlRequest(
	originalUrl: string,
	shortCode?: string,
) {
	const axiosInstance = getAxiosInstance();
	if (shortCode) {
		const response = await axiosInstance.post("/v1/urls", {
			originalUrl: originalUrl,
			shortCode: shortCode,
		});
		return response.data;
	} else {
		const response = await axiosInstance.post("/v1/urls", {
			originalUrl: originalUrl,
		});
		return response.data;
	}
}

// Función para obtener información de una URL corta
export async function getUrlInfoRequest(shortCode: string) {
	const axiosInstance = getAxiosInstance();
	const response = await axiosInstance.get(`/v1/urls/${shortCode}`);
	return response.data;
}

// Funcion para obtener todas las URLs del usuario autenticado
export async function getUrlsRequest() {
	const axiosInstance = getAxiosInstance();
	const response = await axiosInstance.get("/v1/urls");
	return response.data;
}

// Funcion para obtener URLs públicas (sin auth)
export async function getPublicUrlsRequest() {
	const axiosInstance = getAxiosInstance();
	const response = await axiosInstance.get("/v1/urls/public");
	return response.data;
}
