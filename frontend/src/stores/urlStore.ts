import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { SavedUrlItem } from "@/api/types";

export type { SavedUrlItem };

// Store de URLs
export const useUrlStore = defineStore("urlStore", () => {
	// Estado reactivo
	const savedUrls = ref<SavedUrlItem[]>([]);

	// Estado de la aplicación
	const isLoading = ref(false);
	const currentTab = ref<"shorten" | "info" | "myurls" | "list">("shorten");
	const urlLimit = ref(2);
	const currentUserId = ref<string | null>(null);

	// Cache para evitar llamadas excesivas a la API de lista pública
	const lastPublicListFetch = ref<string | null>(null);
	const lastUserUrlCreated = ref<string | null>(null);
	const CACHE_DURATION_MS = 5 * 60 * 1000;

	// Getters computados
	const urlCount = computed(() => savedUrls.value.length);
	const canUseService = computed(() => urlCount.value < urlLimit.value);

	// Funciones de utilidad
	function getUrlStorageKey(userId: string): string {
		return `savedUrls_${userId}`;
	}

	function setUrlLimit(limit: number) {
		urlLimit.value = limit;
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
	function initialize(userId?: string) {
		loadSavedUrls(userId);
	}

	function setUrlLimitFromRole(role?: string) {
		urlLimit.value = role === "admin" ? 999 : 2;
	}

	// Funciones para debugging
	function getDebugInfo() {
		return {
			urlCount: savedUrls.value.length,
			urlLimit: urlLimit.value,
			canUse: canUseService.value,
			userId: currentUserId.value,
		};
	}

	return {
		// Estado
		savedUrls,
		isLoading,
		currentTab,
		currentUserId,

		// Getters
		urlCount,
		urlLimit,
		canUseService,

		// Acciones - URLs
		loadSavedUrls,
		addUrl,
		removeUrl,
		clearAllUrls,
		clearUserUrls,
		setUrlLimit,
		setUrlLimitFromRole,

		// Acciones - Navegación
		setCurrentTab,

		// Acciones - Cache de lista pública
		shouldFetchPublicList,
		updatePublicListFetchTime,

		// Inicialización
		initialize,

		// Debug
		getDebugInfo,
	};
});
