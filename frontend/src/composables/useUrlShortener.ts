import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { toast } from "vue-sonner";
import { getAppBaseUrl, shortenUrlRequest } from "@/api/http";
import type { SavedUrlItem, UrlInfoResponse } from "@/api/types";
import { useUrlStore } from "@/stores/urlStore";

/**
 * Composable para manejar el acortamiento de URLs
 */
export const useUrlShortener = () => {
	const urlStore = useUrlStore();

	const queryClient = useQueryClient();

	const shortenMutation = useMutation<
		UrlInfoResponse,
		unknown,
		{ originalUrl: string; customHash?: string },
		{ previousSaved: SavedUrlItem[]; tempShort?: string }
	>({
		mutationFn: async ({ originalUrl, customHash }) => {
			return await shortenUrlRequest(originalUrl, customHash);
		},
		onMutate: async ({ originalUrl }) => {
			await queryClient.cancelQueries({ queryKey: ["userUrls"] });
			const previousSaved = urlStore.savedUrls
				? JSON.parse(JSON.stringify(urlStore.savedUrls))
				: [];
			const tempShort = `temp-${Date.now()}`;
			urlStore.addUrl(originalUrl, tempShort);
			return { previousSaved, tempShort };
		},
		onError: (
			_err: unknown,
			_vars: { originalUrl: string; customHash?: string },
			context:
				| { previousSaved: SavedUrlItem[]; tempShort?: string }
				| undefined,
		) => {
			if (context?.previousSaved) {
				urlStore.clearAllUrls();
				for (const u of context.previousSaved) {
					urlStore.addUrl(u.original, u.short);
				}
			}
		},
		onSuccess: (
			data: UrlInfoResponse,
			vars: { originalUrl: string; customHash?: string },
			context:
				| { previousSaved: SavedUrlItem[]; tempShort?: string }
				| undefined,
		) => {
			// replace temp entry with real shortCode
			if (context?.tempShort) {
				// remove temp
				urlStore.removeUrl(vars.originalUrl, context.tempShort);
			}
			urlStore.addUrl(data.originalUrl, data.shortCode);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["userUrls"] });
			queryClient.invalidateQueries({ queryKey: ["publicUrls"] });
		},
	});

	const shortenUrl = async (
		originalUrl: string,
		customHash?: string,
	): Promise<{
		success: boolean;
		shortCode?: string;
		shortUrl?: string;
		originalUrl?: string;
		error?: string;
	}> => {
		// Verificar si puede usar el servicio (límite del backend)
		if (!urlStore.canUseService) {
			toast.error("Límite de URLs alcanzado", {
				description: `Has alcanzado el límite máximo de ${urlStore.urlLimit} URLs. Elimina URLs existentes o contacta al administrador.`,
			});
			return { success: false };
		}

		// Validar hash personalizado si se proporciona
		if (customHash) {
			if (!/^[a-z0-9]+$/.test(customHash)) {
				toast.error("Hash inválido", {
					description:
						"El hash personalizado solo puede contener letras minúsculas y números (a-z, 0-9).",
				});
				return { success: false };
			}
			if (customHash.length > 9) {
				toast.error("Hash demasiado largo", {
					description:
						"El hash personalizado no puede tener más de 9 caracteres.",
				});
				return { success: false };
			}
		}

		try {
			console.log("[shortenUrl] calling shortenMutation", {
				originalUrl,
				customHash,
			});
			console.log("[shortenUrl] urlStore debug:", urlStore.getDebugInfo());
			urlStore.isLoading = true;
			const data = await shortenMutation.mutateAsync({
				originalUrl,
				customHash,
			});
			console.log("[shortenUrl] mutateAsync result:", data);
			if (data?.shortCode) {
				return {
					success: true,
					shortCode: data.shortCode,
					shortUrl: `${getAppBaseUrl()}/${data.shortCode}`,
					originalUrl: data.originalUrl,
				};
			}
			return { success: false };
		} catch (error: unknown) {
			console.error("[shortenUrl] caught error:", error);
			const errObj = error as {
				response?: { data?: { error?: { message?: string } } };
				message?: string;
			};
			const msg =
				errObj?.response?.data?.error?.message ||
				errObj?.message ||
				"Error al acortar la URL";
			return { success: false, error: msg };
		} finally {
			urlStore.isLoading = false;
		}
	};

	return {
		shortenUrl,
		isLoading: urlStore.isLoading,
	};
};
