<template>
	<div class="space-y-6">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
			<p class="text-muted-foreground">Vista general del sistema</p>
		</div>

		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card v-for="stat in statCards" :key="stat.label">
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">{{ stat.label }}</CardTitle>
					<component :is="stat.icon" class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{{ stat.value }}</div>
				</CardContent>
			</Card>
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>URLs Recientes</CardTitle>
				</CardHeader>
				<CardContent>
					<div v-if="adminStore.isLoadingUrls" class="space-y-2">
						<Skeleton v-for="i in 5" :key="i" class="h-10 w-full" />
					</div>
					<div v-else-if="adminStore.urls?.data.length" class="space-y-2">
						<div
							v-for="url in adminStore.urls.data.slice(0, 5)"
							:key="url.shortCode"
							class="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
						>
							<code class="font-mono text-primary">/{{ url.shortCode }}</code>
							<span class="text-muted-foreground truncate max-w-[200px] ml-2">{{ url.originalUrl }}</span>
							<span class="text-muted-foreground ml-auto whitespace-nowrap">{{ url.visits }} visits</span>
						</div>
					</div>
					<p v-else class="text-sm text-muted-foreground">No hay URLs</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Usuarios Recientes</CardTitle>
				</CardHeader>
				<CardContent>
					<div v-if="adminStore.isLoadingUsers" class="space-y-2">
						<Skeleton v-for="i in 5" :key="i" class="h-10 w-full" />
					</div>
					<div v-else-if="adminStore.users?.data.length" class="space-y-2">
						<div
							v-for="user in adminStore.users.data.slice(0, 5)"
							:key="user.id"
							class="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
						>
							<div class="flex items-center gap-2">
								<div class="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
									{{ user.name.charAt(0).toUpperCase() }}
								</div>
								<span class="truncate max-w-[120px]">{{ user.name }}</span>
							</div>
							<Badge :variant="user.role === 'admin' ? 'default' : 'secondary'" class="text-xs">
								{{ user.role }}
							</Badge>
						</div>
					</div>
					<p v-else class="text-sm text-muted-foreground">No hay usuarios</p>
				</CardContent>
			</Card>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Eye, Link, Shield, Users } from "lucide-vue-next";
import { computed, onMounted } from "vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStore } from "@/stores/adminStore";

const adminStore = useAdminStore();

const statCards = computed(() => [
	{
		label: "Total Usuarios",
		value: adminStore.stats?.totalUsers ?? 0,
		icon: Users,
	},
	{ label: "Total URLs", value: adminStore.stats?.totalUrls ?? 0, icon: Link },
	{
		label: "Total Visitas",
		value: adminStore.stats?.totalVisits ?? 0,
		icon: Eye,
	},
	{ label: "Admins", value: adminStore.stats?.adminUsers ?? 0, icon: Shield },
]);

onMounted(() => {
	adminStore.fetchStats();
	adminStore.fetchUrls(1, 5);
	adminStore.fetchUsers(1, 5);
});
</script>
