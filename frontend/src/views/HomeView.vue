<template>
  <section class="relative min-h-[calc(100vh-180px)] flex flex-col items-center justify-center px-4 pt-6 pb-10 sm:pt-0 sm:pb-8 overflow-hidden">
    <div class="hero-tag flex items-center gap-2 mb-6">
      <Badge variant="secondary" class="text-xs font-medium">
        <svg class="w-4 h-4 mr-1 inline" viewBox="0 0 256 231" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path fill="currentColor" d="m65.82 3.324 30.161 54.411-27.698 49.857a16.003 16.003 0 0 0 0 15.573l27.698 49.98-30.16 54.411a32.007 32.007 0 0 1-13.542-12.74L4.27 131.412a32.13 32.13 0 0 1 0-32.007l48.01-83.403a32.007 32.007 0 0 1 13.542-12.68Z"/>
          <path fill="currentColor" d="m203.696 16.003 48.01 83.403c5.725 9.848 5.725 22.159 0 32.007l-48.01 83.402a32.007 32.007 0 0 1-27.698 16.004h-48.01l59.705-107.654a16.003 16.003 0 0 0 0-15.511L127.988 0h48.01a32.007 32.007 0 0 1 27.698 16.003Z" opacity="0.6"/>
          <path fill="currentColor" d="M79.978 230.819c-4.924 0-9.849-1.17-14.157-3.263l59.212-106.792a11.045 11.045 0 0 0 0-10.71L65.821 3.324A32.007 32.007 0 0 1 79.978 0h48.01l59.705 107.654a16.003 16.003 0 0 1 0 15.51L127.988 230.82h-48.01Z" opacity="0.8"/>
        </svg>
        Powered by Cloudflare Workers
      </Badge>
    </div>

    <h1 class="hero-h1 font-display font-extrabold text-center leading-[1.0] mb-3 tracking-tight w-full max-w-3xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-foreground">
      Acorta tu URL<br/>
      <span class="text-primary">al instante.</span>
    </h1>

    <p class="hero-sub font-body text-center mb-4 max-w-md text-sm sm:text-base text-muted-foreground">
      Simple · Rápido · Gratis · Construido sobre infraestructura Edge
    </p>

    <div class="hero-svc flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-6 mt-1">
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card/80 border-border">
        <svg class="w-3 h-3 flex-shrink-0 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
        </svg>
        <span class="font-mono text-xs text-foreground">{{ SERVICE_URL }}</span>
      </div>
      <Tooltip>
        <TooltipTrigger :asChild="true">
          <Button
            variant="outline"
            size="sm"
            class="h-8 w-8 p-0"
            @click="copyServiceUrl"
            aria-label="Copiar URL del servicio"
          >
            <Copy class="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copiar URL del servicio</TooltipContent>
      </Tooltip>
    </div>

    <!-- Mensaje para usuarios no autenticados -->
    <div v-if="!authStore.isAuthenticated" class="hero-card w-full" style="max-width:680px">
      <Card class="rounded-2xl p-6 sm:p-8 text-center">
        <div class="space-y-4">
          <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <svg class="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-display font-bold text-lg text-foreground">Inicia sesión para acortar URLs</h3>
            <p class="text-sm text-muted-foreground mt-1">
              Autentícate con Google para crear y gestionar tus propias URLs acortadas.
            </p>
          </div>
          <Button
            @click="authStore.signIn"
            :disabled="authStore.isLoading"
            class="gap-2"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in con Google
          </Button>
        </div>
      </Card>
    </div>

    <!-- Formulario de acortamiento (solo autenticados) -->
    <div v-else class="hero-card w-full" style="max-width:680px">
      <Card class="rounded-2xl p-4 sm:p-5">
        <div class="flex items-center justify-between mb-2">
          <Label class="font-mono text-[10px] tracking-wider flex items-center gap-1.5 text-foreground">
            <svg class="w-3 h-3 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
            URL ORIGINAL
          </Label>
          <Badge variant="outline" class="font-mono text-[10px]">
            Autenticado
          </Badge>
        </div>

        <form @submit.prevent="handleShorten" class="flex flex-col sm:flex-row gap-2 mb-2.5">
          <Input
            v-model="urlInput"
            type="url"
            placeholder="https://ejemplo.com/pagina-muy-larga/con-parametros-largos..."
            class="flex-1 rounded-xl px-4 py-3 text-sm font-mono"
            @keydown.enter.prevent="handleShorten"
          />
          <Button
            type="submit"
            :disabled="isLoading"
            class="px-6 py-3 rounded-xl text-sm whitespace-nowrap w-full sm:w-auto"
          >
            <span v-if="!isLoading">Acortar →</span>
            <div v-else class="flex items-center gap-2">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Procesando
            </div>
          </Button>
        </form>

        <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-x-5">
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="customAlias = !customAlias"
              class="w-9 h-5 rounded-full toggle-track flex items-center px-0.5"
              :class="customAlias ? 'active' : ''"
            >
              <div class="w-4 h-4 rounded-full toggle-thumb" :class="customAlias ? 'active' : ''"></div>
            </button>
            <span class="font-mono text-[10px] tracking-wider text-foreground">ALIAS PERSONALIZADO</span>
          </div>

          <div class="w-full sm:flex-1 min-w-[140px] alias-field" :class="customAlias ? 'alias-field--open' : ''">
            <Input
              type="text"
              v-model="alias"
              @input="onAliasInput"
              @keydown.enter.prevent="handleShorten"
              maxlength="9"
              pattern="[a-z0-9]*"
              inputmode="text"
              placeholder="alias - máximo 9 caracteres (a-z0-9)"
              class="w-full rounded-lg px-3 py-1.5 text-sm font-mono"
            />
          </div>
        </div>
      </Card>

      <UrlResultCard
        v-if="shortUrl"
        ref="resultCard"
        :shortUrl="shortUrl"
        :originalUrl="originalUrl"
        :animating="cardAnimating"
        @copy="copyShortUrl"
        @close="shortUrl = ''; originalUrl = ''"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { Copy } from "lucide-vue-next";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import UrlResultCard from "@/components/shared/UrlResultCard.vue";
