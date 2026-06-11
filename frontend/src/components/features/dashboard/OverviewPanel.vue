<template>
  <div>
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
            <p class="text-xs text-primary flex items-center gap-1 mt-1">
              <Activity class="w-3 h-3" />
              Activo
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <p class="text-xs text-muted-foreground mb-1">Total de Clics</p>
            <p class="text-2xl font-bold font-display">{{ totalClicks }}</p>
            <p class="text-xs text-muted-foreground mt-1">en todos tus enlaces</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <p class="text-xs text-muted-foreground mb-1">Límite</p>
            <p class="text-2xl font-bold font-display">
              {{ totalLinks }}<span class="text-base text-muted-foreground font-600">/{{ urlLimit }}</span>
            </p>
            <p class="text-xs text-muted-foreground mt-1">{{ urlLimit - totalLinks }} espacios restantes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <p class="text-xs text-muted-foreground mb-1">Cuenta</p>
            <p class="text-2xl font-bold font-display">{{ isAdmin ? 'Admin' : 'Gratis' }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ userName || 'Usuario' }}</p>
          </CardContent>
        </Card>
      </template>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <Card>
        <CardContent class="p-5">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap class="w-4 h-4 text-primary" />
            Acciones Rápidas
          </h3>
          <div class="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" @click="$emit('navigate', 'create')">
              <Plus class="w-3 h-3 mr-1" />
              Nuevo Enlace
            </Button>
            <Button variant="outline" size="sm" @click="$emit('navigate', 'myurls')">
              <Link class="w-3 h-3 mr-1" />
              Mis Enlaces
            </Button>
            <Button variant="outline" size="sm" @click="$emit('navigate', 'qrdash')">
              <QrCode class="w-3 h-3 mr-1" />
              Generar QR
            </Button>
            <Button variant="outline" size="sm" @click="$emit('navigate', 'analytics')">
              <BarChart3 class="w-3 h-3 mr-1" />
              Analíticas
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-5">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
            <User class="w-4 h-4 text-primary" />
            Información de Cuenta
          </h3>
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">Nombre</span>
              <span class="text-xs font-medium">{{ userName || 'Invitado' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">Correo</span>
              <span class="text-xs font-mono text-muted-foreground">{{ userEmail || 'N/D' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">Rol</span>
              <Badge :variant="isAdmin ? 'default' : 'secondary'" class="text-xs">
                {{ isAdmin ? 'Admin' : 'Usuario' }}
              </Badge>
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
	Activity,
	BarChart3,
	Link,
	Plus,
	QrCode,
	User,
	Zap,
} from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { getUrlsRequest } from "@/api/http";
import type { UrlInfoResponse } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/authStore";

defineEmits<{
	navigate: [panel: string];
}>();

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.isAdmin);
const userName = computed(() => authStore.userName);
const userEmail = computed(() => authStore.userEmail);
const urlLimit = ref(2);

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
</script>
