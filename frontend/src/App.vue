<template>
  <div class="min-h-screen flex flex-col relative">
    <div class="bg-ambient" aria-hidden="true" />
    <div class="bg-glow-center" aria-hidden="true" />
    <Toaster class="pointer-events-auto" />

    <!-- Auth error route: render directly, skip banned overlay -->
    <RouterView v-if="isAuthErrorRoute" />

    <!-- Banned user: show ban screen -->
    <BannedView v-else-if="authStore.isBanned" />

    <!-- Normal app: each view owns its own layout -->
    <RouterView v-else />
  </div>
</template>

<script setup lang="ts">
import { useColorMode } from "@vueuse/core";
import { computed, onMounted, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { Toaster } from "@/components/ui/sonner";
import { useSeo } from "@/composables/useSeo";
import { useAuthStore } from "@/stores/authStore";
import { useUrlStore } from "@/stores/urlStore";
import "vue-sonner/style.css";
import BannedView from "@/views/BannedView.vue";

const route = useRoute();
const mode = useColorMode();
const urlStore = useUrlStore();
const authStore = useAuthStore();

const isAuthErrorRoute = computed(() => route.name === "auth-error");

useSeo({
	title: computed(() => {
		if (route.path.startsWith("/admin")) return "Admin";
		if (isAuthErrorRoute.value) return "Error de autenticación";
		return "Acortador de URLs";
	}),
	robots: computed(() =>
		route.path.startsWith("/admin") || isAuthErrorRoute.value
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

onMounted(() => {
	urlStore.initialize();
	authStore.initialize();
});
</script>
