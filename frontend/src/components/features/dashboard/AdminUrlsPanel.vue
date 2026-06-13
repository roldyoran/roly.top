<template>
  <div>
    <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
      <div>
        <h2 class="font-display text-lg font-800 tracking-tight">Gestión de URLs</h2>
        <p class="text-xs text-muted-foreground mt-0.5">Administra todas las URLs acortadas del sistema</p>
      </div>
      <Badge variant="secondary" class="font-mono">{{ totalUrls }} URLs</Badge>
    </div>

    <div class="mb-4">
      <div class="relative w-full max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Buscar por shortcode o URL..." class="pl-9 h-9 text-xs font-mono" />
      </div>
    </div>

    <div v-if="isLoading" class="flex flex-col gap-3">
      <Skeleton v-for="i in 5" :key="i" class="h-12 w-full rounded-lg" />
    </div>

    <div v-else-if="urls.length === 0" class="text-center py-12">
      <Link class="size-10 text-muted-foreground/30 mx-auto mb-3" />
      <p class="text-sm text-muted-foreground">No se encontraron URLs</p>
    </div>

    <template v-else>
      <!-- Desktop table -->
      <div class="hidden md:block">
        <div class="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-12">#</TableHead>
              <TableHead>Shortcode</TableHead>
              <TableHead>Propietario</TableHead>
              <TableHead>URL Original</TableHead>
              <TableHead class="text-center">Visitas</TableHead>
              <TableHead>Creada</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(url, index) in urls" :key="url.id">
              <TableCell class="text-[10px] text-muted-foreground font-mono">
                {{ (currentPage - 1) * pageSize + index + 1 }}
              </TableCell>
              <TableCell class="font-mono text-primary text-xs font-medium">
                /{{ url.shortCode }}
              </TableCell>
              <TableCell>
                <span class="text-xs text-muted-foreground">{{ getOwnerName(url.userId) }}</span>
              </TableCell>
              <TableCell class="max-w-xs">
                <span class="text-xs text-muted-foreground font-mono truncate block">{{ url.originalUrl }}</span>
              </TableCell>
              <TableCell class="text-center">
                <Badge variant="outline" class="font-mono text-xs">{{ url.visits }}</Badge>
              </TableCell>
              <TableCell class="text-xs text-muted-foreground">
                {{ formatDate(url.createdAt) }}
              </TableCell>
              <TableCell class="text-right">
                <div class="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" class="h-7 px-2 text-xs" @click="copyUrl(url.shortCode)">
                    Copiar
                  </Button>
                  <Button variant="ghost" size="sm" class="h-7 px-2 text-xs text-destructive hover:text-destructive" @click="openDelete(url)">
                    Eliminar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        </div>
      </div>

      <!-- Mobile cards -->
      <div class="md:hidden flex flex-col gap-2">
        <Card v-for="url in urls" :key="url.id">
          <CardContent class="p-3.5">
            <div class="flex items-start justify-between">
              <div class="min-w-0 flex-1">
                <div class="font-mono text-xs text-primary font-medium">/{{ url.shortCode }}</div>
                <div class="text-[10px] text-muted-foreground font-mono truncate mt-0.5">{{ url.originalUrl }}</div>
                <div class="text-[10px] text-muted-foreground mt-1">
                  {{ getOwnerName(url.userId) }} · {{ formatDate(url.createdAt) }}
                </div>
              </div>
              <div class="flex items-center gap-1.5 flex-shrink-0 ml-2">
                <Badge variant="outline" class="font-mono text-[10px]">{{ url.visits }} visitas</Badge>
                <Button variant="ghost" size="sm" class="size-7 p-0 text-destructive hover:text-destructive" @click="openDelete(url)">
                  <Trash2 class="size-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between mt-4">
        <p class="text-xs text-muted-foreground">
          Página {{ currentPage }} de {{ totalPages }}
        </p>
        <div class="flex gap-1.5">
          <Button variant="outline" size="sm" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">
            Anterior
          </Button>
          <Button variant="outline" size="sm" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">
            Siguiente
          </Button>
        </div>
      </div>
    </template>

    <!-- Delete Dialog -->
    <Dialog v-model:open="deleteOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar URL</DialogTitle>
          <DialogDescription>
            Se eliminará permanentemente el enlace <span class="font-mono text-foreground">/{{ selectedUrl?.shortCode }}</span>. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="deleteOpen = false">Cancelar</Button>
          <Button variant="destructive" :disabled="isDeleting" @click="handleDelete">
            {{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { Link, Search, Trash2 } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import type { AdminUrl } from "@/api/admin";
import { deleteAdminUrl, getAdminUrls, getUsersByIds } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
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
import { useCopyToClipboard } from "@/composables/useCopyToClipboard";

const { copyToClipboard } = useCopyToClipboard();
const queryClient = useQueryClient();

const searchQuery = ref("");
const currentPage = ref(1);
const pageSize = 20;
const ownerNames = ref<Record<string, string>>({});

// Delete dialog
const deleteOpen = ref(false);
const selectedUrl = ref<AdminUrl | null>(null);
const isDeleting = ref(false);

const urlsQuery = useQuery({
	queryKey: computed(() => [
		"adminUrls",
		currentPage.value,
		pageSize,
		searchQuery.value,
	]),
	queryFn: async ({ signal }) => {
		return await getAdminUrls(
			currentPage.value,
			pageSize,
			searchQuery.value || undefined,
			signal,
		);
	},
	staleTime: 30 * 1000,
	refetchOnWindowFocus: false,
});

const isLoading = computed(() => urlsQuery.isLoading.value);
const urls = computed(() => urlsQuery.data.value?.data || []);
const totalUrls = computed(() => urlsQuery.data.value?.total || 0);
const totalPages = computed(() => urlsQuery.data.value?.totalPages || 0);

async function resolveOwnerNames(userIds: string[]) {
	const unknownIds = userIds.filter((id) => id && !ownerNames.value[id]);
	if (unknownIds.length === 0) return;
	try {
		const users = await getUsersByIds(unknownIds);
		if (Array.isArray(users)) {
			for (const u of users) {
				if (u.id) ownerNames.value[u.id] = u.name || u.email || "Desconocido";
			}
		}
	} catch {
		for (const id of unknownIds) {
			ownerNames.value[id] = "Desconocido";
		}
	}
}

watch(
	urls,
	(data) => {
		if (data.length > 0) {
			const ids = data.map((u) => u.userId).filter(Boolean) as string[];
			resolveOwnerNames(ids);
		}
	},
	{ immediate: true },
);

function getOwnerName(userId: string | null): string {
	if (!userId) return "Anónimo";
	return ownerNames.value[userId] || "Cargando...";
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
	if (searchTimeout) clearTimeout(searchTimeout);
	searchTimeout = setTimeout(() => {
		currentPage.value = 1;
	}, 300);
});

function goToPage(page: number) {
	currentPage.value = page;
}

function formatDate(dateStr: string) {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function copyUrl(shortCode: string) {
	copyToClipboard(`roly.top/${shortCode}`, "¡Copiado!");
}

function openDelete(url: AdminUrl) {
	selectedUrl.value = url;
	deleteOpen.value = true;
}

async function handleDelete() {
	if (!selectedUrl.value) return;
	isDeleting.value = true;
	try {
		await deleteAdminUrl(selectedUrl.value.shortCode);
		toast.success("URL eliminada", {
			description: `/${selectedUrl.value.shortCode} fue eliminada permanentemente.`,
		});
		deleteOpen.value = false;
		await queryClient.invalidateQueries({ queryKey: ["adminUrls"] });
	} catch {
		toast.error("Error", { description: "No se pudo eliminar la URL." });
	} finally {
		isDeleting.value = false;
	}
}
</script>
