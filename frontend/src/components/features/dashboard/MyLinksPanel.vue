<template>
  <div>
    <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
      <h2 class="font-display text-lg font-800 tracking-tight">Mis Enlaces Cortos</h2>
      <Button size="sm" class="bg-primary text-primary-foreground font-display font-700" @click="$emit('navigate', 'create')">
        <Plus class="w-3 h-3 mr-1" />
        Nuevo Enlace
      </Button>
    </div>

    <div class="flex items-center gap-2 mb-4">
      <div class="relative flex-1 max-w-[280px]">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Buscar tus enlaces..."
          class="pl-9 h-9"
        />
      </div>
    </div>

    <div v-if="isLoading" class="space-y-3">
      <Skeleton v-for="i in 4" :key="i" class="h-12 w-full rounded-lg" />
    </div>

    <div v-else-if="urls.length === 0" class="text-center py-12">
      <Link class="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p class="text-sm text-muted-foreground">No tienes enlaces creados</p>
      <Button size="sm" variant="outline" class="mt-3" @click="$emit('navigate', 'create')">
        <Plus class="w-3 h-3 mr-1" />
        Crear tu primer enlace
      </Button>
    </div>

    <div v-else>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Enlace corto</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead class="text-center">Clics</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead class="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="url in filteredUrls" :key="url.shortCode">
            <TableCell class="font-mono text-primary font-medium">
              roly.top/{{ url.shortCode }}
            </TableCell>
            <TableCell class="max-w-[200px] truncate text-muted-foreground font-mono text-xs">
              {{ url.originalUrl }}
            </TableCell>
            <TableCell class="text-center">
              <Badge variant="secondary" class="font-mono">
                {{ url.visits }}
              </Badge>
            </TableCell>
            <TableCell class="text-muted-foreground text-xs">
              {{ formatDate(url.createdAt) }}
            </TableCell>
            <TableCell class="text-right">
              <div class="flex gap-1 justify-end">
                <Button variant="ghost" size="sm" class="h-7 px-2 text-xs" @click="copyUrl(url.shortCode)">
                  Copiar
                </Button>
                <Button variant="ghost" size="sm" class="h-7 px-2 text-xs text-destructive hover:text-destructive" @click="confirmDelete(url.shortCode)">
                  Eliminar
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <p v-if="filteredUrls.length === 0 && searchQuery" class="text-center py-8 text-muted-foreground text-sm">
        No se encontraron enlaces para "{{ searchQuery }}"
      </p>
    </div>

    <Dialog v-model:open="deleteDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar enlace</DialogTitle>
          <DialogDescription>
            Se eliminará permanentemente el enlace <span class="font-mono text-foreground">/{{ deleteTarget }}</span>. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="deleteDialogOpen = false">Cancelar</Button>
          <Button variant="destructive" :disabled="isDeleting" @click="executeDelete">
            {{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { Link, Plus, Search } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import { deleteUrlRequest, getUrlsRequest } from "@/api/http";
import type { UrlInfoResponse } from "@/api/types";
import { Badge } from "@/components/ui/badge";
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
import { useCopyToClipboard } from "@/composables/useCopyToClipboard";

defineEmits<{
	navigate: [panel: string];
}>();

const { copyToClipboard } = useCopyToClipboard();
const queryClient = useQueryClient();
const searchQuery = ref("");
const deleteDialogOpen = ref(false);
const deleteTarget = ref("");
const isDeleting = ref(false);

const urlsQuery = useQuery({
	queryKey: ["userUrls"],
	queryFn: async ({ signal }) => {
		const res = await getUrlsRequest(signal);
		return res as { urls: UrlInfoResponse[]; urlLimit: number };
	},
	staleTime: 5 * 60 * 1000,
	refetchOnWindowFocus: false,
});

const isLoading = computed(() => urlsQuery.isLoading.value);

const urls = ref<UrlInfoResponse[]>([]);

watch(
	urlsQuery.data,
	(data) => {
		if (data?.urls && Array.isArray(data.urls)) {
			urls.value = [...data.urls].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
		} else {
			urls.value = [];
		}
	},
	{ immediate: true },
);

const filteredUrls = computed(() => {
	if (!searchQuery.value) return urls.value;
	const q = searchQuery.value.toLowerCase();
	return urls.value.filter(
		(u) =>
			u.shortCode.toLowerCase().includes(q) ||
			u.originalUrl.toLowerCase().includes(q),
	);
});

const deleteMutation = useMutation({
	mutationFn: async (shortCode: string) => {
		await deleteUrlRequest(shortCode);
	},
	onMutate: async (shortCode) => {
		await queryClient.cancelQueries({ queryKey: ["userUrls"] });
		const previous = urls.value;
		urls.value = urls.value.filter((u) => u.shortCode !== shortCode);
		return { previous };
	},
	onError: (_err, _shortCode, context) => {
		if (context?.previous) urls.value = context.previous;
		toast.error("Error al eliminar", {
			description: "No se pudo eliminar el enlace.",
		});
	},
	onSettled: () => {
		queryClient.invalidateQueries({ queryKey: ["userUrls"] });
	},
});

function formatDate(dateStr: string) {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function copyUrl(shortCode: string) {
	copyToClipboard(`roly.top/${shortCode}`, "¡Copiado!");
}

function confirmDelete(shortCode: string) {
	deleteTarget.value = shortCode;
	deleteDialogOpen.value = true;
}

async function executeDelete() {
	isDeleting.value = true;
	try {
		await deleteMutation.mutateAsync(deleteTarget.value);
		toast.success("Enlace eliminado", {
			description: `/${deleteTarget.value} fue eliminado.`,
		});
		deleteDialogOpen.value = false;
	} catch {
		// error handled in onError
	} finally {
		isDeleting.value = false;
	}
}
</script>
