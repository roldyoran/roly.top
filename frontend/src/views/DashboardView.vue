<template>
  <DashboardLayout :panel="activePanel" @update:panel="activePanel = $event">
    <template #default="{ panel }">
      <OverviewPanel v-if="panel === 'overview'" @navigate="activePanel = $event" />
      <MyLinksPanel v-else-if="panel === 'myurls'" @navigate="activePanel = $event" />
      <AnalyticsPanel v-else-if="panel === 'analytics'" />
      <CreateLinkPanel v-else-if="panel === 'create'" />
      <QRDashPanel v-else-if="panel === 'qrdash'" />
      <PublicListDashPanel v-else-if="panel === 'publiclist'" />
      <SettingsPanel v-else-if="panel === 'settings'" @navigate="activePanel = $event" />
      <AdminUsersPanel v-else-if="panel === 'admin-users'" />
      <AdminUrlsPanel v-else-if="panel === 'admin-urls'" />
    </template>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";
import DashboardLayout from "@/components/layout/DashboardLayout.vue";

const OverviewPanel = defineAsyncComponent(() => import("@/components/features/dashboard/OverviewPanel.vue"));
const MyLinksPanel = defineAsyncComponent(() => import("@/components/features/dashboard/MyLinksPanel.vue"));
const AnalyticsPanel = defineAsyncComponent(() => import("@/components/features/dashboard/AnalyticsPanel.vue"));
const CreateLinkPanel = defineAsyncComponent(() => import("@/components/features/dashboard/CreateLinkPanel.vue"));
const QRDashPanel = defineAsyncComponent(() => import("@/components/features/dashboard/QRDashPanel.vue"));
const PublicListDashPanel = defineAsyncComponent(() => import("@/components/features/dashboard/PublicListDashPanel.vue"));
const SettingsPanel = defineAsyncComponent(() => import("@/components/features/dashboard/SettingsPanel.vue"));
const AdminUsersPanel = defineAsyncComponent(() => import("@/components/features/dashboard/AdminUsersPanel.vue"));
const AdminUrlsPanel = defineAsyncComponent(() => import("@/components/features/dashboard/AdminUrlsPanel.vue"));

const activePanel = ref("overview");
</script>