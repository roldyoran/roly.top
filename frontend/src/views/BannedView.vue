<template>
	<div class="min-h-screen flex items-center justify-center px-4 relative z-10">
		<div class="w-full max-w-md">
			<div class="rounded-2xl border border-border bg-card p-8 text-center space-y-6">
				<div class="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
					<ShieldOff class="w-8 h-8 text-destructive" />
				</div>

				<div class="space-y-2">
					<h1 class="text-xl font-bold tracking-tight text-foreground">
						Cuenta suspendida
					</h1>
					<p class="text-sm text-muted-foreground leading-relaxed">
						Tu cuenta ha sido restringida y no puedes acceder a esta aplicación.
					</p>
				</div>

				<div v-if="resolvedReason || resolvedExpiry" class="rounded-lg border border-border bg-muted/50 p-4 text-left space-y-3">
					<div v-if="resolvedReason" class="flex items-start gap-3">
						<Info class="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
						<div>
							<p class="text-xs font-medium text-muted-foreground">Motivo</p>
							<p class="text-sm text-foreground">{{ resolvedReason }}</p>
						</div>
					</div>
					<div v-if="resolvedExpiry" class="flex items-start gap-3">
						<Clock class="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
						<div>
							<p class="text-xs font-medium text-muted-foreground">Expira</p>
							<p class="text-sm text-foreground">{{ formattedExpiry }}</p>
						</div>
					</div>
				</div>

				<div v-else class="rounded-lg border border-border bg-muted/50 p-4">
					<p class="text-sm text-muted-foreground">
						Suspensión permanente. Si crees que esto es un error, contacta al soporte.
					</p>
				</div>

				<div class="flex flex-col gap-2">
					<Button as-child class="w-full">
						<a href="/">Volver al inicio</a>
					</Button>
					<Button variant="ghost" size="sm" class="text-muted-foreground" @click="handleSignOut">
						Cerrar sesión
					</Button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Clock, Info, ShieldOff } from "lucide-vue-next";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const queryReason = computed(() => {
	const desc = route.query.error_description;
	if (typeof desc === "string") {
		return decodeURIComponent(desc.replace(/\+/g, " "));
	}
	return null;
});

const resolvedReason = computed(() => authStore.banReason ?? queryReason.value);
const resolvedExpiry = computed(() => authStore.banExpires);

const formattedExpiry = computed(() => {
	if (!resolvedExpiry.value) return null;
	try {
		return new Date(resolvedExpiry.value).toLocaleDateString("es-ES", {
			day: "numeric",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return resolvedExpiry.value;
	}
});

async function handleSignOut() {
	try {
		await authStore.signOut();
	} catch {
		// Silenciar error del backend
	} finally {
		authStore.resetAuth();
		router.push({ name: "home" });
		toast.success("Sesión cerrada");
	}
}
</script>
