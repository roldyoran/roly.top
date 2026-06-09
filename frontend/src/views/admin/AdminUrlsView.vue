<template>
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold tracking-tight">URLs</h1>
				<p class="text-muted-foreground">Gestiona todas las URLs acortadas</p>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<div class="relative flex-1 max-w-sm">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input v-model="searchQuery" placeholder="Buscar por shortCode o URL..." class="pl-9" @input="onSearch" />
			</div>
		</div>

		<Card>
			<CardContent class="p-0">
				<div v-if="adminStore.isLoadingUrls" class="p-6 space-y-2">
					<Skeleton v-for="i in 10" :key="i" class="h-12 w-full" />
				</div>
				<div v-else-if="!adminStore.urls?.data.length" class="p-12 text-center">
					<Link class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
					<p class="text-muted-foreground">No se encontraron URLs</p>
				</div>
				<Table v-else>
					<TableHeader>
						<TableRow>
							<TableHead>Short Code</TableHead>
							<TableHead>URL Original</TableHead>
							<TableHead>Visitas</TableHead>
							<TableHead>Creada</TableHead>
							<TableHead class="text-right">Acciones</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow v-for="url in adminStore.urls.data" :key="url.shortCode">
							<TableCell>
								<code class="font-mono text-primary font-semibold">/{{ url.shortCode }}</code>
							</TableCell>
							<TableCell>
								<span class="text-sm truncate max-w-[300px] block">{{ url.originalUrl }}</span>
							</TableCell>
							<TableCell>
								<span class="text-sm">{{ url.visits }}</span>
							</TableCell>
							<TableCell>
								<span class="text-sm text-muted-foreground">{{ formatDate(url.createdAt) }}</span>
							</TableCell>
							<TableCell class="text-right">
								<div class="flex items-center justify-end gap-1">
									<Tooltip>
										<TooltipTrigger as-child>
											<Button variant="ghost" size="sm" class="h-8 w-8 p-0" @click="copyUrl(url.shortCode)">
												<Copy class="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>Copiar URL</TooltipContent>
									</Tooltip>
									<Tooltip>
										<TooltipTrigger as-child>
											<Button variant="ghost" size="sm" class="h-8 w-8 p-0 text-destructive hover:text-destructive" @click="confirmDelete(url)">
												<Trash2 class="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>Eliminar</TooltipContent>
									</Tooltip>
								</div>
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</CardContent>
		</Card>

		<!-- Pagination -->
		<div v-if="adminStore.urls && adminStore.urls.totalPages > 1" class="flex items-center justify-between">
			<p class="text-sm text-muted-foreground">
				Mostrando {{ (adminStore.urls.page - 1) * adminStore.urls.pageSize + 1 }}
				- {{ Math.min(adminStore.urls.page * adminStore.urls.pageSize, adminStore.urls.total) }}
				de {{ adminStore.urls.total }} URLs
			</p>
			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm" :disabled="adminStore.urls.page <= 1" @click="goToPage(adminStore.urls.page - 1)">
					Anterior
				</Button>
				<Button variant="outline" size="sm" :disabled="adminStore.urls.page >= adminStore.urls.totalPages" @click="goToPage(adminStore.urls.page + 1)">
					Siguiente
				</Button>
			</div>
		</div>

		<!-- Delete Dialog -->
		<Dialog v-model:open="deleteOpen">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Eliminar URL</DialogTitle>
					<DialogDescription>
						¿Estás seguro de eliminar la URL <code class="font-mono">/{{ selectedUrl?.shortCode }}</code>? Esta acción no se puede deshacer.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" @click="deleteOpen = false">Cancelar</Button>
					<Button variant="destructive" @click="handleDeleteConfirm">Eliminar</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { Copy, Link, Search, Trash2 } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import type { AdminUrl } from "@/api/admin";
import { deleteAdminUrl } from "@/api/admin";
import { getAppBaseUrl } from "@/api/http";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopyToClipboard } from "@/composables/useCopyToClipboard";
import { useAdminStore } from "@/stores/adminStore";

const adminStore = useAdminStore();
const { copyToClipboard } = useCopyToClipboard();

const searchQuery = ref("");
const deleteOpen = ref(false);
const selectedUrl = ref<AdminUrl | null>(null);

let searchTimeout: ReturnType<typeof setTimeout>;

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("es-ES", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

function onSearch() {
	clearTimeout(searchTimeout);
	searchTimeout = setTimeout(() => {
		adminStore.fetchUrls(1, 20, searchQuery.value || undefined);
	}, 300);
}

function goToPage(page: number) {
	adminStore.fetchUrls(page, 20, searchQuery.value || undefined);
}

function copyUrl(shortCode: string) {
	copyToClipboard(`${getAppBaseUrl()}/${shortCode}`, "URL copiada");
}

function confirmDelete(url: AdminUrl) {
	selectedUrl.value = url;
	deleteOpen.value = true;
}

async function handleDeleteConfirm() {
	if (!selectedUrl.value) return;
	try {
		await deleteAdminUrl(selectedUrl.value.shortCode);
		toast.success("URL eliminada");
		deleteOpen.value = false;
		adminStore.fetchUrls(
			adminStore.urls?.page ?? 1,
			20,
			searchQuery.value || undefined,
		);
	} catch {
		toast.error("Error al eliminar la URL");
	}
}

onMounted(() => {
	adminStore.fetchUrls(1, 20);
});
</script>
