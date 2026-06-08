import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useAuth } from "@/composables/useAuth";

interface AuthUser {
	id: string;
	name: string;
	email: string;
	image?: string | null;
}

export const useAuthStore = defineStore("authStore", () => {
	const {
		user,
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
		};
	});

	const userName = computed(() => currentUser.value?.name ?? "");
	const userEmail = computed(() => currentUser.value?.email ?? "");
	const userImage = computed(() => currentUser.value?.image ?? null);
	const isAdmin = computed(() => user.value?.role === "admin");

	async function initialize() {
		if (isInitialized.value) return;
		try {
			await fetchSession();
		} catch {
			// Silenciar errores de sesión no válida
		} finally {
			isInitialized.value = true;
		}
	}

	return {
		user,
		isAuthenticated,
		isAdmin,
		isLoading,
		isInitialized,
		currentUser,
		userName,
		userEmail,
		userImage,
		initialize,
		signIn: signInWithGoogle,
		signOut: signOutUser,
	};
});
