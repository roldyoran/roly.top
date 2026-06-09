<template>
  <div class="min-h-screen flex flex-col relative">
    <div class="bg-ambient" aria-hidden="true" />
    <div class="bg-glow-center" aria-hidden="true" />
    <Toaster class="pointer-events-auto" />

    <!-- Auth error route: render directly, skip banned overlay -->
    <RouterView v-if="isAuthErrorRoute" />

    <!-- Banned user: show ban screen -->
    <BannedView v-else-if="authStore.isBanned" />

    <!-- Normal app -->
    <template v-else>
      <NavbarHeader :attempts="attempts" />

    <!-- Admin routes: render via RouterView -->
    <div v-if="isAdminRoute" class="relative z-10 flex-grow">
      <RouterView />
    </div>

    <!-- Home routes: existing layout -->
    <template v-else>
      <main id="main-content" class="flex-grow container mx-auto px-4 py-4 relative z-10" tabindex="-1">
        <TooltipProvider>
          <HomeView />

          <div class="space-y-6 mt-8">
            <Tabs v-model="activeTab" class="w-full">
              <div class="block sm:hidden space-y-3">
                <h2 class="text-sm font-semibold text-center text-muted-foreground mb-3">
                  Selecciona una funcionalidad:
                </h2>
                <div class="grid grid-cols-2 gap-3 p-1">
                  <button
                    v-for="tab in mobileTabs"
                    :key="tab.value"
                    type="button"
                    :aria-label="tab.ariaLabel"
                    :aria-pressed="activeTab === tab.value"
                    @click="activeTab = tab.value"
                    :class="[
                      'flex flex-col items-center gap-2 p-3.5 rounded-lg border transition-colors duration-200',
                      tab.colSpan,
                      activeTab === tab.value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-background hover:bg-muted'
                    ]"
                  >
                    <component :is="tab.icon" class="w-5 h-5" />
                    <span class="text-xs font-medium">{{ tab.label }}</span>
                  </button>
                </div>
              </div>

              <TabsList class="hidden sm:flex w-full max-w-lg mx-auto justify-center gap-2 bg-muted/50 p-2 rounded-xl">
                <TabsTrigger
                  v-for="tab in desktopTabs"
                  :key="tab.value"
                  :value="tab.value"
                  class="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-colors"
                >
                  <component :is="tab.icon" class="w-4 h-4" />
                  <span>{{ tab.label }}</span>
                </TabsTrigger>
              </TabsList>

              <div class="mt-6 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    v-if="activeTab === 'list'"
                    key="list"
                    :initial="{ opacity: 0, y: 16 }"
                    :animate="{ opacity: 1, y: 0 }"
                    :exit="{ opacity: 0, y: -10 }"
                    :transition="{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }"
                  >
                    <UrlsList mode="public" />
                  </motion.div>
                  <motion.div
                    v-else-if="activeTab === 'myurls'"
                    key="myurls"
                    :initial="{ opacity: 0, y: 16 }"
                    :animate="{ opacity: 1, y: 0 }"
                    :exit="{ opacity: 0, y: -10 }"
                    :transition="{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }"
                  >
                    <UrlsList mode="my" />
                  </motion.div>
                  <motion.div
                    v-else-if="activeTab === 'info'"
                    key="info"
                    :initial="{ opacity: 0, y: 16 }"
                    :animate="{ opacity: 1, y: 0 }"
                    :exit="{ opacity: 0, y: -10 }"
                    :transition="{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }"
                  >
                    <UrlInfoForm />
                  </motion.div>
                  <motion.div
                    v-else-if="activeTab === 'qr'"
                    key="qr"
                    :initial="{ opacity: 0, y: 16 }"
                    :animate="{ opacity: 1, y: 0 }"
                    :exit="{ opacity: 0, y: -10 }"
                    :transition="{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }"
                  >
                    <QrGenerator />
                  </motion.div>
                </AnimatePresence>
              </div>
            </Tabs>
          </div>
        </TooltipProvider>
      </main>

      <FooterComponent :attempts="attempts" />
    </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useColorMode } from "@vueuse/core";
