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
	const urlLimit = ref(2); // Límite de URLs por usuario (default 2)

	// Cache para evitar llamadas excesivas a la API
	const lastPublicListFetch = ref<string | null>(null);
	const lastUserUrlCreated = ref<string | null>(null);
	const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos

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

	function setUrlLimit(limit: number) {
		urlLimit.value = limit;
	}

	function shouldResetAttempts(): boolean {
		const lastReset = new Date(userSession.value.lastReset);
		const now = new Date();
		const hoursSinceReset =
			(now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
		return hoursSinceReset >= 24; // Reset cada 24 horas
	}

	// Acciones del store
	function loadUserSession() {
		try {
			const stored = localStorage.getItem("userSession");
			if (stored) {
				const parsedSession = JSON.parse(stored) as UserSession;

				// Verificar si necesita reset por tiempo
				if (shouldResetAttempts()) {
					resetAttempts();
				} else {
					userSession.value = {
						...parsedSession,
						sessionId: parsedSession.sessionId || generateSessionId(),
					};
				}
			} else {
				// Nueva sesión
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

	// Funciones para URLs guardadas
	function loadSavedUrls() {
		savedUrls.value = [];
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

		lastUserUrlCreated.value = new Date().toISOString();
	}

	function removeUrl(original: string, short: string) {
		savedUrls.value = savedUrls.value.filter(
			(url) => !(url.original === original && url.short === short),
		);
	}

	function clearAllUrls() {
		savedUrls.value = [];
	}

	function removeDuplicateUrls(urlList: SavedUrlItem[]): SavedUrlItem[] {
		const seen = new Set<string>();
		return urlList.filter((url) => {
			if (seen.has(url.original)) return false;
			seen.add(url.original);
			return true;
		});
	}

	// Funciones para el cache de la lista pública
	function shouldFetchPublicList(): boolean {
		const now = Date.now();

		if (!lastPublicListFetch.value) {
			return true;
		}

		const timeSinceLastFetch =
			now - new Date(lastPublicListFetch.value).getTime();
		const timeSinceLastUserUrl = lastUserUrlCreated.value
			? now - new Date(lastUserUrlCreated.value).getTime()
			: 0;

		return (
			timeSinceLastFetch >= CACHE_DURATION_MS ||
			timeSinceLastUserUrl < CACHE_DURATION_MS
		);
	}

	function updatePublicListFetchTime() {
		lastPublicListFetch.value = new Date().toISOString();
	}

	// Funciones de navegación
	function setCurrentTab(tab: typeof currentTab.value) {
		currentTab.value = tab;
	}

	// Función de inicialización
	function initialize() {
		loadUserSession();
		loadSavedUrls();
	}

	// Funciones para debugging (solo desarrollo)
	function getDebugInfo() {
		return {
			session: userSession.value,
			urlCount: savedUrls.value.length,
			canUse: canUseService.value,
			shouldReset: shouldResetAttempts(),
		};
	}

	return {
		// Estado
		savedUrls,
		userSession,
		isLoading,
		currentTab,

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
		setUrlLimit,

		// Acciones - Navegación
		setCurrentTab,

		// Acciones - Cache de lista pública
		shouldFetchPublicList,
		updatePublicListFetchTime,

		// Inicialización
		initialize,

		// Debug (solo desarrollo)
		getDebugInfo,
	};
});
