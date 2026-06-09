import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useAuth } from "@/composables/useAuth";
import { useUrlStore } from "@/stores/urlStore";

interface AuthUser {
	id: string;
	name: string;
	email: string;
	image?: string | null;
	role?: string;
	banned?: boolean;
	banReason?: string | null;
	banExpires?: string | null;
}

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
