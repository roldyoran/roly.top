import { useUrlStore } from "@/stores/urlStore";
import { toast } from "vue-sonner";
import { shortenUrlRequest, getAppBaseUrl } from "@/api/http";
import type { UrlInfoResponse } from "@/api/types";
import { useQueryClient } from "@tanstack/vue-query";

/**
 * Composable para manejar el acortamiento de URLs
 */
export const useUrlShortener = () => {
	const urlStore = useUrlStore();

	const shortenUrl = async (
		originalUrl: string,
		customHash?: string,
	): Promise<{
		success: boolean;
		shortCode?: string;
		shortUrl?: string;
		originalUrl?: string;
	}> => {
		// Verificar si puede usar el servicio (límite del backend)
		if (!urlStore.canUseService) {
			toast.error("Límite de URLs alcanzado", {
				description: `Has alcanzado el límite máximo de ${urlStore.urlLimit} URLs. Elimina URLs existentes o contacta al administrador.`,
			});
			return { success: false };
		}

		try {
			urlStore.isLoading = true;

			// Validar hash personalizado si se proporciona
			if (customHash && !/^[a-z0-9]+$/.test(customHash)) {
				toast.error("Hash inválido", {
					description:
						"El hash personalizado solo puede contener letras, números, guiones y guiones bajos.",
				});
				return { success: false };
			}

			// Realizar petición a la API
			const data: UrlInfoResponse = await shortenUrlRequest(
				originalUrl,
				customHash,
			);

			if (data && data.shortCode) {
				// Agregar URL al store
				urlStore.addUrl(data.originalUrl, data.shortCode);

				// Construir URL completa y mostrar notificación de éxito
				const builtShortUrl = `${getAppBaseUrl()}/${data.shortCode}`;
				toast.success("¡URL acortada exitosamente!", {
					description: `URL corta: ${builtShortUrl}`,
				});

				// Invalidate related queries
				try {
					const qc = useQueryClient();
					qc.invalidateQueries(["userUrls"]);
					qc.invalidateQueries(["publicUrls"]);
				} catch (e) {
					// ignore if queryClient not available
				}

				return {
					success: true,
					shortCode: data.shortCode,
					shortUrl: builtShortUrl,
					originalUrl: data.originalUrl,
				};
			} else {
				toast.error("Respuesta inválida", {
					description: "La respuesta de la API no es válida.",
				});
				return { success: false };
			}
		} catch (error: any) {
			if (
				error?.response?.status === 409 &&
				error?.response?.data?.error?.code === "URL_LIMIT_REACHED"
			) {
				const message =
					error?.response?.data?.error?.message ||
					`Límite de ${urlStore.urlLimit} URLs alcanzado`;
				toast.error("Límite alcanzado", {
					description: message,
				});
				return { success: false };
			}
			const errorMessage =
				error?.response?.data?.message || "Error al acortar la URL";
			toast.error("Error en el servidor", {
				description: errorMessage,
			});
			return { success: false };
		} finally {
			urlStore.isLoading = false;
		}
	};

	return {
		shortenUrl,
		isLoading: urlStore.isLoading,
	};
};
