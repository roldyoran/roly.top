<template>
	<div class="min-h-screen flex items-center justify-center px-4 relative z-10">
		<div class="w-full max-w-lg">
			<div class="rounded-2xl border border-border bg-card p-8 text-center space-y-6 shadow-lg">
				<div class="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
					<ShieldOff class="w-10 h-10 text-destructive" />
				</div>

				<div class="space-y-2">
					<h1 class="text-2xl font-bold tracking-tight text-foreground font-display">
						Acceso restringido
					</h1>
					<p class="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
						Tu cuenta ha sido suspendida y no puede acceder a esta aplicación.
						Si crees que esto es un error, por favor contacta al soporte.
					</p>
				</div>

				<div v-if="errorDescription" class="rounded-lg border border-border bg-muted/50 p-4 text-left">
					<div class="flex items-start gap-3">
						<Info class="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
						<div>
							<p class="text-xs font-medium text-muted-foreground">Detalles</p>
							<p class="text-sm text-foreground">{{ errorDescription }}</p>
						</div>
					</div>
				</div>

				<div class="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
					<div class="flex items-center gap-3">
						<AlertTriangle class="w-4 h-4 text-destructive flex-shrink-0" />
						<p class="text-sm text-foreground">
							Si necesitas ayuda, envía un correo a
							<a href="mailto:support@shorturl.com" class="font-medium text-primary hover:underline">
								support@shorturl.com
							</a>
						</p>
					</div>
				</div>

				<div class="flex flex-col gap-2 pt-2">
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
import { AlertTriangle, Info, ShieldOff } from "lucide-vue-next";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const errorDescription = computed(() => {
	const desc = route.query.error_description;
	if (typeof desc === "string") {
		return decodeURIComponent(desc.replace(/\+/g, " "));
	}
	return null;
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
