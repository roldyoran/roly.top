import { defineStore } from "pinia";
import { ref } from "vue";
import {
	type AdminStats,
	type AdminUrl,
	type AdminUser,
	getAdminStats,
	getAdminUrls,
	getAdminUsers,
	type PaginatedResult,
} from "@/api/admin";

export const useAdminStore = defineStore("adminStore", () => {
	const stats = ref<AdminStats | null>(null);
	const users = ref<PaginatedResult<AdminUser> | null>(null);
	const urls = ref<PaginatedResult<AdminUrl> | null>(null);
	const isLoadingStats = ref(false);
	const isLoadingUsers = ref(false);
	const isLoadingUrls = ref(false);

	async function fetchStats() {
		isLoadingStats.value = true;
		try {
			stats.value = await getAdminStats();
		} catch (error) {
			console.error("[ADMIN-STORE] fetchStats error:", error);
		} finally {
			isLoadingStats.value = false;
		}
	}

	async function fetchUsers(page = 1, pageSize = 20, search?: string) {
		isLoadingUsers.value = true;
		try {
			users.value = await getAdminUsers(page, pageSize, search);
		} catch (error) {
			console.error("[ADMIN-STORE] fetchUsers error:", error);
		} finally {
			isLoadingUsers.value = false;
		}
	}

	async function fetchUrls(page = 1, pageSize = 20, search?: string) {
		isLoadingUrls.value = true;
		try {
			urls.value = await getAdminUrls(page, pageSize, search);
		} catch (error) {
			console.error("[ADMIN-STORE] fetchUrls error:", error);
		} finally {
			isLoadingUrls.value = false;
		}
	}

	return {
		stats,
		users,
		urls,
		isLoadingStats,
		isLoadingUsers,
		isLoadingUrls,
		fetchStats,
		fetchUsers,
		fetchUrls,
	};
});
