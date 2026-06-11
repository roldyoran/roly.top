<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { computed } from "vue";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar.vue";
import ThemeToggle from "./ThemeToggle.vue";

const props = defineProps<{
	panel?: string;
}>();

const emit = defineEmits<{
	"update:panel": [value: string];
}>();

const panelLabels: Record<string, string> = {
	overview: "Panel",
	myurls: "Mis Enlaces",
	create: "Nuevo Enlace",
	analytics: "Analíticas",
	qrdash: "Códigos QR",
	publiclist: "Enlaces Públicos",
	settings: "Configuración",
	"admin-users": "Gestión de Usuarios",
	"admin-urls": "Gestión de URLs",
};

const currentPanel = computed(() => props.panel || "overview");

function switchPanel(id: string) {
	emit("update:panel", id);
}
</script>

<template>
	<SidebarProvider>
		<AppSidebar :current-panel="currentPanel" @update:panel="switchPanel" />

		<SidebarInset>
			<header class="flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
				<div class="flex items-center gap-3">
					<SidebarTrigger class="-ml-1" />
					<div class="flex items-center gap-2 font-mono text-sm">
						<span class="font-display font-800 text-primary">roly.top</span>
						<span class="text-muted-foreground">/</span>
						<span class="font-bold text-foreground">{{ panelLabels[currentPanel] || currentPanel }}</span>
					</div>
				</div>
				<div class="ml-auto flex items-center gap-2">
					<ThemeToggle />
					<Button size="sm" class="bg-primary text-primary-foreground font-display font-700 h-8 px-3" @click="switchPanel('create')">
						<Plus class="size-3 mr-1" />
						Nuevo Enlace
					</Button>
				</div>
			</header>

			<main class="flex-1 p-7 max-md:p-4">
				<slot :panel="currentPanel" />
			</main>
		</SidebarInset>
	</SidebarProvider>
</template>
