<template>
	<div class="space-y-6 sm:space-y-8">
		<div class="animate-fade-in-up">
			<h1 class="font-display text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
			<p class="text-muted-foreground text-xs sm:text-sm mt-1">Vista general del sistema</p>
		</div>

		<div class="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
			<div
				v-for="(stat, index) in statCards"
				:key="stat.label"
				class="group relative overflow-hidden rounded-2xl border bg-card p-4 sm:p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
				:style="{ animationDelay: `${index * 80}ms` }"
			>
				<div
					class="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
					:class="stat.bgGradient"
				/>
				<div class="relative flex items-start justify-between">
					<div>
						<p class="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">{{ stat.label }}</p>
						<p class="text-2xl sm:text-3xl font-bold mt-1.5 sm:mt-2 tracking-tight font-display">{{ stat.value }}</p>
					</div>
					<div
						class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
						:class="stat.iconBg"
					>
						<component :is="stat.icon" class="w-4 h-4 sm:w-5 sm:h-5" :class="stat.iconColor" />
					</div>
				</div>
			</div>
		</div>

		<div class="grid gap-4 sm:gap-6 md:grid-cols-2">
			<div class="rounded-2xl border bg-card overflow-hidden animate-fade-in-up" style="animation-delay: 300ms;">
				<div class="px-4 sm:px-6 py-3 sm:py-4 border-b bg-muted/30">
					<div class="flex items-center gap-2">
						<Link class="w-4 h-4 text-primary" />
						<h2 class="font-display text-xs sm:text-sm font-semibold">URLs Recientes</h2>
					</div>
				</div>
				<div class="p-2">
					<div v-if="adminStore.isLoadingUrls" class="p-4 space-y-3">
						<div v-for="i in 5" :key="i" class="flex items-center gap-3">
							<Skeleton class="h-6 w-16 rounded-md" />
							<Skeleton class="h-4 flex-1 rounded-md" />
							<Skeleton class="h-4 w-12 rounded-md" />
						</div>
					</div>
					<div v-else-if="adminStore.urls?.data.length" class="space-y-0.5">
						<div
							v-for="url in adminStore.urls.data.slice(0, 5)"
							:key="url.shortCode"
							class="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm transition-colors hover:bg-muted/50"
						>
							<code class="font-mono text-primary font-semibold text-[10px] sm:text-xs bg-primary/10 px-1.5 sm:px-2 py-0.5 rounded-md">{{ url.shortCode }}</code>
							<span class="text-muted-foreground truncate flex-1 text-[10px] sm:text-xs">{{ url.originalUrl }}</span>
							<span class="text-[10px] sm:text-xs font-medium tabular-nums text-muted-foreground whitespace-nowrap">{{ url.visits }}</span>
						</div>
					</div>
					<div v-else class="p-6 sm:p-8 text-center">
						<Link class="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-muted-foreground/40" />
						<p class="text-[10px] sm:text-xs text-muted-foreground">No hay URLs</p>
					</div>
				</div>
			</div>

			<div class="rounded-2xl border bg-card overflow-hidden animate-fade-in-up" style="animation-delay: 400ms;">
				<div class="px-4 sm:px-6 py-3 sm:py-4 border-b bg-muted/30">
					<div class="flex items-center gap-2">
						<Users class="w-4 h-4 text-primary" />
						<h2 class="font-display text-xs sm:text-sm font-semibold">Usuarios Recientes</h2>
					</div>
				</div>
				<div class="p-2">
					<div v-if="adminStore.isLoadingUsers" class="p-4 space-y-3">
						<div v-for="i in 5" :key="i" class="flex items-center gap-3">
							<Skeleton class="h-8 w-8 rounded-full" />
							<Skeleton class="h-4 w-24 rounded-md" />
							<Skeleton class="h-5 w-12 rounded-full ml-auto" />
						</div>
					</div>
					<div v-else-if="adminStore.users?.data.length" class="space-y-0.5">
						<div
							v-for="user in adminStore.users.data.slice(0, 5)"
							:key="user.id"
							class="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm transition-colors hover:bg-muted/50"
						>
							<img v-if="user.image" :src="user.image" :alt="user.name" class="w-6 h-6 sm:w-7 sm:h-7 rounded-full ring-2 ring-background" />
							<div v-else class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-primary">
								{{ user.name.charAt(0).toUpperCase() }}
							</div>
							<span class="truncate flex-1 font-medium text-[10px] sm:text-xs">{{ user.name }}</span>
							<Badge
								:variant="user.role === 'admin' ? 'default' : 'secondary'"
								class="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 h-4 sm:h-5 font-medium"
							>
								{{ user.role }}
							</Badge>
						</div>
					</div>
					<div v-else class="p-6 sm:p-8 text-center">
						<Users class="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-muted-foreground/40" />
						<p class="text-[10px] sm:text-xs text-muted-foreground">No hay usuarios</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Eye, Link, Shield, Users } from "lucide-vue-next";
