<template>
  <div>
    <div>
      <h2 class="font-display text-lg font-800 tracking-tight">Enlaces Públicos</h2>
      <p class="text-xs font-mono text-muted-foreground mt-0.5">Explora los enlaces acortados públicos</p>
    </div>

    <div class="mb-4">
      <div class="relative max-w-[320px]">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Buscar URLs públicas..."
          class="pl-9 h-9 text-xs font-mono"
        />
      </div>
    </div>

    <div v-if="isLoading" class="flex flex-col gap-3">
      <Skeleton v-for="i in 5" :key="i" class="h-12 w-full rounded-lg" />
    </div>

    <Empty v-else-if="filteredUrls.length === 0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Globe />
        </EmptyMedia>
        <EmptyTitle class="font-display">Sin enlaces públicos</EmptyTitle>
        <EmptyDescription class="font-mono">
          No se encontraron enlaces públicos
        </EmptyDescription>
      </EmptyHeader>
    </Empty>

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
              <Button variant="ghost" size="sm" class="size-7 p-0 text-muted-foreground hover:text-foreground" @click="copyUrl(url.shortCode)"><Copy class="size-3" /></Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { Copy, Globe, Search } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { getPublicUrlsRequest } from "@/api/http";
import type { UrlInfoResponse } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
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
