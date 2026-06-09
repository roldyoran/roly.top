import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: "/",
			name: "home",
			component: () => import("@/views/HomeView.vue"),
		},
		{
			path: "/admin",
			component: () => import("@/components/features/admin/AdminLayout.vue"),
			meta: { requiresAdmin: true },
			children: [
				{
					path: "",
					redirect: "/admin/dashboard",
				},
				{
					path: "dashboard",
					name: "admin-dashboard",
					component: () => import("@/views/admin/AdminDashboardView.vue"),
				},
				{
					path: "users",
					name: "admin-users",
					component: () => import("@/views/admin/AdminUsersView.vue"),
				},
				{
					path: "urls",
					name: "admin-urls",
					component: () => import("@/views/admin/AdminUrlsView.vue"),
				},
			],
		},
	],
});

router.beforeEach(async (to, _from, next) => {
	if (to.meta.requiresAdmin) {
		const authStore = useAuthStore();

		if (!authStore.isInitialized) {
			await authStore.initialize();
		}

		if (!authStore.isAuthenticated) {
			next({ name: "home" });
			return;
		}
		if (!authStore.isAdmin) {
			next({ name: "home" });
			return;
		}
	}
	next();
});

export default router;