import { Database, Info, List, QrCode } from "lucide-vue-next";
import { AnimatePresence, motion } from "motion-v";
import { type Component, computed, onMounted, ref, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSeo } from "@/composables/useSeo";
import { useAuthStore } from "@/stores/authStore";
import { useUrlStore } from "@/stores/urlStore";
import "vue-sonner/style.css";
import QrGenerator from "@/components/features/qr-generator/QrGenerator.vue";
import UrlInfoForm from "@/components/features/url-info/UrlInfoForm.vue";
import UrlsList from "@/components/features/urls/UrlsList.vue";
import FooterComponent from "@/components/layout/FooterComponent.vue";
import NavbarHeader from "@/components/layout/NavbarHeader.vue";
import BannedView from "@/views/BannedView.vue";
import HomeView from "@/views/HomeView.vue";

type Tab = "info" | "myurls" | "list" | "qr";

interface TabItem {
	value: Tab;
	label: string;
	ariaLabel: string;
	icon: Component;
	colSpan?: string;
}

const mobileTabs: TabItem[] = [
	{
		value: "list",
		label: "Lista Pública",
		ariaLabel: "Lista pública de URLs",
		icon: List,
		colSpan: "col-span-2",
	},
	{ value: "myurls", label: "Mis URLs", ariaLabel: "Mis URLs", icon: Database },
	{
		value: "info",
		label: "Ver Info",
		ariaLabel: "Ver información de URL",
		icon: Info,
	},
	{
		value: "qr",
		label: "Generar QR",
		ariaLabel: "Generar QR",
		icon: QrCode,
		colSpan: "col-span-2",
	},
];

const desktopTabs: TabItem[] = [
	{
		value: "list",
		label: "URLs públicas",
		ariaLabel: "Lista pública de URLs",
		icon: List,
	},
	{ value: "myurls", label: "Mis URLs", ariaLabel: "Mis URLs", icon: Database },
	{
		value: "info",
		label: "Información",
		ariaLabel: "Ver información de URL",
		icon: Info,
	},
	{ value: "qr", label: "Generar QR", ariaLabel: "Generar QR", icon: QrCode },
];

const route = useRoute();
const mode = useColorMode();
const urlStore = useUrlStore();
const authStore = useAuthStore();

const isAdminRoute = computed(() => route.path.startsWith("/admin"));
const isAuthErrorRoute = computed(() => route.name === "auth-error");

useSeo({
	title: computed(() => {
		if (isAdminRoute.value) return "Admin";
		if (isAuthErrorRoute.value) return "Error de autenticación";
		return "Acortador de URLs";
	}),
	robots: computed(() =>
		isAdminRoute.value || isAuthErrorRoute.value
			? "noindex, nofollow"
			: "index, follow",
	),
});

watchEffect(() => {
	if (mode.value === "dark") {
		document.documentElement.classList.add("dark");
	} else {
		document.documentElement.classList.remove("dark");
	}
});

useColorMode();

const activeTab = ref<Tab>(
	urlStore.currentTab === "shorten" ? "list" : (urlStore.currentTab as Tab),
);
const attempts = ref(urlStore.urlCount);

onMounted(() => {
	urlStore.initialize();
	authStore.initialize();
	activeTab.value =
		urlStore.currentTab === "shorten" ? "list" : (urlStore.currentTab as Tab);
	attempts.value = urlStore.urlCount;
});
</script>

<style scoped>
@keyframes gentle-bounce {
	0%,
	100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-6px);
	}
}

@media (prefers-reduced-motion: reduce) {
	.github-bounce {
		animation: none;
	}
}

.github-bounce {
	animation: gentle-bounce 3s ease-in-out infinite;
}

.github-bounce:hover {
	animation: none;
}
</style>
