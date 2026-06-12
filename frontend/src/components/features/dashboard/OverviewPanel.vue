<template>
	<div class="flex flex-col gap-5">
		<!-- WELCOME BANNER -->
		<Card class="relative overflow-hidden border-border/60">
			<CardContent class="p-5 sm:p-6">
				<div class="relative z-10 flex items-center justify-between">
					<div>
						<p class="text-xs font-mono tracking-wider text-muted-foreground mb-1">
							{{ greeting }}
						</p>
						<h1 class="text-xl sm:text-2xl font-display font-800 tracking-tight">
							{{ userName || 'Usuario' }}
						</h1>
						<p class="text-xs text-muted-foreground mt-1.5 font-mono">
							Tu panel de control — {{ totalLinks }} enlace{{ totalLinks !== 1 ? 's' : '' }} activo{{ totalLinks !== 1 ? 's' : '' }}
						</p>
					</div>
					<div
						class="hidden sm:flex size-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20"
					>
						<LayoutDashboard class="size-6 text-primary" />
					</div>
				</div>
				<!-- Decorative gradient -->
				<div
					class="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-primary/5 blur-3xl"
				/>
				<div
					class="pointer-events-none absolute -bottom-8 -left-8 size-32 rounded-full bg-primary/3 blur-2xl"
				/>
			</CardContent>
		</Card>

		<!-- STAT CARDS -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
			<template v-if="isLoading">
				<Card v-for="i in 4" :key="i" class="border-border/60">
					<CardContent class="p-4">
						<Skeleton class="h-3 w-16 mb-3" />
						<Skeleton class="h-7 w-12 mb-2" />
						<Skeleton class="h-3 w-24" />
					</CardContent>
				</Card>
			</template>
			<template v-else>
				<!-- Enlaces Totales -->
				<Card class="relative overflow-hidden border-border/60">
					<CardContent class="p-4">
						<div class="flex items-center justify-between mb-3">
							<span
								class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground"
							>Enlaces</span>
							<div class="flex size-7 items-center justify-center rounded-lg bg-primary/10">
								<Link class="size-3.5 text-primary" />
							</div>
						</div>
						<p class="text-3xl font-display font-800 tracking-tight leading-none">
							{{ totalLinks }}
						</p>
						<div class="mt-2.5 flex items-center gap-1.5">
							<Badge variant="default" class="gap-1">
								<span class="size-1.5 rounded-full bg-primary-foreground animate-pulse" />
								Activo
							</Badge>
						</div>
					</CardContent>
					<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
				</Card>

				<!-- Total Clics -->
				<Card class="relative overflow-hidden border-border/60">
					<CardContent class="p-4">
						<div class="flex items-center justify-between mb-3">
							<span
								class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground"
							>Clics</span>
							<div class="flex size-7 items-center justify-center rounded-lg bg-primary/10">
								<MousePointerClick class="size-3.5 text-primary" />
							</div>
						</div>
						<p class="text-3xl font-display font-800 tracking-tight leading-none">
							{{ formatNumber(totalClicks) }}
						</p>
						<p class="mt-2.5 text-[10px] font-mono text-muted-foreground">
							en todos tus enlaces
						</p>
					</CardContent>
					<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
				</Card>

				<!-- Límite -->
				<Card class="relative overflow-hidden border-border/60">
					<CardContent class="p-4">
						<div class="flex items-center justify-between mb-3">
							<span
								class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground"
							>Límite</span>
							<div class="flex size-7 items-center justify-center rounded-lg bg-primary/10">
								<Gauge class="size-3.5 text-primary" />
							</div>
						</div>
						<p class="text-3xl font-display font-800 tracking-tight leading-none">
							{{ totalLinks }}<span class="text-lg text-muted-foreground font-600">/{{ urlLimit }}</span>
						</p>
						<!-- Progress bar -->
						<div class="mt-3">
							<Progress
								:model-value="Math.min((totalLinks / urlLimit) * 100, 100)"
								class="h-1.5"
							/>
							<p class="mt-1.5 text-[10px] font-mono text-muted-foreground">
								{{ urlLimit - totalLinks }} espacio{{ (urlLimit - totalLinks) !== 1 ? 's' : '' }} restante{{ (urlLimit - totalLinks) !== 1 ? 's' : '' }}
							</p>
						</div>
					</CardContent>
					<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
				</Card>

				<!-- Cuenta -->
				<Card class="relative overflow-hidden border-border/60">
					<CardContent class="p-4">
						<div class="flex items-center justify-between mb-3">
							<span
								class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground"
							>Cuenta</span>
							<div class="flex size-7 items-center justify-center rounded-lg bg-primary/10">
								<Crown class="size-3.5 text-primary" />
							</div>
						</div>
						<p class="text-3xl font-display font-800 tracking-tight leading-none">
							{{ isAdmin ? 'Pro' : 'Free' }}
						</p>
						<p class="mt-2.5 text-[10px] font-mono text-muted-foreground">
							{{ userName || 'Usuario' }}
						</p>
					</CardContent>
					<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
				</Card>
			</template>
		</div>

		<!-- BOTTOM ROW: Actions + Account -->
		<div class="grid grid-cols-1 lg:grid-cols-5 gap-3">
			<!-- Quick Actions -->
			<Card class="lg:col-span-3 border-border/60">
				<CardContent class="p-5">
					<div class="flex items-center gap-2 mb-3">
						<div class="flex size-6 items-center justify-center rounded-md bg-primary/10">
							<Zap class="size-3.5 text-primary" />
						</div>
						<span class="text-xs font-mono font-700 tracking-wider uppercase text-muted-foreground">
							Acciones Rápidas
						</span>
					</div>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
						<Button
							variant="outline"
							class="flex flex-col items-center gap-2 h-auto py-3.5 border-border/60 hover:border-primary/30 hover:bg-primary/5"
							@click="$emit('navigate', 'create')"
						>
							<div class="flex size-9 items-center justify-center rounded-lg bg-primary/10">
								<Plus class="size-4 text-primary" />
							</div>
							<span class="text-[11px] font-mono font-600">Nuevo Enlace</span>
						</Button>
						<Button
							variant="outline"
							class="flex flex-col items-center gap-2 h-auto py-3.5 border-border/60 hover:border-primary/30 hover:bg-primary/5"
							@click="$emit('navigate', 'myurls')"
						>
							<div class="flex size-9 items-center justify-center rounded-lg bg-primary/10">
								<Link class="size-4 text-primary" />
							</div>
							<span class="text-[11px] font-mono font-600">Mis Enlaces</span>
						</Button>
						<Button
							variant="outline"
							class="flex flex-col items-center gap-2 h-auto py-3.5 border-border/60 hover:border-primary/30 hover:bg-primary/5"
							@click="$emit('navigate', 'qrdash')"
						>
							<div class="flex size-9 items-center justify-center rounded-lg bg-primary/10">
								<QrCode class="size-4 text-primary" />
							</div>
							<span class="text-[11px] font-mono font-600">Código QR</span>
						</Button>
						<Button
							variant="outline"
							class="flex flex-col items-center gap-2 h-auto py-3.5 border-border/60 hover:border-primary/30 hover:bg-primary/5"
							@click="$emit('navigate', 'analytics')"
						>
							<div class="flex size-9 items-center justify-center rounded-lg bg-primary/10">
								<BarChart3 class="size-4 text-primary" />
							</div>
							<span class="text-[11px] font-mono font-600">Analíticas</span>
						</Button>
					</div>
				</CardContent>
			</Card>

			<!-- Account Info -->
			<Card class="lg:col-span-2 border-border/60">
				<CardContent class="p-5">
					<div class="flex items-center gap-2 mb-3">
						<div class="flex size-6 items-center justify-center rounded-md bg-primary/10">
							<User class="size-3.5 text-primary" />
						</div>
						<span class="text-xs font-mono font-700 tracking-wider uppercase text-muted-foreground">
							Cuenta
						</span>
					</div>
					<div class="flex flex-col gap-0">
						<div class="flex items-center justify-between py-2.5">
							<span class="text-[11px] font-mono text-muted-foreground">Nombre</span>
							<span class="text-[11px] font-mono font-600">{{ userName || 'Invitado' }}</span>
						</div>
						<Separator />
						<div class="flex items-center justify-between py-2.5">
							<span class="text-[11px] font-mono text-muted-foreground">Correo</span>
							<span class="text-[11px] font-mono text-muted-foreground truncate max-w-[160px] text-right">{{ userEmail || 'N/D' }}</span>
						</div>
						<Separator />
						<div class="flex items-center justify-between py-2.5">
							<span class="text-[11px] font-mono text-muted-foreground">Rol</span>
							<Badge
								:variant="isAdmin ? 'default' : 'secondary'"
								class="gap-1"
							>
								<span
									v-if="isAdmin"
									class="size-1 rounded-full bg-primary-foreground"
								/>
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
	BarChart3,
	Crown,
	Gauge,
	LayoutDashboard,
	Link,
	MousePointerClick,
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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

const greeting = computed(() => {
	const hour = new Date().getHours();
	if (hour < 12) return "Buenos días";
	if (hour < 18) return "Buenas tardes";
	return "Buenas noches";
});

function formatNumber(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return String(n);
}
</script>