import { useUrlStore } from "@/stores/urlStore";
import { useAuthStore } from "@/stores/authStore";
import { useUrlShortener } from "@/composables/useUrlShortener";
import { useCopyToClipboard } from "@/composables/useCopyToClipboard";
import { getApiBaseUrl } from "@/api/http";
import { toast } from "vue-sonner";
import { z } from "zod";
import confetti from "canvas-confetti";

const urlStore = useUrlStore();
const authStore = useAuthStore();
const { shortenUrl, isLoading } = useUrlShortener();
const { copyToClipboard } = useCopyToClipboard();

const SERVICE_URL = getApiBaseUrl();

const urlInput = ref("");
const alias = ref("");
const originalUrl = ref("");
const resultCard = ref<HTMLElement | null>(null);
const cardAnimating = ref(false);

const onAliasInput = (e: Event) => {
	const val = (e.target as HTMLInputElement).value || "";
	alias.value = val.replace(/[^a-z0-9]/g, "").slice(0, 9);
};

const customAlias = ref(false);
const shortUrl = ref("");

const urlSchema = z
	.string()
	.nonempty({ message: "Ingresa una URL" })
	.url({ message: "Ingresa una URL válida" })
	.refine((val) => /^https?:\/\//i.test(val), {
		message: "Solo se permiten URLs con protocolo http(s)",
	});

const fireConfetti = () => {
	confetti({
		particleCount: 80,
		spread: 70,
		origin: { x: 0, y: 0.6 },
		angle: 60,
	});
	confetti({
		particleCount: 80,
		spread: 70,
		origin: { x: 1, y: 0.6 },
		angle: 120,
	});
	confetti({
		particleCount: 80,
		spread: 70,
		origin: { y: 0.6 },
	});
};

const handleShorten = async () => {
	const raw = (urlInput.value || "").trim();

	const parsed = urlSchema.safeParse(raw);
	if (!parsed.success) {
		const first = parsed.error.issues?.[0];
		toast.error(first?.message ?? "URL inválida");
		return;
	}

	const original = parsed.data;

	try {
		const result = await shortenUrl(original, alias.value || undefined);

		if (result.success) {
			shortUrl.value =
				(result as { shortUrl?: string; shortCode?: string }).shortUrl ??
				`${SERVICE_URL}/${(result as { shortCode?: string }).shortCode ?? result.shortUrl}`;
			originalUrl.value =
				(result as { originalUrl?: string }).originalUrl ?? original;
			urlInput.value = "";
			alias.value = "";
			customAlias.value = false;

			await nextTick();

			cardAnimating.value = true;
			const el =
				(resultCard.value as unknown as { $el?: HTMLElement })?.$el ??
				resultCard.value;
			if (el && typeof el.scrollIntoView === "function") {
				el.scrollIntoView({ behavior: "smooth", block: "center" });
			}
			setTimeout(() => (cardAnimating.value = false), 600);

			fireConfetti();
		}
	} catch (err: unknown) {
		toast.error(
			(err as { message?: string })?.message || "Error al acortar la URL",
		);
	}
};

const copyServiceUrl = () => {
	copyToClipboard(SERVICE_URL, "URL del servicio copiada");
};

const copyShortUrl = () => {
	copyToClipboard(shortUrl.value, "URL copiada al portapapeles");
};
</script>

<style scoped>
.toggle-track {
	background: var(--muted);
	border: 1px solid var(--border);
	transition: background 0.2s;
}

.toggle-track.active {
	background: color-mix(in srgb, var(--primary) 20%, transparent);
	border-color: color-mix(in srgb, var(--primary) 40%, transparent);
}

.toggle-thumb {
	background: var(--muted-foreground);
	transition: transform 0.2s, background 0.2s;
}

.toggle-thumb.active {
	background: var(--primary);
	transform: translateX(16px);
}

.alias-field {
	max-height: 0;
	overflow: hidden;
	transition: max-height 0.2s ease;
}

.alias-field--open {
	max-height: 80px;
}

@media (min-width: 640px) {
	.alias-field {
		max-height: none;
		overflow: visible;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s ease;
	}

	.alias-field--open {
		opacity: 1;
		pointer-events: auto;
	}
}

.hero-tag {
	animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both;
}

.hero-h1 {
	animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both;
}

.hero-sub {
	animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.22s both;
}

.hero-svc {
	animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
}

.hero-card {
	animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.38s both;
}

@keyframes slideUp {
	0% {
		opacity: 0;
		transform: translateY(20px);
	}
	100% {
		opacity: 1;
		transform: translateY(0);
	}
}

@media (prefers-reduced-motion: reduce) {
	.hero-tag,
	.hero-h1,
	.hero-sub,
	.hero-svc,
	.hero-card {
		animation: none;
		opacity: 1;
		transform: none;
	}
}
</style>
