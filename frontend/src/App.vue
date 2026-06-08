<template>
  <div class="min-h-screen flex flex-col relative">
    <div class="bg-ambient" aria-hidden="true" />
    <div class="bg-glow-center" aria-hidden="true" />
    <Toaster class="pointer-events-auto" />

    <NavbarHeader :attempts="attempts" />

    <main id="main-content" class="flex-grow container mx-auto px-4 py-4 relative z-10" tabindex="-1">
      <TooltipProvider>
        <HomeView />

        <div class="space-y-6 mt-8">
          <Tabs v-model="activeTab" class="w-full">
            <div class="block sm:hidden space-y-3">
              <h2 class="text-sm font-semibold text-center text-muted-foreground mb-3">
                Selecciona una funcionalidad:
              </h2>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-label="Ver información de URL"
                  :aria-pressed="activeTab === 'info'"
                  @click="activeTab = 'info'"
                  :class="[
                    'flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors duration-200',
                    activeTab === 'info'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-background hover:bg-muted'
                  ]"
                >
                  <Info class="w-5 h-5" />
                  <span class="text-xs font-medium">Ver Info</span>
                </button>

                <button
                  type="button"
                  aria-label="Mis URLs"
                  :aria-pressed="activeTab === 'myurls'"
                  @click="activeTab = 'myurls'"
                  :class="[
                    'flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors duration-200',
                    activeTab === 'myurls'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-background hover:bg-muted'
                  ]"
                >
                  <Database class="w-5 h-5" />
                  <span class="text-xs font-medium">Mis URLs</span>
                </button>

                <button
                  type="button"
                  aria-label="Lista pública de URLs"
                  :aria-pressed="activeTab === 'list'"
                  @click="activeTab = 'list'"
                  class="col-span-2"
                  :class="[
                    'flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors duration-200',
                    activeTab === 'list'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-background hover:bg-muted'
                  ]"
                >
                  <List class="w-5 h-5" />
                  <span class="text-xs font-medium">Lista Pública</span>
                </button>

                <button
                  type="button"
                  aria-label="Generar QR"
                  :aria-pressed="activeTab === 'qr'"
                  @click="activeTab = 'qr'"
                  class="col-span-2"
                  :class="[
                    'flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors duration-200',
                    activeTab === 'qr'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-background hover:bg-muted'
                  ]"
                >
                  <QrCode class="w-5 h-5" />
                  <span class="text-xs font-medium">Generar QR</span>
                </button>
              </div>
            </div>

            <TabsList class="hidden sm:grid w-full max-w-md mx-auto grid-cols-4 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger
                value="info"
                class="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-colors"
              >
                <Info class="w-4 h-4" />
                <span>Información</span>
              </TabsTrigger>
              <TabsTrigger
                value="myurls"
                class="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-colors"
              >
                <Database class="w-4 h-4" />
                <span>Mis URLs</span>
              </TabsTrigger>
              <TabsTrigger
                value="list"
                class="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-colors"
              >
                <List class="w-4 h-4" />
                <span>Lista URLs</span>
              </TabsTrigger>
              <TabsTrigger
                value="qr"
                class="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-colors"
              >
                <QrCode class="w-4 h-4" />
                <span>Generar QR</span>
              </TabsTrigger>
            </TabsList>

            <div class="mt-6">
              <Transition name="tab-fade" mode="out-in">
                <div :key="activeTab">
                  <TabsContent value="info">
                    <UrlInfoForm />
                  </TabsContent>
                  <TabsContent value="myurls">
                    <UrlsList mode="my" />
                  </TabsContent>
                  <TabsContent value="list">
                    <UrlsList mode="public" />
                  </TabsContent>
                  <TabsContent value="qr">
                    <QrGenerator />
                  </TabsContent>
                </div>
              </Transition>
            </div>
          </Tabs>
        </div>
      </TooltipProvider>
    </main>

    <FooterComponent :attempts="attempts" />
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useColorMode } from "@vueuse/core";
import { Info, Database, List, QrCode } from "lucide-vue-next";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUrlStore } from "@/stores/urlStore";
import { useAuthStore } from "@/stores/authStore";
import "vue-sonner/style.css";
import NavbarHeader from "@/components/layout/NavbarHeader.vue";
import HomeView from "@/views/HomeView.vue";
import FooterComponent from "@/components/layout/FooterComponent.vue";
import UrlInfoForm from "@/components/features/url-info/UrlInfoForm.vue";
import UrlsList from "@/components/features/urls/UrlsList.vue";
import QrGenerator from "@/components/features/qr-generator/QrGenerator.vue";

type Tab = "info" | "myurls" | "list" | "qr";

const mode = useColorMode();
const urlStore = useUrlStore();
const authStore = useAuthStore();

watchEffect(() => {
	if (mode.value === "dark") {
		document.documentElement.classList.add("dark");
	} else {
		document.documentElement.classList.remove("dark");
	}
});

useColorMode();

const activeTab = ref<Tab>(
	urlStore.currentTab === "shorten" ? "info" : (urlStore.currentTab as Tab),
);
const attempts = ref(urlStore.urlCount);

onMounted(() => {
	urlStore.initialize();
	authStore.initialize();
	activeTab.value =
		urlStore.currentTab === "shorten" ? "info" : (urlStore.currentTab as Tab);
	attempts.value = urlStore.urlCount;
});

import { onMounted } from "vue";
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

.tab-fade-enter-active,
.tab-fade-leave-active {
	transition: opacity 0.2s ease, transform 0.2s ease;
}

.tab-fade-enter-from,
.tab-fade-leave-to {
	opacity: 0;
	transform: translateY(6px);
}
</style>
