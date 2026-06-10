<template>
	<div class="space-y-6">
		<div class="flex items-center justify-between animate-fade-in-up">
			<div>
				<h1 class="font-display text-2xl font-bold tracking-tight">Usuarios</h1>
				<p class="text-muted-foreground text-sm mt-1">Gestiona los usuarios del sistema</p>
			</div>
		</div>

		<div class="flex items-center gap-3 animate-fade-in-up" style="animation-delay: 100ms;">
			<div class="relative flex-1 max-w-sm">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					v-model="searchQuery"
					placeholder="Buscar por nombre o email..."
					class="pl-9 h-10 rounded-xl bg-muted/30 border-muted focus:bg-card transition-colors"
					@input="onSearch"
				/>
			</div>
		</div>

		<div class="rounded-2xl border bg-card overflow-hidden animate-fade-in-up" style="animation-delay: 200ms;">
			<div v-if="adminStore.isLoadingUsers" class="p-6 space-y-3">
				<div v-for="i in 10" :key="i" class="flex items-center gap-4 py-3 px-4">
					<Skeleton class="h-9 w-9 rounded-full" />
					<div class="space-y-1.5 flex-1">
						<Skeleton class="h-3.5 w-28 rounded-md" />
						<Skeleton class="h-3 w-40 rounded-md" />
					</div>
					<Skeleton class="h-5 w-12 rounded-full" />
					<Skeleton class="h-4 w-8 rounded-md" />
					<Skeleton class="h-4 w-8 rounded-md" />
					<div class="flex items-center gap-1.5">
						<Skeleton class="h-1.5 w-1.5 rounded-full" />
						<Skeleton class="h-5 w-14 rounded-full" />
					</div>
					<Skeleton class="h-7 w-7 rounded-lg" />
				</div>
			</div>
			<div v-else-if="!adminStore.users?.data.length" class="p-16 text-center">
				<div class="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
					<Users class="w-7 h-7 text-muted-foreground/50" />
				</div>
				<p class="text-sm font-medium text-muted-foreground">No se encontraron usuarios</p>
				<p class="text-xs text-muted-foreground/60 mt-1">Los usuarios registrados aparecerán aquí</p>
			</div>

			<div v-else class="hidden md:block">
				<Table class="admin-table">
					<TableHeader>
						<TableRow class="hover:bg-transparent border-b bg-muted/20">
							<TableHead class="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 h-11 pl-5">
								Usuario
							</TableHead>
							<TableHead class="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 h-11 w-20">
								Rol
							</TableHead>
							<TableHead class="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 h-11 w-16">
								URLs
							</TableHead>
							<TableHead class="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 h-11 w-16">
								Límite
							</TableHead>
							<TableHead class="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 h-11 w-24">
								Estado
							</TableHead>
							<TableHead class="text-right text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 h-11 pr-5 w-16">
								Acciones
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow
							v-for="user in adminStore.users.data"
							:key="user.id"
							class="group transition-all duration-150 hover:bg-muted/40 border-b border-border/50 last:border-b-0"
						>
							<TableCell class="pl-5 py-3">
								<div class="flex items-center gap-3">
									<div class="relative flex-shrink-0">
										<img
											v-if="user.image"
											:src="user.image"
											:alt="user.name"
											class="w-9 h-9 rounded-full ring-2 ring-background object-cover"
										/>
										<div
											v-else
											class="w-9 h-9 rounded-full bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-background"
										>
											{{ user.name.charAt(0).toUpperCase() }}
										</div>
										<div
											class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card"
											:class="user.banned ? 'bg-destructive' : 'bg-emerald-500'"
										/>
									</div>
									<div class="min-w-0">
										<p class="font-medium text-sm truncate leading-tight">{{ user.name }}</p>
										<p class="text-[11px] text-muted-foreground/60 truncate leading-tight mt-0.5">{{ user.email }}</p>
									</div>
								</div>
							</TableCell>
							<TableCell class="py-3 w-20">
								<Badge
									:variant="user.role === 'admin' ? 'default' : 'secondary'"
									class="text-[10px] px-1.5 py-0 h-5 font-semibold rounded-md"
								>
									{{ user.role }}
								</Badge>
							</TableCell>
							<TableCell class="py-3 w-16">
								<div class="flex items-center gap-1.5">
									<div class="w-1 h-1 rounded-full bg-primary/40" />
									<span class="text-sm font-semibold tabular-nums">{{ user.urlCount }}</span>
								</div>
							</TableCell>
							<TableCell class="py-3 w-16">
								<span class="text-sm font-medium tabular-nums text-muted-foreground/70">{{ user.urlLimit }}</span>
							</TableCell>
							<TableCell class="py-3 w-24">
								<div class="flex items-center gap-2">
									<div class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="user.banned ? 'bg-destructive' : 'bg-emerald-500'" />
									<Badge
										:variant="user.banned ? 'destructive' : 'outline'"
										class="text-[10px] px-1.5 py-0 h-5 font-medium rounded-md"
									>
										{{ user.banned ? 'Baneado' : 'Activo' }}
									</Badge>
								</div>
							</TableCell>
							<TableCell class="text-right py-3 pr-5 w-16">
								<DropdownMenu>
									<DropdownMenuTrigger as-child>
										<Button
											variant="ghost"
											size="sm"
											class="h-7 w-7 p-0 rounded-lg"
										>
											<MoreHorizontal class="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" class="rounded-xl w-44">
										<DropdownMenuItem class="rounded-lg text-xs gap-2" @click="openEditLimit(user)">
											<Settings class="h-3.5 w-3.5 text-muted-foreground" />
											Cambiar límite
										</DropdownMenuItem>
										<DropdownMenuItem v-if="!user.banned" class="rounded-lg text-xs gap-2 text-destructive" @click="handleBan(user)">
											<Ban class="h-3.5 w-3.5" />
											Banear
										</DropdownMenuItem>
										<DropdownMenuItem v-else class="rounded-lg text-xs gap-2 text-emerald-600 dark:text-emerald-400" @click="handleUnban(user)">
											<CheckCircle class="h-3.5 w-3.5" />
											Desbanear
										</DropdownMenuItem>
										<DropdownMenuSeparator class="my-1" />
										<DropdownMenuItem class="rounded-lg text-xs gap-2 text-destructive" @click="confirmDelete(user)">
											<Trash2 class="h-3.5 w-3.5" />
											Eliminar
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>

			<div v-if="adminStore.users?.data.length" class="md:hidden divide-y divide-border/50">
				<div
					v-for="user in adminStore.users.data"
					:key="user.id"
					class="p-4 space-y-3"
				>
					<div class="flex items-center gap-3">
						<div class="relative flex-shrink-0">
							<img
								v-if="user.image"
								:src="user.image"
								:alt="user.name"
								class="w-10 h-10 rounded-full ring-2 ring-background object-cover"
							/>
							<div
								v-else
								class="w-10 h-10 rounded-full bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center text-sm font-bold text-primary ring-2 ring-background"
							>
								{{ user.name.charAt(0).toUpperCase() }}
							</div>
							<div
								class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card"
								:class="user.banned ? 'bg-destructive' : 'bg-emerald-500'"
							/>
						</div>
						<div class="min-w-0 flex-1">
							<p class="font-medium text-sm truncate leading-tight">{{ user.name }}</p>
							<p class="text-[11px] text-muted-foreground/60 truncate leading-tight mt-0.5">{{ user.email }}</p>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger as-child>
								<Button
									variant="ghost"
									size="sm"
									class="h-8 w-8 p-0 rounded-lg"
								>
									<MoreHorizontal class="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" class="rounded-xl w-44">
								<DropdownMenuItem class="rounded-lg text-xs gap-2" @click="openEditLimit(user)">
									<Settings class="h-3.5 w-3.5 text-muted-foreground" />
									Cambiar límite
								</DropdownMenuItem>
								<DropdownMenuItem v-if="!user.banned" class="rounded-lg text-xs gap-2 text-destructive" @click="handleBan(user)">
									<Ban class="h-3.5 w-3.5" />
									Banear
								</DropdownMenuItem>
								<DropdownMenuItem v-else class="rounded-lg text-xs gap-2 text-emerald-600 dark:text-emerald-400" @click="handleUnban(user)">
									<CheckCircle class="h-3.5 w-3.5" />
									Desbanear
								</DropdownMenuItem>
								<DropdownMenuSeparator class="my-1" />
								<DropdownMenuItem class="rounded-lg text-xs gap-2 text-destructive" @click="confirmDelete(user)">
									<Trash2 class="h-3.5 w-3.5" />
									Eliminar
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<div class="flex items-center gap-2 flex-wrap">
						<Badge
							:variant="user.role === 'admin' ? 'default' : 'secondary'"
							class="text-[10px] px-1.5 py-0 h-5 font-semibold rounded-md"
						>
							{{ user.role }}
						</Badge>
						<div class="flex items-center gap-1">
							<div class="w-1 h-1 rounded-full bg-primary/40" />
							<span class="text-xs font-medium tabular-nums">{{ user.urlCount }} URLs</span>
						</div>
						<span class="text-xs text-muted-foreground/50">·</span>
						<span class="text-xs text-muted-foreground/60">Límite: {{ user.urlLimit }}</span>
						<span class="text-xs text-muted-foreground/50">·</span>
						<div class="flex items-center gap-1">
							<div class="w-1.5 h-1.5 rounded-full" :class="user.banned ? 'bg-destructive' : 'bg-emerald-500'" />
							<Badge
								:variant="user.banned ? 'destructive' : 'outline'"
								class="text-[10px] px-1.5 py-0 h-5 font-medium rounded-md"
							>
								{{ user.banned ? 'Baneado' : 'Activo' }}
							</Badge>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div
			v-if="adminStore.users && adminStore.users.totalPages > 1"
			class="flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in-up"
			style="animation-delay: 300ms;"
		>
			<p class="text-xs text-muted-foreground text-center sm:text-left">
				Mostrando {{ (adminStore.users.page - 1) * adminStore.users.pageSize + 1 }}
				- {{ Math.min(adminStore.users.page * adminStore.users.pageSize, adminStore.users.total) }}
				de {{ adminStore.users.total }} usuarios
			</p>
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					class="h-9 sm:h-8 rounded-lg text-xs px-3"
					:disabled="adminStore.users.page <= 1"
					@click="goToPage(adminStore.users.page - 1)"
				>
					Anterior
				</Button>
				<span class="text-xs font-medium tabular-nums px-2">
					{{ adminStore.users.page }} / {{ adminStore.users.totalPages }}
				</span>
				<Button
					variant="outline"
					size="sm"
					class="h-9 sm:h-8 rounded-lg text-xs px-3"
					:disabled="adminStore.users.page >= adminStore.users.totalPages"
					@click="goToPage(adminStore.users.page + 1)"
				>
					Siguiente
				</Button>
			</div>
		</div>

		<Dialog v-model:open="editLimitOpen">
			<DialogContent class="rounded-2xl">
				<DialogHeader>
					<DialogTitle class="font-display">Cambiar límite de URLs</DialogTitle>
					<DialogDescription>
						Actualiza el límite de URLs para <strong>{{ selectedUser?.name }}</strong>
					</DialogDescription>
				</DialogHeader>
				<div class="space-y-4 py-4">
					<div class="space-y-2">
						<Label for="limit" class="text-xs font-medium">Nuevo límite</Label>
						<Input id="limit" v-model.number="newLimit" type="number" min="1" max="1000" class="rounded-xl h-10" />
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" class="rounded-xl" @click="editLimitOpen = false">Cancelar</Button>
					<Button class="rounded-xl" @click="handleUpdateLimit">Guardar</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<Dialog v-model:open="banOpen">
			<DialogContent class="rounded-2xl">
				<DialogHeader>
					<DialogTitle class="font-display">Banear usuario</DialogTitle>
					<DialogDescription>
						Banear a <strong>{{ selectedUser?.name }}</strong>. Opcionalmente ingresa una razón.
					</DialogDescription>
				</DialogHeader>
				<div class="space-y-4 py-4">
					<div class="space-y-2">
						<Label for="banReason" class="text-xs font-medium">Razón (opcional)</Label>
						<Input id="banReason" v-model="banReason" placeholder="Motivo del baneo..." class="rounded-xl h-10" />
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" class="rounded-xl" @click="banOpen = false">Cancelar</Button>
					<Button variant="destructive" class="rounded-xl" @click="handleBanConfirm">Banear</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<Dialog v-model:open="deleteOpen">
			<DialogContent class="rounded-2xl">
				<DialogHeader>
					<DialogTitle class="font-display">Eliminar usuario</DialogTitle>
					<DialogDescription>
						¿Estás seguro de eliminar a <strong>{{ selectedUser?.name }}</strong>? Esta acción eliminará todas sus URLs y no se puede deshacer.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" class="rounded-xl" @click="deleteOpen = false">Cancelar</Button>
					<Button variant="destructive" class="rounded-xl" @click="handleDeleteConfirm">Eliminar</Button>
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
import { onMounted, ref, computed, watch } from "vue";
import { toast } from "vue-sonner";
import type { AdminUser } from "@/api/admin";
import {
	banUser,
	deleteUser,
	unbanUser,
	updateUserUrlLimit,
	getAdminUsers,
} from "@/api/admin";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/vue-query";
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

