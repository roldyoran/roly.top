<template>
  <div>
    <h2 class="font-display text-lg font-800 tracking-tight mb-5">Configuración</h2>

    <div class="space-y-5">
      <Card>
        <CardContent class="p-5">
          <h3 class="text-sm font-semibold mb-3">Cuenta</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-medium">Nombre para mostrar</div>
                <div class="text-xs text-muted-foreground">{{ userName || 'Usuario' }}</div>
              </div>
              <Button variant="secondary" size="sm">Editar</Button>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-medium">Correo electrónico</div>
                <div class="text-xs text-muted-foreground font-mono">{{ userEmail || 'N/D' }}</div>
              </div>
              <Badge variant="secondary">Verificado</Badge>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-medium">Plan de cuenta</div>
                <div class="text-xs text-muted-foreground">{{ isAdmin ? 'Admin' : 'Gratis' }} · {{ totalLinks }}/{{ urlLimit }} enlaces usados</div>
              </div>
              <Button size="sm" class="bg-primary text-primary-foreground font-display font-700">Mejorar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card v-if="isAdmin">
        <CardContent class="p-5">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Shield class="w-3.5 h-3.5 text-primary" />
            Administración
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-medium">Gestionar usuarios</div>
                <div class="text-xs text-muted-foreground">Banear, desbanear y editar límites de usuarios</div>
              </div>
              <Button variant="outline" size="sm" @click="$emit('navigate', 'admin-users')">Abrir</Button>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-medium">Gestionar URLs</div>
                <div class="text-xs text-muted-foreground">Administrar todas las URLs acortadas del sistema</div>
              </div>
              <Button variant="outline" size="sm" @click="$emit('navigate', 'admin-urls')">Abrir</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-5">
          <h3 class="text-sm font-semibold mb-3">Preferencias</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-medium">Tema</div>
                <div class="text-xs text-muted-foreground">Actualmente: {{ colorMode === 'dark' ? 'Modo oscuro' : 'Modo claro' }}</div>
              </div>
              <Button variant="secondary" size="sm" @click="toggleTheme">Cambiar</Button>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-medium">Nuevos enlaces públicos por defecto</div>
                <div class="text-xs text-muted-foreground">Los enlaces creados aparecen en la lista pública</div>
              </div>
              <Switch v-model="publicByDefault" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="border-destructive/20">
        <CardContent class="p-5">
          <h3 class="text-sm font-semibold mb-3 text-destructive">Zona de peligro</h3>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs font-medium text-destructive">Eliminar todos mis enlaces</div>
              <div class="text-xs text-muted-foreground">No se puede deshacer. Los {{ totalLinks }} enlaces serán eliminados permanentemente.</div>
            </div>
            <Button variant="destructive" size="sm" :disabled="totalLinks === 0 || isDeletingAll" @click="confirmDeleteAll">
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useColorMode } from "@vueuse/core";
import { Shield } from "lucide-vue-next";
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
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/stores/authStore";

defineEmits<{
	navigate: [panel: string];
}>();

const authStore = useAuthStore();
const queryClient = useQueryClient();
const colorMode = useColorMode();
const publicByDefault = ref(true);
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
