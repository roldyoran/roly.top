<template>
  <div>
    <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
      <div>
        <h2 class="font-display text-lg font-800 tracking-tight">Gestión de Usuarios</h2>
        <p class="text-xs font-mono text-muted-foreground mt-0.5">Administra los usuarios del sistema</p>
      </div>
      <Badge variant="secondary" class="font-mono">{{ totalUsers }} usuarios</Badge>
    </div>

    <div class="mb-4">
      <div class="relative w-full max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Buscar por nombre o correo..." class="pl-9 h-9 text-xs font-mono" />
      </div>
    </div>

    <div v-if="isLoading" class="flex flex-col gap-3">
      <Skeleton v-for="i in 5" :key="i" class="h-14 w-full rounded-lg" />
    </div>

    <div v-else-if="users.length === 0" class="text-center py-12">
      <Users class="size-10 text-muted-foreground/30 mx-auto mb-3" />
      <p class="text-sm text-muted-foreground">No se encontraron usuarios</p>
    </div>

    <template v-else>
      <!-- Desktop table -->
      <div class="hidden md:block">
        <div class="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead class="text-center">URLs</TableHead>
              <TableHead class="text-center">Límite</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead class="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="user in users" :key="user.id">
              <TableCell>
                <div class="flex items-center gap-2.5">
                  <div v-if="user.image" class="size-7 rounded-full overflow-hidden flex-shrink-0">
                    <img :src="user.image" :alt="user.name" class="w-full h-full object-cover" />
                  </div>
                  <div v-else class="size-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {{ user.name?.charAt(0)?.toUpperCase() || '?' }}
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs font-medium truncate">{{ user.name || 'Sin nombre' }}</div>
                    <div class="text-[10px] text-muted-foreground font-mono truncate">{{ user.email }}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="user.role === 'admin' ? 'default' : 'secondary'" class="text-[10px]">
                  {{ user.role === 'admin' ? 'Admin' : 'Usuario' }}
                </Badge>
              </TableCell>
              <TableCell class="text-center">
                <Badge variant="outline" class="font-mono text-xs">{{ user.urlCount }}</Badge>
              </TableCell>
              <TableCell class="text-center">
                <span class="font-mono text-xs">{{ user.urlLimit }}</span>
              </TableCell>
              <TableCell>
                <Badge :variant="user.banned ? 'destructive' : 'secondary'" class="text-[10px]">
                  {{ user.banned ? 'Baneado' : 'Activo' }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="sm" class="size-7 p-0">
                    <MoreVertical class="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-44">
                    <DropdownMenuItem @click="openEditLimit(user)">
                        <Settings class="size-3.5 mr-2" />
                      Editar límite
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      v-if="!user.banned"
                      :disabled="user.id === currentUserId || user.role === 'admin'"
                      @click="openBan(user)"
                    >
                        <Ban class="size-3.5 mr-2" />
                      {{ user.id === currentUserId ? 'No puedes banearte' : user.role === 'admin' ? 'No puedes banear admins' : 'Banear' }}
                    </DropdownMenuItem>
                    <DropdownMenuItem v-else @click="handleUnban(user)">
                        <CheckCircle class="size-3.5 mr-2" />
                      Desbanear
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      :disabled="user.id === currentUserId || user.role === 'admin'"
                      class="text-destructive focus:text-destructive"
                      @click="openDelete(user)"
                    >
                        <Trash2 class="size-3.5 mr-2" />
                      {{ user.id === currentUserId ? 'No puedes eliminarte' : user.role === 'admin' ? 'No puedes eliminar admins' : 'Eliminar' }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        </div>
      </div>

      <!-- Mobile cards -->
      <div class="md:hidden flex flex-col gap-2">
        <Card v-for="user in users" :key="user.id">
          <CardContent class="p-3.5">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2.5 min-w-0">
                <div v-if="user.image" class="size-8 rounded-full overflow-hidden flex-shrink-0">
                  <img :src="user.image" :alt="user.name" class="w-full h-full object-cover" />
                </div>
                <div v-else class="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {{ user.name?.charAt(0)?.toUpperCase() || '?' }}
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-medium truncate">{{ user.name || 'Sin nombre' }}</div>
                  <div class="text-[10px] text-muted-foreground font-mono truncate">{{ user.email }}</div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="sm" class="size-7 p-0">
                    <MoreVertical class="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-44">
                  <DropdownMenuItem @click="openEditLimit(user)">
                    <Settings class="size-3.5 mr-2" />
                    Editar límite
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="!user.banned"
                    :disabled="user.id === currentUserId || user.role === 'admin'"
                    @click="openBan(user)"
                  >
                    <Ban class="size-3.5 mr-2" />
                    Banear
                  </DropdownMenuItem>
                  <DropdownMenuItem v-else @click="handleUnban(user)">
                    <CheckCircle class="size-3.5 mr-2" />
                    Desbanear
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    :disabled="user.id === currentUserId || user.role === 'admin'"
                    class="text-destructive focus:text-destructive"
                    @click="openDelete(user)"
                  >
                    <Trash2 class="size-3.5 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div class="flex items-center gap-2 mt-2.5 flex-wrap">
              <Badge :variant="user.role === 'admin' ? 'default' : 'secondary'" class="text-[10px]">
                {{ user.role === 'admin' ? 'Admin' : 'Usuario' }}
              </Badge>
              <Badge :variant="user.banned ? 'destructive' : 'secondary'" class="text-[10px]">
                {{ user.banned ? 'Baneado' : 'Activo' }}
              </Badge>
              <span class="text-[10px] text-muted-foreground font-mono">
                {{ user.urlCount }}/{{ user.urlLimit }} URLs
              </span>
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

    <!-- Edit Limit Dialog -->
    <Dialog v-model:open="editLimitOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar límite de URLs</DialogTitle>
          <DialogDescription>
            Cambia el límite de URLs para <span class="font-medium text-foreground">{{ selectedUser?.name || selectedUser?.email }}</span>.
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-2">
          <Label for="limit-input">Nuevo límite</Label>
          <Input id="limit-input" v-model.number="newLimit" type="number" min="1" max="9999" />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="editLimitOpen = false">Cancelar</Button>
          <Button :disabled="isUpdating || newLimit < 1" @click="handleUpdateLimit">
            {{ isUpdating ? 'Guardando...' : 'Guardar' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Ban Dialog -->
    <Dialog v-model:open="banOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Banear usuario</DialogTitle>
          <DialogDescription>
            Se baneará a <span class="font-medium text-foreground">{{ selectedUser?.name || selectedUser?.email }}</span>. Esta acción puede revertirse después.
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-2">
          <Label for="ban-reason">Razón (opcional)</Label>
          <Input id="ban-reason" v-model="banReason" placeholder="Motivo del baneo..." />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="banOpen = false">Cancelar</Button>
          <Button variant="destructive" :disabled="isBanning" @click="handleBan">
            {{ isBanning ? 'Baneando...' : 'Banear' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Dialog -->
    <Dialog v-model:open="deleteOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar usuario</DialogTitle>
          <DialogDescription>
            Se eliminará permanentemente a <span class="font-medium text-foreground">{{ selectedUser?.name || selectedUser?.email }}</span> y todas sus URLs. Esta acción no se puede deshacer.
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
	Ban,
	CheckCircle,
	MoreVertical,
	Search,
	Settings,
	Trash2,
	Users,
} from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import type { AdminUser } from "@/api/admin";
import {
	banUser,
	deleteUser,
	getAdminUsers,
	unbanUser,
	updateUserUrlLimit,
} from "@/api/admin";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/stores/authStore";

const queryClient = useQueryClient();
const authStore = useAuthStore();
const currentUserId = computed(() => authStore.user?.id as string | undefined);

const searchQuery = ref("");
const currentPage = ref(1);
const pageSize = 15;

// Dialogs
const editLimitOpen = ref(false);
const banOpen = ref(false);
const deleteOpen = ref(false);
const selectedUser = ref<AdminUser | null>(null);
const newLimit = ref(20);
const banReason = ref("");
const isUpdating = ref(false);
const isBanning = ref(false);
const isDeleting = ref(false);

const usersQuery = useQuery({
	queryKey: computed(() => [
		"adminUsers",
		currentPage.value,
		pageSize,
		searchQuery.value,
	]),
	queryFn: async ({ signal }) => {
		return await getAdminUsers(
			currentPage.value,
			pageSize,
			searchQuery.value || undefined,
			signal,
		);
	},
	staleTime: 30 * 1000,
	refetchOnWindowFocus: false,
});

const isLoading = computed(() => usersQuery.isLoading.value);
const users = computed(() => usersQuery.data.value?.data || []);
const totalUsers = computed(() => usersQuery.data.value?.total || 0);
const totalPages = computed(() => usersQuery.data.value?.totalPages || 0);

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

function openEditLimit(user: AdminUser) {
	selectedUser.value = user;
	newLimit.value = user.urlLimit;
	editLimitOpen.value = true;
}

function openBan(user: AdminUser) {
	selectedUser.value = user;
	banReason.value = "";
	banOpen.value = true;
}

function openDelete(user: AdminUser) {
	selectedUser.value = user;
	deleteOpen.value = true;
}

async function handleUpdateLimit() {
	if (!selectedUser.value || newLimit.value < 1) return;
	isUpdating.value = true;
	try {
		await updateUserUrlLimit(selectedUser.value.id, newLimit.value);
		toast.success("Límite actualizado", {
			description: `Nuevo límite: ${newLimit.value} URLs para ${selectedUser.value.name || selectedUser.value.email}`,
		});
		editLimitOpen.value = false;
		await queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
	} catch {
		toast.error("Error", { description: "No se pudo actualizar el límite." });
	} finally {
		isUpdating.value = false;
	}
}

async function handleBan() {
	if (!selectedUser.value) return;
	isBanning.value = true;
	try {
		await banUser(selectedUser.value.id, banReason.value || undefined);
		toast.success("Usuario baneado", {
			description: `${selectedUser.value.name || selectedUser.value.email} fue baneado.`,
		});
		banOpen.value = false;
		await queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
	} catch {
		toast.error("Error", { description: "No se pudo banear al usuario." });
	} finally {
		isBanning.value = false;
	}
}

async function handleUnban(user: AdminUser) {
	try {
		await unbanUser(user.id);
		toast.success("Usuario desbaneado", {
			description: `${user.name || user.email} fue desbaneado.`,
		});
		await queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
	} catch {
		toast.error("Error", { description: "No se pudo desbanear al usuario." });
	}
}

async function handleDelete() {
	if (!selectedUser.value) return;
	isDeleting.value = true;
	try {
		await deleteUser(selectedUser.value.id);
		toast.success("Usuario eliminado", {
			description: `${selectedUser.value.name || selectedUser.value.email} fue eliminado permanentemente.`,
		});
		deleteOpen.value = false;
		await queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
	} catch {
		toast.error("Error", { description: "No se pudo eliminar al usuario." });
	} finally {
		isDeleting.value = false;
	}
}
</script>
