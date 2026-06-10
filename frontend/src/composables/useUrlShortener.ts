import { useUrlStore } from "@/stores/urlStore";
import { toast } from "vue-sonner";
import { shortenUrlRequest, getAppBaseUrl } from "@/api/http";
import type { UrlInfoResponse } from "@/api/types";
import { useQueryClient, useMutation } from "@tanstack/vue-query";

/**
 * Composable para manejar el acortamiento de URLs
 */
export const useUrlShortener = () => {
	const urlStore = useUrlStore();


	const queryClient = useQueryClient();

	const shortenMutation = useMutation<UrlInfoResponse, unknown, { originalUrl: string; customHash?: string }, { previousSaved: any[]; tempShort?: string }>(
		async ({ originalUrl, customHash }) => {
			return await shortenUrlRequest(originalUrl, customHash);
		},
		{
			onMutate: async ({ originalUrl }) => {
				await queryClient.cancelQueries({ queryKey: ["userUrls"] });
				const previousSaved = urlStore.savedUrls ? JSON.parse(JSON.stringify(urlStore.savedUrls)) : [];
				const tempShort = `temp-${Date.now()}`;
				urlStore.addUrl(originalUrl, tempShort);
				return { previousSaved, tempShort };
			},
			onError: (err, vars, context) => {
				if (context?.previousSaved) {
					// restore previous saved urls
					urlStore.clearAllUrls();
					context.previousSaved.forEach((u: any) => urlStore.addUrl(u.original, u.short));
				}
				console.error('shortenMutation error:', err);
			},
			onSuccess: (data, vars, context) => {
				// replace temp entry with real shortCode
				if (context?.tempShort) {
					// remove temp
					urlStore.removeUrl(vars.originalUrl, context.tempShort);
				}
				urlStore.addUrl(data.originalUrl, data.shortCode);
				// show toast
				const builtShortUrl = `${getAppBaseUrl()}/${data.shortCode}`;
				toast.success("¡URL acortada exitosamente!", {
					description: `URL corta: ${builtShortUrl}`,
				});
			},
			onSettled: () => {
				queryClient.invalidateQueries({ queryKey: ["userUrls"] });
				queryClient.invalidateQueries({ queryKey: ["publicUrls"] });
			},
		},
	);

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

		// Validar hash personalizado si se proporciona
		if (customHash && !/^[a-z0-9]+$/.test(customHash)) {
			toast.error("Hash inválido", {
				description:
					"El hash personalizado solo puede contener letras, números, guiones y guiones bajos.",
			});
			return { success: false };
		}

		try {
			urlStore.isLoading = true;
			const data = await shortenMutation.mutateAsync({ originalUrl, customHash });
			if (data && data.shortCode) {
				return {
					success: true,
					shortCode: data.shortCode,
					shortUrl: `${getAppBaseUrl()}/${data.shortCode}`,
					originalUrl: data.originalUrl,
				};
			}
			return { success: false };
		} catch (error: any) {
			const errorMessage = error?.response?.data?.message || "Error al acortar la URL";
			toast.error("Error en el servidor", { description: errorMessage });
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
