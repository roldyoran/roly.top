<script setup lang="ts">
import { ArrowLeft, TimerOff } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { getUrlInfoRequest } from "@/api/http";
import Google from "@/assets/google.vue";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

const route = useRoute();
const authStore = useAuthStore();

const shortCode = computed(() => route.params.shortCode as string);
const originalUrl = ref("");
const expiresAt = ref("");
const isCreator = ref(false);

const formattedDate = computed(() => {
	if (!expiresAt.value) return "";
	return new Date(expiresAt.value).toLocaleDateString("es-ES", {
		day: "2-digit",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
});

onMounted(async () => {
	// 1. Cargar info de la URL (para mostrar originalUrl)
	try {
		const info = await getUrlInfoRequest(shortCode.value);
		originalUrl.value = info.originalUrl;
	} catch {
		// La URL puede no existir o estar expirada
	}

	// 2. Verificar si es el creador (localStorage check)
	const pending = localStorage.getItem("pending_claim");
	if (pending) {
		const parsed = JSON.parse(pending);
		if (parsed.shortCode === shortCode.value) {
			isCreator.value = true;
			expiresAt.value = parsed.expiresAt;
		}
	}
});

async function handleSignIn() {
	await authStore.signIn();
	// Después del OAuth callback, initialize() → tryClaimPendingUrl() → claim automático
	// El usuario será redirigido a /app/dashboard
}
</script>

<template>
	<div class="min-h-screen flex items-center justify-center bg-background p-4">
		<div class="w-full max-w-md text-center space-y-6">
			<!-- Logo / Back link -->
			<a
				href="/"
				class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
			>
				<ArrowLeft class="w-4 h-4" />
				roly.top
			</a>

			<!-- Card principal -->
			<div class="rounded-2xl border bg-card p-8 space-y-5">
				<!-- Icono -->
				<div
					class="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto"
				>
					<TimerOff class="w-8 h-8 text-destructive" />
				</div>

				<!-- Titulo -->
				<div>
					<h1 class="font-display text-xl font-bold">URL expirada</h1>
					<p class="text-sm text-muted-foreground mt-1">
						{{
							isCreator
								? "Tu URL ha expirado."
								: "Esta URL ha expirado."
						}}
					</p>
				</div>

				<!-- Info de la URL -->
				<div
					class="p-3 rounded-lg bg-muted/50 border border-border/50 text-left"
				>
					<code class="font-mono text-sm font-semibold text-primary">
						/{{ shortCode }}
					</code>
					<p class="text-xs text-muted-foreground mt-1 truncate">
						{{ originalUrl || "Cargando..." }}
					</p>
					<p class="text-xs text-muted-foreground/60 mt-1">
						Expiró: {{ formattedDate }}
					</p>
				</div>

				<!-- Mensaje -->
				<p class="text-sm text-muted-foreground">
					{{
						isCreator
							? "Inicia sesión para reactivarla. Cuenta como 1 de tus URLs."
							: "El creador debe iniciar sesión para reactivarla."
					}}
				</p>

				<!-- Botón sign-in -->
				<Button class="w-full" :disabled="authStore.isLoading" @click="handleSignIn">
					<Google class="w-4 h-4 mr-2" />
					Iniciar sesión con Google
				</Button>
			</div>
		</div>
	</div>
</template>