// Admin users query params
const adminParams = ref({ page: 1, pageSize: 20, search: undefined as string | undefined });

const queryClient = useQueryClient();

const adminQuery = useQuery({
	queryKey: computed(() => ["adminUsers", adminParams.value.page, adminParams.value.pageSize, adminParams.value.search]),
	queryFn: async ({ signal }: any) => {
		const { page, pageSize, search } = adminParams.value;
		const res = await getAdminUsers(page, pageSize, search, signal);
		return res;
	},
	placeholderData: keepPreviousData,
	refetchOnWindowFocus: false,
});

watch(adminQuery.data, (data: any) => {
	if (data) {
		adminStore.users = data;
	}
});

watch(adminQuery.error, (err: any) => {
	if (err) console.error("Error fetching admin users:", err);
});

watch(adminQuery.isFetching, (v) => {
	adminStore.isLoadingUsers = v;
});

// Mutations: optimistic updates
const deleteUserMutation = useMutation<void, unknown, string, { previous: any }>({
	mutationFn: async (userId: string) => {
		return await deleteUser(userId);
	},
	onMutate: async (userId: string) => {
		await queryClient.cancelQueries({ queryKey: ["adminUsers"] });
		const previous = adminStore.users ? JSON.parse(JSON.stringify(adminStore.users)) : null;
		// Optimistically remove user from list
		if (adminStore.users && adminStore.users.data) {
			adminStore.users.data = adminStore.users.data.filter((u: any) => u.id !== userId);
		}
		return { previous };
	},
	onError: (err: unknown, _userId: string, context: any) => {
		if (context?.previous) {
			adminStore.users = context.previous;
		}
		console.error("deleteUserMutation error:", err);
	},
	onSettled: () => {
		queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
	},
});

