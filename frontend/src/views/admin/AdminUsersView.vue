<template>
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Usuarios</h1>
				<p class="text-muted-foreground">Gestiona los usuarios del sistema</p>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<div class="relative flex-1 max-w-sm">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input v-model="searchQuery" placeholder="Buscar por nombre o email..." class="pl-9" @input="onSearch" />
			</div>
		</div>

		<Card>
			<CardContent class="p-0">
				<div v-if="adminStore.isLoadingUsers" class="p-6 space-y-2">
					<Skeleton v-for="i in 10" :key="i" class="h-12 w-full" />
				</div>
				<div v-else-if="!adminStore.users?.data.length" class="p-12 text-center">
					<Users class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
					<p class="text-muted-foreground">No se encontraron usuarios</p>
				</div>
				<Table v-else>
					<TableHeader>
						<TableRow>
							<TableHead>Usuario</TableHead>
							<TableHead>Rol</TableHead>
							<TableHead>URLs</TableHead>
							<TableHead>Límite</TableHead>
							<TableHead>Estado</TableHead>
							<TableHead class="text-right">Acciones</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow v-for="user in adminStore.users.data" :key="user.id">
							<TableCell>
								<div class="flex items-center gap-3">
									<img v-if="user.image" :src="user.image" :alt="user.name" class="w-8 h-8 rounded-full" />
									<div v-else class="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
										{{ user.name.charAt(0).toUpperCase() }}
									</div>
									<div>
										<p class="font-medium text-sm">{{ user.name }}</p>
										<p class="text-xs text-muted-foreground">{{ user.email }}</p>
									</div>
								</div>
							</TableCell>
							<TableCell>
								<Badge :variant="user.role === 'admin' ? 'default' : 'secondary'">
									{{ user.role }}
								</Badge>
							</TableCell>
							<TableCell>{{ user.urlCount }}</TableCell>
							<TableCell>{{ user.urlLimit }}</TableCell>
							<TableCell>
								<Badge :variant="user.banned ? 'destructive' : 'outline'">
									{{ user.banned ? 'Baneado' : 'Activo' }}
								</Badge>
							</TableCell>
							<TableCell class="text-right">
								<DropdownMenu>
									<DropdownMenuTrigger as-child>
										<Button variant="ghost" size="sm" class="h-8 w-8 p-0">
											<MoreHorizontal class="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem @click="openEditLimit(user)">
											<Settings class="mr-2 h-4 w-4" />
											Cambiar límite
										</DropdownMenuItem>
										<DropdownMenuItem v-if="!user.banned" @click="handleBan(user)" class="text-destructive">
											<Ban class="mr-2 h-4 w-4" />
											Banear
										</DropdownMenuItem>
										<DropdownMenuItem v-else @click="handleUnban(user)">
											<CheckCircle class="mr-2 h-4 w-4" />
											Desbanear
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem @click="confirmDelete(user)" class="text-destructive">
											<Trash2 class="mr-2 h-4 w-4" />
											Eliminar
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</CardContent>
		</Card>

		<!-- Pagination -->
		<div v-if="adminStore.users && adminStore.users.totalPages > 1" class="flex items-center justify-between">
			<p class="text-sm text-muted-foreground">
				Mostrando {{ (adminStore.users.page - 1) * adminStore.users.pageSize + 1 }}
				- {{ Math.min(adminStore.users.page * adminStore.users.pageSize, adminStore.users.total) }}
				de {{ adminStore.users.total }} usuarios
			</p>
			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm" :disabled="adminStore.users.page <= 1" @click="goToPage(adminStore.users.page - 1)">
					Anterior
				</Button>
				<Button variant="outline" size="sm" :disabled="adminStore.users.page >= adminStore.users.totalPages" @click="goToPage(adminStore.users.page + 1)">
					Siguiente
				</Button>
			</div>
		</div>

		<!-- Edit Limit Dialog -->
		<Dialog v-model:open="editLimitOpen">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Cambiar límite de URLs</DialogTitle>
					<DialogDescription>
						Actualiza el límite de URLs para <strong>{{ selectedUser?.name }}</strong>
					</DialogDescription>
				</DialogHeader>
				<div class="space-y-4 py-4">
					<div class="space-y-2">
						<Label for="limit">Nuevo límite</Label>
						<Input id="limit" v-model.number="newLimit" type="number" min="1" max="1000" />
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" @click="editLimitOpen = false">Cancelar</Button>
					<Button @click="handleUpdateLimit">Guardar</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<!-- Ban Dialog -->
		<Dialog v-model:open="banOpen">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Banear usuario</DialogTitle>
					<DialogDescription>
						Banear a <strong>{{ selectedUser?.name }}</strong>. Opcionalmente ingresa una razón.
					</DialogDescription>
				</DialogHeader>
				<div class="space-y-4 py-4">
					<div class="space-y-2">
						<Label for="banReason">Razón (opcional)</Label>
						<Input id="banReason" v-model="banReason" placeholder="Motivo del baneo..." />
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" @click="banOpen = false">Cancelar</Button>
					<Button variant="destructive" @click="handleBanConfirm">Banear</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<!-- Delete Dialog -->
		<Dialog v-model:open="deleteOpen">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Eliminar usuario</DialogTitle>
					<DialogDescription>
						¿Estás seguro de eliminar a <strong>{{ selectedUser?.name }}</strong>? Esta acción eliminará todas sus URLs y no se puede deshacer.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" @click="deleteOpen = false">Cancelar</Button>
					<Button variant="destructive" @click="handleDeleteConfirm">Eliminar</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import {
	Ban,
	CheckCircle,
	MoreHorizontal,
	Search,
	Settings,
	Trash2,
	Users,
} from "lucide-vue-next";
import { onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import type { AdminUser } from "@/api/admin";
import {
	banUser,
	deleteUser,
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
import { useAdminStore } from "@/stores/adminStore";

const adminStore = useAdminStore();

const searchQuery = ref("");
const editLimitOpen = ref(false);
const banOpen = ref(false);
const deleteOpen = ref(false);
const selectedUser = ref<AdminUser | null>(null);
const newLimit = ref(2);
const banReason = ref("");

let searchTimeout: ReturnType<typeof setTimeout>;

function onSearch() {
	clearTimeout(searchTimeout);
	searchTimeout = setTimeout(() => {
		adminStore.fetchUsers(1, 20, searchQuery.value || undefined);
	}, 300);
}

function goToPage(page: number) {
	adminStore.fetchUsers(page, 20, searchQuery.value || undefined);
}

function openEditLimit(user: AdminUser) {
	selectedUser.value = user;
	newLimit.value = user.urlLimit;
	editLimitOpen.value = true;
}

async function handleUpdateLimit() {
	if (!selectedUser.value) return;
	try {
		await updateUserUrlLimit(selectedUser.value.id, newLimit.value);
		toast.success("Límite actualizado");
		editLimitOpen.value = false;
		adminStore.fetchUsers(
			adminStore.users?.page ?? 1,
			20,
			searchQuery.value || undefined,
		);
	} catch {
		toast.error("Error al actualizar el límite");
	}
}

function handleBan(user: AdminUser) {
	selectedUser.value = user;
	banReason.value = "";
	banOpen.value = true;
}

async function handleBanConfirm() {
	if (!selectedUser.value) return;
	try {
		await banUser(selectedUser.value.id, banReason.value || undefined);
		toast.success("Usuario baneado");
		banOpen.value = false;
		adminStore.fetchUsers(
			adminStore.users?.page ?? 1,
			20,
			searchQuery.value || undefined,
		);
	} catch {
		toast.error("Error al banear usuario");
	}
}

async function handleUnban(user: AdminUser) {
	try {
		await unbanUser(user.id);
		toast.success("Usuario desbaneado");
		adminStore.fetchUsers(
			adminStore.users?.page ?? 1,
			20,
			searchQuery.value || undefined,
		);
	} catch {
		toast.error("Error al desbanear usuario");
	}
}

function confirmDelete(user: AdminUser) {
	selectedUser.value = user;
	deleteOpen.value = true;
}

async function handleDeleteConfirm() {
	if (!selectedUser.value) return;
	try {
		await deleteUser(selectedUser.value.id);
		toast.success("Usuario eliminado");
		deleteOpen.value = false;
		adminStore.fetchUsers(
			adminStore.users?.page ?? 1,
			20,
			searchQuery.value || undefined,
		);
	} catch {
		toast.error("Error al eliminar usuario");
	}
}

onMounted(() => {
	adminStore.fetchUsers(1, 20);
});
</script>
