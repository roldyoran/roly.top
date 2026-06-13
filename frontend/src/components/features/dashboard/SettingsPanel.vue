<template>
  <div class="w-full">
    <div>
      <h2 class="font-display text-2xl font-800 tracking-tight">Configuración</h2>
      <p class="text-base font-mono text-muted-foreground mt-0.5">Administra tu cuenta y preferencias</p>
    </div>

    <div class="flex flex-col gap-5">
      <Card class="w-full border-border/60">
        <CardContent class="p-3">
          <div class="flex items-center gap-2 mb-2">
            <div class="flex size-6 items-center justify-center rounded-md bg-primary/10">
              <User class="size-3.5 text-primary" />
            </div>
            <span class="text-base font-mono font-700 tracking-wider uppercase text-muted-foreground">Cuenta</span>
          </div>
          <div class="flex flex-col gap-0">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-base font-medium">Nombre para mostrar</div>
                <div class="text-base text-muted-foreground">{{ userName || 'Usuario' }}</div>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-base font-medium">Correo electrónico</div>
                <div class="text-base text-muted-foreground font-mono">{{ userEmail || 'N/D' }}</div>
              </div>
              <Badge variant="secondary" class="gap-1"><span class="size-1.5 rounded-full bg-[var(--success)]" />Verificado</Badge>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-base font-medium">Plan de cuenta</div>
                <div class="text-base text-muted-foreground">{{ isAdmin ? 'Admin' : 'Gratis' }} · {{ totalLinks }}/{{ urlLimit }} enlaces usados</div>
              </div>
              <Button size="sm" class="bg-primary text-primary-foreground font-mono font-700">Mejorar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card v-if="isAdmin" class="w-full border-border/60">
        <CardContent class="p-3">
          <div class="flex items-center gap-2 mb-2">
            <div class="flex size-6 items-center justify-center rounded-md bg-primary/10">
              <Shield class="size-3.5 text-primary" />
            </div>
            <span class="text-base font-mono font-700 tracking-wider uppercase text-muted-foreground">Administración</span>
          </div>
          <div class="flex flex-col gap-0">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-base font-medium">Gestionar usuarios</div>
                <div class="text-base text-muted-foreground">Banear, desbanear y editar límites de usuarios</div>
              </div>
              <Button variant="outline" size="sm" class="font-mono font-600 text-xs border-border/60" @click="$emit('navigate', 'admin-users')">Abrir</Button>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-base font-medium">Gestionar URLs</div>
                <div class="text-base text-muted-foreground">Administrar todas las URLs acortadas del sistema</div>
              </div>
              <Button variant="outline" size="sm" class="font-mono font-600 text-xs border-border/60" @click="$emit('navigate', 'admin-urls')">Abrir</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="w-full border-border/60">
        <CardContent class="p-3">
          <div class="flex items-center gap-2 mb-2">
            <div class="flex size-6 items-center justify-center rounded-md bg-primary/10">
              <Settings class="size-3.5 text-primary" />
            </div>
            <span class="text-base font-mono font-700 tracking-wider uppercase text-muted-foreground">Preferencias</span>
          </div>
          <div class="flex flex-col gap-0">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-base font-medium">Tema</div>
                <div class="text-base text-muted-foreground">Actualmente: {{ colorMode === 'dark' ? 'Modo oscuro' : 'Modo claro' }}</div>
              </div>
              <Button variant="outline" size="sm" class="font-mono font-600 text-xs border-border/60" @click="toggleTheme">Cambiar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="w-full border-destructive/20">
        <CardContent class="p-3">
          <div class="flex items-center gap-2 mb-2">
            <div class="flex size-6 items-center justify-center rounded-md bg-destructive/10">
              <AlertTriangle class="size-3.5 text-destructive" />
            </div>
            <span class="text-base font-mono font-700 tracking-wider uppercase text-destructive">Zona de peligro</span>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-base font-medium text-destructive">Eliminar todos mis enlaces</div>
              <div class="text-base text-muted-foreground">No se puede deshacer. Los {{ totalLinks }} enlaces serán eliminados permanentemente.</div>
            </div>
            <Button variant="destructive" size="sm" class="font-mono font-600 text-xs" :disabled="totalLinks === 0 || isDeletingAll" @click="confirmDeleteAll">
              {{ isDeletingAll ? 'Eliminando...' : 'Eliminar todo' }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog v-model:open="deleteAllDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar todos tus enlaces?</DialogTitle>
          <DialogDescription>
            Se eliminarán permanentemente <span class="font-bold text-foreground">{{ totalLinks }} enlaces</span>. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="deleteAllDialogOpen = false">Cancelar</Button>
          <Button variant="destructive" :disabled="isDeletingAll" @click="executeDeleteAll">
            {{ isDeletingAll ? 'Eliminando...' : 'Eliminar todo' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { useColorMode } from "@vueuse/core";
import { AlertTriangle, Settings, Shield, User } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import { deleteUrlRequest, getUrlsRequest } from "@/api/http";
import type { UrlInfoResponse } from "@/api/types";
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
import { useAuthStore } from "@/stores/authStore";

defineEmits<{
	navigate: [panel: string];
}>();

const authStore = useAuthStore();
const queryClient = useQueryClient();
const colorMode = useColorMode();
const deleteAllDialogOpen = ref(false);
const isDeletingAll = ref(false);

const isAdmin = computed(() => authStore.isAdmin);
const userName = computed(() => authStore.userName);
const userEmail = computed(() => authStore.userEmail);

const urlsQuery = useQuery({
	queryKey: ["userUrls"],
	queryFn: async ({ signal }) => {
		const res = await getUrlsRequest(signal);
		return res as { urls: UrlInfoResponse[]; urlLimit: number };
	},
	staleTime: 5 * 60 * 1000,
	refetchOnWindowFocus: false,
});

const urls = ref<UrlInfoResponse[]>([]);
const urlLimit = ref(2);

watch(
	urlsQuery.data,
	(data) => {
		if (data?.urls && Array.isArray(data.urls)) {
			urls.value = data.urls;
			if (data.urlLimit) urlLimit.value = data.urlLimit;
		}
	},
	{ immediate: true },
);

const totalLinks = computed(() => urls.value.length);

function toggleTheme() {
	colorMode.value = colorMode.value === "dark" ? "light" : "dark";
}

function confirmDeleteAll() {
	deleteAllDialogOpen.value = true;
}

async function executeDeleteAll() {
	isDeletingAll.value = true;
	try {
		const deletePromises = urls.value.map((u) => deleteUrlRequest(u.shortCode));
		await Promise.all(deletePromises);
		toast.success("Enlaces eliminados", {
			description: `Se eliminaron ${totalLinks.value} enlaces.`,
		});
		await queryClient.invalidateQueries({ queryKey: ["userUrls"] });
		deleteAllDialogOpen.value = false;
	} catch {
		toast.error("Error", {
			description: "No se pudieron eliminar todos los enlaces.",
		});
	} finally {
		isDeletingAll.value = false;
	}
}
</script>