const banMutation = useMutation<void, unknown, { userId: string; reason?: string }, { previous: any }>({
	mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
		return await banUser(userId, reason);
	},
	onMutate: async ({ userId }: { userId: string }) => {
		await queryClient.cancelQueries({ queryKey: ["adminUsers"] });
		const previous = adminStore.users ? JSON.parse(JSON.stringify(adminStore.users)) : null;
		if (adminStore.users && adminStore.users.data) {
			adminStore.users.data = adminStore.users.data.map((u: any) =>
				u.id === userId ? { ...u, banned: true } : u,
			);
		}
		return { previous };
	},
	onError: (err: unknown, _vars: any, context: any) => {
		if (context?.previous) adminStore.users = context.previous;
		console.error("banMutation error:", err);
	},
	onSettled: () => queryClient.invalidateQueries({ queryKey: ["adminUsers"] }),
});

const unbanMutation = useMutation<void, unknown, string, { previous: any }>({
	mutationFn: async (userId: string) => {
		return await unbanUser(userId);
	},
	onMutate: async (userId: string) => {
		await queryClient.cancelQueries({ queryKey: ["adminUsers"] });
		const previous = adminStore.users ? JSON.parse(JSON.stringify(adminStore.users)) : null;
		if (adminStore.users && adminStore.users.data) {
			adminStore.users.data = adminStore.users.data.map((u: any) =>
				u.id === userId ? { ...u, banned: false } : u,
			);
		}
		return { previous };
	},
	onError: (err: unknown, _userId: string, context: any) => {
		if (context?.previous) adminStore.users = context.previous;
		console.error("unbanMutation error:", err);
	},
	onSettled: () => queryClient.invalidateQueries({ queryKey: ["adminUsers"] }),
});

