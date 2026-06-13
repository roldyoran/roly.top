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
							<TableHead class="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 h-11 w-40">
								Propietario
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
							<TableCell class="py-3.5 w-36">
								<span class="text-sm truncate max-w-[180px] block text-muted-foreground/80">{{ url.userId ? ownerNames[url.userId] || 'Cargando...' : '—' }}</span>
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
								<div class="flex items-center justify-end gap-1">
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
							<span class="text-xs text-muted-foreground/60 ml-3 truncate">{{ url.userId ? ownerNames[url.userId] || 'Cargando...' : '—' }}</span>
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

		<Dialog v-model:open="deleteOpen" :modal="false">
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
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/vue-query";
import { Copy, Link, Search, Trash2 } from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import { toast } from "vue-sonner";
import type { AdminUrl, AdminUser } from "@/api/admin";
import { deleteAdminUrl, getAdminUrls, getUsersByIds } from "@/api/admin";
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

// map of userId -> name for owners of the displayed URLs
const ownerNames = ref<Record<string, string>>({});

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
	searchTimeout = setTimeout(async () => {
		// actualizar params de query
		adminParams.value.page = 1;
		adminParams.value.search = searchQuery.value || undefined;
		// cancelar queries en vuelo para que Vue Query aborte la petición
		queryClient.cancelQueries({ queryKey: ["adminUrls"] });
		await adminQuery.refetch();
		// load owner names for the fetched urls (batch)
		const urls = adminStore.urls?.data ?? [];
		const ids = Array.from(
			new Set(urls.map((u) => u.userId).filter(Boolean) as string[]),
		);
		const idsToFetch = ids.filter((id) => id && !ownerNames.value[id]);
		if (idsToFetch.length === 0) return;
		try {
			const users = await getUsersByIds(idsToFetch);
			users.forEach((u: AdminUser) => {
				ownerNames.value[u.id] = u.name;
			});
		} catch (err) {
			idsToFetch.forEach((id) => (ownerNames.value[id] = "Unknown"));
			console.error("[AdminUrls] loadOwners error", err);
		}
	}, 300);
}

function goToPage(page: number) {
	adminParams.value.page = page;
	// cancelar queries en vuelo antes de refetch
	queryClient.cancelQueries({ queryKey: ["adminUrls"] });
	adminQuery.refetch().then(async () => {
		const urls = adminStore.urls?.data ?? [];
		const ids = Array.from(
			new Set(urls.map((u) => u.userId).filter(Boolean) as string[]),
		);
		const idsToFetch = ids.filter((id) => id && !ownerNames.value[id]);
		if (idsToFetch.length === 0) return;
		try {
			const users = await getUsersByIds(idsToFetch);
			users.forEach((u: AdminUser) => {
				ownerNames.value[u.id] = u.name;
			});
		} catch (err) {
			idsToFetch.forEach((id) => (ownerNames.value[id] = "Unknown"));
			console.error("[AdminUrls] loadOwners error", err);
		}
	});
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
		await deleteAdminUrlMutation.mutateAsync(selectedUrl.value.shortCode);
		toast.success("URL eliminada");
		deleteOpen.value = false;
		// refresh owners (batch)
		const urls = adminStore.urls?.data ?? [];
		const ids = Array.from(
			new Set(urls.map((u) => u.userId).filter(Boolean) as string[]),
		);
		const idsToFetch = ids.filter((id) => id && !ownerNames.value[id]);
		if (idsToFetch.length > 0) {
			try {
				const users = await getUsersByIds(idsToFetch);
				users.forEach((u: AdminUser) => {
					ownerNames.value[u.id] = u.name;
				});
			} catch (err) {
				idsToFetch.forEach((id) => (ownerNames.value[id] = "Unknown"));
				console.error("[AdminUrls] loadOwners error", err);
			}
		}
	} catch {
		toast.error("Error al eliminar la URL");
	}
}

// Admin query params (reactive)
const adminParams = ref({
	page: 1,
	pageSize: 20,
	search: undefined as string | undefined,
});

const queryClient = useQueryClient();

const adminQuery = useQuery({
	queryKey: computed(() => [
		"adminUrls",
		adminParams.value.page,
		adminParams.value.pageSize,
		adminParams.value.search,
	]),
	queryFn: async ({ signal }: any) => {
		const { page, pageSize, search } = adminParams.value;
		const res = await getAdminUrls(page, pageSize, search, signal);
		return res;
	},
	placeholderData: keepPreviousData,
	refetchOnWindowFocus: false,
});

watch(adminQuery.data, (data: any) => {
	if (data) {
		adminStore.urls = data;
	}
});

watch(adminQuery.error, (err: any) => {
	if (err) console.error("Error fetching admin urls:", err);
});

watch(adminQuery.isFetching, (v) => {
	adminStore.isLoadingUrls = v;
});

// Mutation for deleting admin URL (optimistic)
const deleteAdminUrlMutation = useMutation<
	void,
	unknown,
	string,
	{ previous: any }
>({
	mutationFn: async (shortCode: string) => {
		return await deleteAdminUrl(shortCode);
	},
	onMutate: async (shortCode: string) => {
		await queryClient.cancelQueries({ queryKey: ["adminUrls"] });
		const previous = adminStore.urls
			? JSON.parse(JSON.stringify(adminStore.urls))
			: null;
		if (adminStore.urls?.data) {
			adminStore.urls.data = adminStore.urls.data.filter(
				(u: any) => u.shortCode !== shortCode,
			);
		}
		return { previous };
	},
	onError: (err: unknown, _shortCode: string, context: any) => {
		if (context?.previous) adminStore.urls = context.previous;
		console.error("deleteAdminUrlMutation error:", err);
	},
	onSettled: () => queryClient.invalidateQueries({ queryKey: ["adminUrls"] }),
});

onMounted(async () => {
	// la query adminQuery se ejecuta automáticamente al montar
	const urls = adminStore.urls?.data ?? [];
	const ids = Array.from(
		new Set(urls.map((u) => u.userId).filter(Boolean) as string[]),
	);
	const idsToFetch = ids.filter((id) => id);
	if (idsToFetch.length > 0) {
		try {
			const users = await getUsersByIds(idsToFetch);
			users.forEach((u: AdminUser) => {
				ownerNames.value[u.id] = u.name;
			});
		} catch (err) {
			idsToFetch.forEach((id) => (ownerNames.value[id] = "Unknown"));
			console.error("[AdminUrls] loadOwners error", err);
		}
	}
});
</script>
