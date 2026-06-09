<template>
	<div class="space-y-6">
		<div class="flex items-center justify-between animate-fade-in-up">
			<div>
				<h1 class="font-display text-2xl font-bold tracking-tight">URLs</h1>
				<p class="text-muted-foreground text-sm mt-1">Gestiona todas las URLs acortadas</p>
			</div>
		</div>

		<div class="flex items-center gap-3 animate-fade-in-up" style="animation-delay: 100ms;">
			<div class="relative flex-1 max-w-sm">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					v-model="searchQuery"
					placeholder="Buscar por shortCode o URL..."
					class="pl-9 h-10 rounded-xl bg-muted/30 border-muted focus:bg-card transition-colors"
					@input="onSearch"
				/>
			</div>
		</div>

		<div class="rounded-2xl border bg-card overflow-hidden animate-fade-in-up" style="animation-delay: 200ms;">
			<div v-if="adminStore.isLoadingUrls" class="p-6 space-y-3">
				<div v-for="i in 10" :key="i" class="flex items-center gap-4 py-3 px-4">
					<Skeleton class="h-6 w-24 rounded-lg" />
					<Skeleton class="h-4 flex-1 rounded-md" />
					<Skeleton class="h-4 w-10 rounded-md" />
					<Skeleton class="h-4 w-20 rounded-md" />
					<div class="flex gap-1">
						<Skeleton class="h-8 w-8 rounded-lg" />
						<Skeleton class="h-8 w-8 rounded-lg" />
					</div>
				</div>
			</div>
			<div v-else-if="!adminStore.urls?.data.length" class="p-16 text-center">
				<div class="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
					<Link class="w-7 h-7 text-muted-foreground/50" />
				</div>
				<p class="text-sm font-medium text-muted-foreground">No se encontraron URLs</p>
				<p class="text-xs text-muted-foreground/60 mt-1">Las URLs acortadas aparecerán aquí</p>
			</div>

			<div v-else class="hidden md:block">
				<Table class="admin-table">
					<TableHeader>
						<TableRow class="hover:bg-transparent border-b bg-muted/20">
							<TableHead class="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 h-11 pl-5">
								Short Code
							</TableHead>
							<TableHead class="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 h-11">
								URL Original
							</TableHead>
							<TableHead class="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 h-11 w-20">
								Visitas
							</TableHead>
							<TableHead class="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 h-11 w-28">
								Creada
							</TableHead>
							<TableHead class="text-right text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 h-11 pr-5 w-24">
								Acciones
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow
							v-for="(url, index) in adminStore.urls.data"
							:key="url.shortCode"
							class="group transition-all duration-150 hover:bg-muted/40 border-b border-border/50 last:border-b-0"
						>
							<TableCell class="pl-5 py-3.5">
								<div class="flex items-center gap-2.5">
									<span class="text-[10px] text-muted-foreground/40 font-mono tabular-nums w-4 text-right">
										{{ (adminStore.urls.page - 1) * adminStore.urls.pageSize + index + 1 }}
									</span>
									<code class="font-mono text-primary font-semibold text-xs bg-primary/10 px-2.5 py-1 rounded-lg ring-1 ring-primary/10">
										/{{ url.shortCode }}
									</code>
								</div>
							</TableCell>
							<TableCell class="py-3.5">
								<span class="text-sm truncate max-w-[300px] block text-muted-foreground/80">{{ url.originalUrl }}</span>
							</TableCell>
							<TableCell class="py-3.5 w-20">
								<div class="flex items-center gap-1.5">
									<div class="w-1 h-1 rounded-full bg-primary/40" />
									<span class="text-sm font-semibold tabular-nums">{{ url.visits }}</span>
								</div>
							</TableCell>
							<TableCell class="py-3.5 w-28">
								<span class="text-xs text-muted-foreground/60 font-medium">{{ formatDate(url.createdAt) }}</span>
							</TableCell>
							<TableCell class="text-right py-3.5 pr-5 w-24">
								<div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
									<Tooltip>
										<TooltipTrigger as-child>
											<Button
												variant="ghost"
												size="sm"
												class="h-7 w-7 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
												@click="copyUrl(url.shortCode)"
											>
												<Copy class="h-3.5 w-3.5" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>Copiar URL</TooltipContent>
									</Tooltip>
									<Tooltip>
										<TooltipTrigger as-child>
											<Button
												variant="ghost"
												size="sm"
												class="h-7 w-7 p-0 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10"
												@click="confirmDelete(url)"
											>
												<Trash2 class="h-3.5 w-3.5" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>Eliminar</TooltipContent>
									</Tooltip>
								</div>
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>

			<div v-if="adminStore.urls?.data.length" class="md:hidden divide-y divide-border/50">
				<div
					v-for="(url, index) in adminStore.urls.data"
					:key="url.shortCode"
					class="p-4 space-y-3"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2.5">
							<span class="text-[10px] text-muted-foreground/40 font-mono tabular-nums">
								{{ (adminStore.urls.page - 1) * adminStore.urls.pageSize + index + 1 }}
							</span>
							<code class="font-mono text-primary font-semibold text-xs bg-primary/10 px-2.5 py-1 rounded-lg ring-1 ring-primary/10">
								/{{ url.shortCode }}
							</code>
						</div>
						<span class="text-xs font-medium tabular-nums text-muted-foreground whitespace-nowrap">{{ url.visits }} visitas</span>
					</div>
					<p class="text-xs text-muted-foreground/70 truncate leading-relaxed">{{ url.originalUrl }}</p>
					<div class="flex items-center justify-between">
						<span class="text-[11px] text-muted-foreground/50 font-medium">{{ formatDate(url.createdAt) }}</span>
						<div class="flex items-center gap-1">
							<Button
								variant="ghost"
								size="sm"
								class="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
								@click="copyUrl(url.shortCode)"
							>
								<Copy class="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								class="h-8 w-8 p-0 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10"
								@click="confirmDelete(url)"
							>
								<Trash2 class="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div
			v-if="adminStore.urls && adminStore.urls.totalPages > 1"
			class="flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in-up"
			style="animation-delay: 300ms;"
		>
			<p class="text-xs text-muted-foreground text-center sm:text-left">
				Mostrando {{ (adminStore.urls.page - 1) * adminStore.urls.pageSize + 1 }}
				- {{ Math.min(adminStore.urls.page * adminStore.urls.pageSize, adminStore.urls.total) }}
				de {{ adminStore.urls.total }} URLs
			</p>
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					class="h-9 sm:h-8 rounded-lg text-xs px-3"
					:disabled="adminStore.urls.page <= 1"
					@click="goToPage(adminStore.urls.page - 1)"
				>
					Anterior
				</Button>
				<span class="text-xs font-medium tabular-nums px-2">
					{{ adminStore.urls.page }} / {{ adminStore.urls.totalPages }}
				</span>
				<Button
					variant="outline"
					size="sm"
					class="h-9 sm:h-8 rounded-lg text-xs px-3"
					:disabled="adminStore.urls.page >= adminStore.urls.totalPages"
					@click="goToPage(adminStore.urls.page + 1)"
				>
					Siguiente
				</Button>
			</div>
		</div>

		<Dialog v-model:open="deleteOpen">
			<DialogContent class="rounded-2xl">
				<DialogHeader>
					<DialogTitle class="font-display">Eliminar URL</DialogTitle>
					<DialogDescription>
						¿Estás seguro de eliminar la URL <code class="font-mono text-xs bg-muted px-1.5 py-0.5 rounded-md">/{{ selectedUrl?.shortCode }}</code>? Esta acción no se puede deshacer.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" class="rounded-xl" @click="deleteOpen = false">Cancelar</Button>
					<Button variant="destructive" class="rounded-xl" @click="handleDeleteConfirm">Eliminar</Button>
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