const updateLimitMutation = useMutation<void, unknown, { userId: string; limit: number }, { previous: any }>({
	mutationFn: async ({ userId, limit }: { userId: string; limit: number }) => {
		return await updateUserUrlLimit(userId, limit);
	},
	onMutate: async ({ userId, limit }: { userId: string; limit: number }) => {
		await queryClient.cancelQueries({ queryKey: ["adminUsers"] });
		const previous = adminStore.users ? JSON.parse(JSON.stringify(adminStore.users)) : null;
		if (adminStore.users && adminStore.users.data) {
			adminStore.users.data = adminStore.users.data.map((u: any) =>
				u.id === userId ? { ...u, urlLimit: limit } : u,
			);
		}
		return { previous };
	},
	onError: (err: unknown, _vars: any, context: any) => {
		if (context?.previous) adminStore.users = context.previous;
		console.error("updateLimitMutation error:", err);
	},
	onSettled: () => queryClient.invalidateQueries({ queryKey: ["adminUsers"] }),
});


function onSearch() {
	clearTimeout(searchTimeout);
	searchTimeout = setTimeout(async () => {
		adminParams.value.page = 1;
		adminParams.value.search = searchQuery.value || undefined;
		// cancelar consultas en vuelo para abortar la petición anterior
		queryClient.cancelQueries({ queryKey: ["adminUsers"] });
		await adminQuery.refetch();
	}, 300);
}

