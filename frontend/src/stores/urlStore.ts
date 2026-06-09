import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { SavedUrlItem, UserSession } from "@/api/types";

export type { SavedUrlItem, UserSession };

// Store de URLs
export const useUrlStore = defineStore("urlStore", () => {
	// Estado reactivo
	const savedUrls = ref<SavedUrlItem[]>([]);
	const userSession = ref<UserSession>({
		remainingAttempts: 3,
		sessionId: generateSessionId(),
		lastReset: new Date().toISOString(),
	});

	// Estado de la aplicación
	const isLoading = ref(false);
	const currentTab = ref<"shorten" | "info" | "myurls" | "list">("shorten");
	const urlLimit = ref(2);
	const currentUserId = ref<string | null>(null);

	// Getters computados
	const hasRemainingAttempts = computed(
		() => userSession.value.remainingAttempts > 0,
	);
	const urlCount = computed(() => savedUrls.value.length);
	const canUseService = computed(() => hasRemainingAttempts.value);

	// Funciones de utilidad
	function generateSessionId(): string {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	}

	function getUrlStorageKey(userId: string): string {
		return `savedUrls_${userId}`;
	}

	function setUrlLimit(limit: number) {
		urlLimit.value = limit;
	}

	function shouldResetAttempts(): boolean {
		const lastReset = new Date(userSession.value.lastReset);
		const now = new Date();
		const hoursSinceReset =
			(now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
		return hoursSinceReset >= 24;
	}

	// Acciones del store
	function loadUserSession() {
		try {
			const stored = localStorage.getItem("userSession");
			if (stored) {
				const parsedSession = JSON.parse(stored) as UserSession;

				if (shouldResetAttempts()) {
					resetAttempts();
				} else {
					userSession.value = {
						...parsedSession,
						sessionId: parsedSession.sessionId || generateSessionId(),
					};
				}
			} else {
				saveUserSession();
			}
		} catch (error) {
			console.error("Error loading user session:", error);
			resetUserSession();
		}
	}

	function saveUserSession() {
		try {
			localStorage.setItem("userSession", JSON.stringify(userSession.value));
		} catch (error) {
			console.error("Error saving user session:", error);
		}
	}

	function resetUserSession() {
		userSession.value = {
			remainingAttempts: 3,
			sessionId: generateSessionId(),
			lastReset: new Date().toISOString(),
		};
		saveUserSession();
	}

	function resetAttempts() {
		userSession.value.remainingAttempts = 3;
		userSession.value.lastReset = new Date().toISOString();
		saveUserSession();
	}

	function decrementAttempts() {
		if (userSession.value.remainingAttempts > 0) {
			userSession.value.remainingAttempts--;
			saveUserSession();
			return true;
		}
		return false;
	}

	// Funciones para URLs guardadas (por usuario en localStorage)
	function loadSavedUrls(userId?: string) {
		const uid = userId || currentUserId.value;
		if (!uid) {
			savedUrls.value = [];
			return;
		}

		currentUserId.value = uid;

		try {
			const key = getUrlStorageKey(uid);
			const stored = localStorage.getItem(key);
			if (stored) {
				const parsed: SavedUrlItem[] = JSON.parse(stored);
				savedUrls.value = parsed.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
				);
			} else {
				savedUrls.value = [];
			}
		} catch (error) {
			console.error("Error loading saved URLs:", error);
			savedUrls.value = [];
		}
	}

	function saveSavedUrls() {
		if (!currentUserId.value) return;
		try {
			const key = getUrlStorageKey(currentUserId.value);
			localStorage.setItem(key, JSON.stringify(savedUrls.value));
		} catch (error) {
			console.error("Error saving URLs:", error);
		}
	}

	function addUrl(original: string, short: string) {
		const newUrl: SavedUrlItem = {
			original,
			short,
			date: new Date().toISOString(),
		};

		savedUrls.value.unshift(newUrl);

		if (savedUrls.value.length > 50) {
			savedUrls.value = savedUrls.value.slice(0, 50);
		}

		savedUrls.value = removeDuplicateUrls(savedUrls.value);

		saveSavedUrls();
	}

	function removeUrl(original: string, short: string) {
		savedUrls.value = savedUrls.value.filter(
			(url) => !(url.original === original && url.short === short),
		);
		saveSavedUrls();
	}

	function clearAllUrls() {
		savedUrls.value = [];
		saveSavedUrls();
	}

	function clearUserUrls(userId?: string) {
		const uid = userId || currentUserId.value;
		if (uid) {
			localStorage.removeItem(getUrlStorageKey(uid));
		}
		savedUrls.value = [];
		currentUserId.value = null;
	}

	function removeDuplicateUrls(urlList: SavedUrlItem[]): SavedUrlItem[] {
		const seen = new Set<string>();
		return urlList.filter((url) => {
			if (seen.has(url.original)) return false;
			seen.add(url.original);
			return true;
		});
	}

	// Funciones de navegación
	function setCurrentTab(tab: typeof currentTab.value) {
		currentTab.value = tab;
	}

	// Función de inicialización
	function initialize(userId?: string) {
		loadUserSession();
		loadSavedUrls(userId);
	}

	// Funciones para debugging
	function getDebugInfo() {
		return {
			session: userSession.value,
			urlCount: savedUrls.value.length,
			canUse: canUseService.value,
			shouldReset: shouldResetAttempts(),
			userId: currentUserId.value,
		};
	}

	return {
		// Estado
		savedUrls,
		userSession,
		isLoading,
		currentTab,
		currentUserId,

		// Getters
		hasRemainingAttempts,
		urlCount,
		urlLimit,
		canUseService,

		// Acciones - Sesión de usuario
		loadUserSession,
		saveUserSession,
		resetUserSession,
		resetAttempts,
		decrementAttempts,

		// Acciones - URLs
		loadSavedUrls,
		addUrl,
		removeUrl,
		clearAllUrls,
		clearUserUrls,
		setUrlLimit,

		// Acciones - Navegación
		setCurrentTab,

		// Inicialización
		initialize,

		// Debug
		getDebugInfo,
	};
});
