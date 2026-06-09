import { ref, computed } from "vue";
import { authClient } from "@/lib/auth-client";

// Estado global reactivo (plain Vue refs, NO Better Auth store)
const user = ref<Record<string, unknown> | null>(null);
const session = ref<Record<string, unknown> | null>(null);
const isLoading = ref(false);

/**
 * Composable de autenticación con Better Auth + Google
 */
export function useAuth() {
	const isAuthenticated = computed(() => !!user.value);

	async function signInWithGoogle() {
		isLoading.value = true;
		try {
			await authClient.signIn.social({
				provider: "google",
				callbackURL: window.location.origin,
			});
		} catch (error) {
			console.error("Error signing in with Google:", error);
			throw error;
		} finally {
			isLoading.value = false;
		}
	}

	async function signOutUser() {
		isLoading.value = true;
		try {
			await authClient.signOut();
			user.value = null;
			session.value = null;
			localStorage.removeItem("savedUrls");
			localStorage.removeItem("publicListCache");
		} catch (error) {
			console.error("Error signing out:", error);
			throw error;
		} finally {
			isLoading.value = false;
		}
	}

	async function fetchSession() {
		try {
			const data = await authClient.getSession();
			if (data?.data) {
				user.value = data.data.user as Record<string, unknown>;
				session.value = data.data.session as Record<string, unknown>;
			} else {
				user.value = null;
				session.value = null;
			}
		} catch {
			user.value = null;
			session.value = null;
		}
	}

	return {
		user,
		session,
		isAuthenticated,
		isLoading,
		signInWithGoogle,
		signOutUser,
		fetchSession,
	};
}
