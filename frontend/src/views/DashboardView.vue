<template>
  <DashboardLayout :panel="activePanel" @update:panel="activePanel = $event">
    <template #default>
      <component :is="currentComponent" v-if="currentComponent" @navigate="activePanel = $event" />
    </template>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch } from "vue";
import DashboardLayout from "@/components/layout/DashboardLayout.vue";

const panelImports: Record<string, () => Promise<{ default: any }>> = {
	overview: () => import("@/components/features/dashboard/OverviewPanel.vue"),
	myurls: () => import("@/components/features/dashboard/MyLinksPanel.vue"),
	analytics: () => import("@/components/features/dashboard/AnalyticsPanel.vue"),
	create: () => import("@/components/features/dashboard/CreateLinkPanel.vue"),
	qrdash: () => import("@/components/features/dashboard/QRDashPanel.vue"),
	publiclist: () => import("@/components/features/dashboard/PublicListDashPanel.vue"),
	settings: () => import("@/components/features/dashboard/SettingsPanel.vue"),
	"admin-users": () => import("@/components/features/dashboard/AdminUsersPanel.vue"),
	"admin-urls": () => import("@/components/features/dashboard/AdminUrlsPanel.vue"),
};

const loadedComponents = new Map<string, any>();
const activePanel = ref("overview");
const currentComponent = shallowRef<any>(null);

watch(activePanel, async (panel) => {
	if (!loadedComponents.has(panel)) {
		const mod = await panelImports[panel]?.();
		if (mod) loadedComponents.set(panel, mod.default);
	}
	currentComponent.value = loadedComponents.get(panel) ?? null;
}, { immediate: true });
</script>