import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import { claimUrlRequest } from "@/api/http";
import { useAuth } from "@/composables/useAuth";
import { useUrlStore } from "@/stores/urlStore";
import type { AuthUser } from "@/types";

export const useAuthStore = defineStore("authStore", () => {
	const {
		user,
		session,
		isAuthenticated,
		isLoading,
		signInWithGoogle,
		signOutUser,
		fetchSession,
	} = useAuth();

	const isInitialized = ref(false);

	const currentUser = computed<AuthUser | null>(() => {
		if (!user.value) return null;
		return {
			id: user.value.id as string,
			name: user.value.name as string,
			email: user.value.email as string,
			image: user.value.image as string | null,
			role: user.value.role as string | undefined,
			banned: user.value.banned as boolean | undefined,
			banReason: user.value.banReason as string | null | undefined,
			banExpires: user.value.banExpires as string | null | undefined,
		};
	});

	const userId = computed(() => currentUser.value?.id ?? null);

	const userName = computed(() => currentUser.value?.name ?? "");
	const userEmail = computed(() => currentUser.value?.email ?? "");
	const userImage = computed(() => currentUser.value?.image ?? null);
	const isAdmin = computed(() => user.value?.role === "admin");
	const isBanned = computed(() => user.value?.banned === true);
	const banReason = computed(() => (user.value?.banReason as string) ?? null);
	const banExpires = computed(() => (user.value?.banExpires as string) ?? null);

	async function initialize() {
		if (isInitialized.value) return;
		try {
			await fetchSession();
		} catch {
			// Silenciar errores de sesión no válida
		} finally {
			isInitialized.value = true;
			const urlStore = useUrlStore();
			urlStore.setUrlLimitFromRole(user.value?.role as string | undefined);

			// Auto-claim de URL anónima pendiente
			if (user.value) {
				await tryClaimPendingUrl();
			}
		}
	}

	async function tryClaimPendingUrl() {
		const pending = localStorage.getItem("pending_claim");
		if (!pending) return;

		try {
			const { claimToken } = JSON.parse(pending);
			// Validar que claimToken sea un UUID válido antes de enviar
			if (!claimToken || typeof claimToken !== "string") {
				localStorage.removeItem("pending_claim");
				return;
			}
			await claimUrlRequest(claimToken);
			localStorage.removeItem("pending_claim");
			toast.success("URL reclamada", {
				description: "Tu URL anónima ahora está vinculada a tu cuenta.",
			});
		} catch (error: unknown) {
			const errObj = error as {
				response?: { data?: { error?: { code?: string } } };
			};
			const code = errObj?.response?.data?.error?.code;

			if (code === "URL_EXPIRED") {
				toast.error("Tu URL anónima expiró", {
					description: "Crea una nueva desde el inicio.",
				});
			} else if (code === "URL_ALREADY_CLAIMED") {
				// Ya fue reclamada, limpiar silenciosamente
			} else {
				toast.error("No se pudo reclamar la URL");
			}
			localStorage.removeItem("pending_claim");
		}
	}

	function resetAuth() {
		const urlStore = useUrlStore();
		urlStore.clearUserUrls(userId.value ?? undefined);
		urlStore.setUrlLimitFromRole(undefined);
		user.value = null;
		session.value = null;
		isInitialized.value = false;
	}

	watch(userId, (newId, oldId) => {
		if (newId && newId !== oldId) {
			const urlStore = useUrlStore();
			urlStore.initialize(newId);
		}
	});

	return {
		user,
		isAuthenticated,
		isAdmin,
		isBanned,
		banReason,
		banExpires,
		isLoading,
		isInitialized,
		currentUser,
		userId,
		userName,
		userEmail,
		userImage,
		initialize,
		resetAuth,
		signIn: signInWithGoogle,
		signOut: signOutUser,
	};
});