function goToPage(page: number) {
	adminParams.value.page = page;
	// cancelar consultas en vuelo para abortar la petición anterior
	queryClient.cancelQueries({ queryKey: ["adminUsers"] });
	adminQuery.refetch();
}

function openEditLimit(user: AdminUser) {
	selectedUser.value = user;
	newLimit.value = user.urlLimit;
	editLimitOpen.value = true;
}

async function handleUpdateLimit() {
	if (!selectedUser.value) return;
	try {
		await updateLimitMutation.mutateAsync({ userId: selectedUser.value.id, limit: newLimit.value });
		toast.success("Límite actualizado");
		editLimitOpen.value = false;
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
		await banMutation.mutateAsync({ userId: selectedUser.value.id, reason: banReason.value || undefined });
		toast.success("Usuario baneado");
		banOpen.value = false;
	} catch {
		toast.error("Error al banear usuario");
	}
}

async function handleUnban(user: AdminUser) {
	try {
		await unbanMutation.mutateAsync(user.id);
		toast.success("Usuario desbaneado");
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
		await deleteUserMutation.mutateAsync(selectedUser.value.id);
		toast.success("Usuario eliminado");
		deleteOpen.value = false;
	} catch {
		toast.error("Error al eliminar usuario");
	}
}

onMounted(() => {
	// adminQuery will automatically fetch on mount due to its reactive key
	adminQuery.refetch();
});
</script>
