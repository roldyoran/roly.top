<template>
  <div>
    <h2 class="font-display text-lg font-800 tracking-tight mb-5">Enlaces Cortos Públicos</h2>

    <div class="mb-4">
      <div class="relative max-w-[320px]">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Buscar URLs públicas..."
          class="pl-9 h-9"
        />
      </div>
    </div>

    <div v-if="isLoading" class="space-y-3">
      <Skeleton v-for="i in 5" :key="i" class="h-12 w-full rounded-lg" />
    </div>

    <div v-else-if="filteredUrls.length === 0" class="text-center py-12">
      <Globe class="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p class="text-sm text-muted-foreground">No se encontraron enlaces públicos</p>
    </div>

    <div v-else>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Enlace corto</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead class="text-center">Clics</TableHead>
            <TableHead class="text-right">Acción</TableHead>
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
              <Badge variant="secondary" class="font-mono">{{ url.visits }}</Badge>
            </TableCell>
            <TableCell class="text-right">
              <Button variant="ghost" size="sm" class="h-7 px-2 text-xs" @click="copyUrl(url.shortCode)">
                Copiar
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { Globe, Search } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { getPublicUrlsRequest } from "@/api/http";
import type { UrlInfoResponse } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
const searchQuery = ref("");
const shortUrls = ref<UrlInfoResponse[]>([]);

const publicQuery = useQuery({
	queryKey: ["publicUrls"],
	queryFn: async ({ signal }) => {
		const res = await getPublicUrlsRequest(signal);
		return res;
	},
	staleTime: 5 * 60 * 1000,
	gcTime: 10 * 60 * 1000,
	refetchOnWindowFocus: false,
});

const isLoading = computed(
	() => publicQuery.isLoading.value || publicQuery.isFetching.value,
);

watch(
	publicQuery.data,
	(data) => {
		if (data && Array.isArray(data)) {
			shortUrls.value = [...data].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
		} else {
			shortUrls.value = [];
		}
	},
	{ immediate: true },
);

const filteredUrls = computed(() => {
	if (!searchQuery.value) return shortUrls.value;
	const q = searchQuery.value.toLowerCase();
	return shortUrls.value.filter(
		(u) =>
			u.shortCode.toLowerCase().includes(q) ||
			u.originalUrl.toLowerCase().includes(q),
	);
});

function copyUrl(shortCode: string) {
	copyToClipboard(`roly.top/${shortCode}`, "¡Copiado!");
}
</script>