import { computed, onMounted, watch } from "vue";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStore } from "@/stores/adminStore";
import { useQuery, keepPreviousData } from "@tanstack/vue-query";
import { getAdminStats } from "@/api/admin";

const adminStore = useAdminStore();

// Stats query
const statsQuery = useQuery({
	queryKey: ["adminStats"],
	queryFn: async ({ signal }: any) => {
		return await getAdminStats(signal);
	},
	refetchOnWindowFocus: false,
});

watch(statsQuery.data, (v) => {
	if (v) adminStore.stats = v as any;
});

// Admin urls (first 5)
const adminUrlsKey = ["adminUrls", 1, 5, undefined];
const adminUrlsQuery = useQuery({
	queryKey: adminUrlsKey,
	queryFn: async ({ signal }: any) => {
		const page = 1,
			pageSize = 5,
			search = undefined;
		const { getAdminUrls } = await import("@/api/admin");
		return await getAdminUrls(page, pageSize, search, signal);
	},
	placeholderData: keepPreviousData,
	refetchOnWindowFocus: false,
});

watch(adminUrlsQuery.data, (v) => {
	if (v) adminStore.urls = v as any;
});

// Admin users (first 5)
const adminUsersKey = ["adminUsers", 1, 5, undefined];
const adminUsersQuery = useQuery({
	queryKey: adminUsersKey,
	queryFn: async ({ signal }: any) => {
		const page = 1,
			pageSize = 5,
			search = undefined;
		const { getAdminUsers } = await import("@/api/admin");
		return await getAdminUsers(page, pageSize, search, signal);
	},
	placeholderData: keepPreviousData,
	refetchOnWindowFocus: false,
});

watch(adminUsersQuery.data, (v) => {
	if (v) adminStore.users = v as any;
});

const statCards = computed(() => [
	{
		label: "Total Usuarios",
		value: adminStore.stats?.totalUsers ?? 0,
		icon: Users,
		iconBg: "bg-blue-500/10 dark:bg-blue-400/10",
		iconColor: "text-blue-600 dark:text-blue-400",
		bgGradient:
			"bg-gradient-to-br from-blue-500/5 to-transparent dark:from-blue-400/5",
	},
	{
		label: "Total URLs",
		value: adminStore.stats?.totalUrls ?? 0,
		icon: Link,
		iconBg: "bg-primary/10",
		iconColor: "text-primary",
		bgGradient: "bg-gradient-to-br from-primary/5 to-transparent",
	},
	{
		label: "Total Visitas",
		value: adminStore.stats?.totalVisits ?? 0,
		icon: Eye,
		iconBg: "bg-amber-500/10 dark:bg-amber-400/10",
		iconColor: "text-amber-600 dark:text-amber-400",
		bgGradient:
			"bg-gradient-to-br from-amber-500/5 to-transparent dark:from-amber-400/5",
	},
	{
		label: "Admins",
		value: adminStore.stats?.adminUsers ?? 0,
		icon: Shield,
		iconBg: "bg-violet-500/10 dark:bg-violet-400/10",
		iconColor: "text-violet-600 dark:text-violet-400",
		bgGradient:
			"bg-gradient-to-br from-violet-500/5 to-transparent dark:from-violet-400/5",
	},
]);

onMounted(() => {
	// queries will fetch automatically; no direct fetch calls
});
</script>
