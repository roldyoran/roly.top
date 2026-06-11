<template>
  <div>
    <h2 class="font-display text-lg font-800 tracking-tight mb-5">Analíticas</h2>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      <Card v-if="isLoading">
        <CardContent class="p-4">
          <Skeleton class="h-4 w-20 mb-2" />
          <Skeleton class="h-8 w-16" />
        </CardContent>
      </Card>
      <template v-else>
        <Card>
          <CardContent class="p-4">
            <p class="text-xs text-muted-foreground mb-1">Enlaces Totales</p>
            <p class="text-2xl font-bold font-display">{{ totalLinks }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <p class="text-xs text-muted-foreground mb-1">Total de Clics</p>
            <p class="text-2xl font-bold font-display">{{ totalClicks }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <p class="text-xs text-muted-foreground mb-1">Clics Promedio</p>
            <p class="text-2xl font-bold font-display">{{ avgClicks }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <p class="text-xs text-muted-foreground mb-1">Espacios Disponibles</p>
            <p class="text-2xl font-bold font-display">{{ urlLimit - totalLinks }}</p>
          </CardContent>
        </Card>
      </template>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <Card>
        <CardContent class="p-5">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 class="w-4 h-4 text-primary" />
            Uso de la Cuenta
          </h3>
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

      <Card>
        <CardContent class="p-5">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp class="w-4 h-4 text-primary" />
            Enlaces Más Visitados
          </h3>
          <div v-if="topUrls.length === 0" class="text-center py-6 text-xs text-muted-foreground">
            Sin datos de visitas aún
          </div>
          <div v-else class="space-y-2">
            <div v-for="(url, i) in topUrls" :key="url.shortCode" class="flex items-center justify-between">
              <div class="flex items-center gap-2 min-w-0">
                <Badge variant="outline" class="text-[0.625rem] w-5 h-5 p-0 flex items-center justify-center">{{ i + 1 }}</Badge>
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
import { BarChart3, TrendingUp } from "lucide-vue-next";
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
