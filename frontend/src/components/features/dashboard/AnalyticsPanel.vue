<template>
  <div>
    <h3 class="font-display text-lg font-800 tracking-tight mb-5">Analíticas</h3>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      <Card v-if="isLoading">
        <CardContent class="p-4">
          <Skeleton class="h-4 w-20 mb-2" />
          <Skeleton class="h-8 w-16" />
        </CardContent>
      </Card>
      <template v-else>
        <Card class="relative overflow-hidden border-border/60">
          <CardContent class="p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground">Enlaces Totales</span>
              <div class="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                <Link class="size-3.5 text-primary" />
              </div>
            </div>
            <p class="text-3xl font-display font-800 tracking-tight leading-none">{{ totalLinks }}</p>
          </CardContent>
          <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </Card>
        <Card class="relative overflow-hidden border-border/60">
          <CardContent class="p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground">Total de Clics</span>
              <div class="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                <MousePointerClick class="size-3.5 text-primary" />
              </div>
            </div>
            <p class="text-3xl font-display font-800 tracking-tight leading-none">{{ totalClicks }}</p>
          </CardContent>
          <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </Card>
        <Card class="relative overflow-hidden border-border/60">
          <CardContent class="p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground">Clics Promedio</span>
              <div class="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp class="size-3.5 text-primary" />
              </div>
            </div>
            <p class="text-3xl font-display font-800 tracking-tight leading-none">{{ avgClicks }}</p>
          </CardContent>
          <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </Card>
        <Card class="relative overflow-hidden border-border/60">
          <CardContent class="p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground">Espacios Disponibles</span>
              <div class="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                <Gauge class="size-3.5 text-primary" />
              </div>
            </div>
            <p class="text-3xl font-display font-800 tracking-tight leading-none">{{ urlLimit - totalLinks }}</p>
          </CardContent>
          <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </Card>
      </template>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <Card class="border-border/60">
        <CardContent class="p-5">
          <div class="flex items-center gap-2 mb-3">
            <div class="flex size-6 items-center justify-center rounded-md bg-primary/10">
              <BarChart3 class="size-3.5 text-primary" />
            </div>
            <span class="text-xs font-mono font-700 tracking-wider uppercase text-muted-foreground">Uso de la Cuenta</span>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>{{ totalLinks }} enlaces creados</span>
              <span>{{ urlLimit - totalLinks }} espacios disponibles</span>
            </div>
            <Progress :model-value="usagePercent" class="h-2" />
            <p class="text-xs text-muted-foreground">{{ usagePercent }}% utilizado</p>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border/60">
        <CardContent class="p-5">
          <div class="flex items-center gap-2 mb-3">
            <div class="flex size-6 items-center justify-center rounded-md bg-primary/10">
              <TrendingUp class="size-3.5 text-primary" />
            </div>
            <span class="text-xs font-mono font-700 tracking-wider uppercase text-muted-foreground">Enlaces Más Visitados</span>
          </div>
          <div v-if="topUrls.length === 0" class="text-center py-6 text-xs text-muted-foreground">
            Sin datos de visitas aún
          </div>
          <div v-else class="space-y-2">
            <div v-for="(url, i) in topUrls" :key="url.shortCode" class="flex items-center justify-between">
              <div class="flex items-center gap-2 min-w-0">
                <Badge variant="outline" class="size-5 p-0 flex items-center justify-center text-[0.625rem]">{{ i + 1 }}</Badge>
                <span class="font-mono text-xs text-primary truncate">/{{ url.shortCode }}</span>
              </div>
              <Badge variant="secondary" class="font-mono text-xs">{{ url.visits }} clics</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import {
	BarChart3,
	Gauge,
	Link,
	MousePointerClick,
	TrendingUp,
} from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { getUrlsRequest } from "@/api/http";
import type { UrlInfoResponse } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

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
const urlLimit = ref(2);

watch(
	urlsQuery.data,
	(data) => {
		if (data?.urls && Array.isArray(data.urls)) {
			urls.value = data.urls;
			if (data.urlLimit) urlLimit.value = data.urlLimit;
		} else {
			urls.value = [];
		}
	},
	{ immediate: true },
);

const totalLinks = computed(() => urls.value.length);
const totalClicks = computed(() =>
	urls.value.reduce((sum, u) => sum + (u.visits || 0), 0),
);
const avgClicks = computed(() => {
	if (totalLinks.value === 0) return 0;
	return Math.round(totalClicks.value / totalLinks.value);
});
const usagePercent = computed(() => {
	if (urlLimit.value === 0) return 0;
	return Math.min(100, Math.round((totalLinks.value / urlLimit.value) * 100));
});
const topUrls = computed(() =>
	[...urls.value].sort((a, b) => (b.visits || 0) - (a.visits || 0)).slice(0, 5),
);
</script>
