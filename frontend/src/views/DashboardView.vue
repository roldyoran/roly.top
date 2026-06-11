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
import { ref } from "vue";
import AdminUrlsPanel from "@/components/features/dashboard/AdminUrlsPanel.vue";
import AdminUsersPanel from "@/components/features/dashboard/AdminUsersPanel.vue";
import AnalyticsPanel from "@/components/features/dashboard/AnalyticsPanel.vue";
import CreateLinkPanel from "@/components/features/dashboard/CreateLinkPanel.vue";
import MyLinksPanel from "@/components/features/dashboard/MyLinksPanel.vue";
import OverviewPanel from "@/components/features/dashboard/OverviewPanel.vue";
import PublicListDashPanel from "@/components/features/dashboard/PublicListDashPanel.vue";
import QRDashPanel from "@/components/features/dashboard/QRDashPanel.vue";
import SettingsPanel from "@/components/features/dashboard/SettingsPanel.vue";
import DashboardLayout from "@/components/layout/DashboardLayout.vue";

const activePanel = ref("overview");
</script>