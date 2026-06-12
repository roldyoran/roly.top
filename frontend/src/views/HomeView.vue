<template>
  <div class="min-h-screen flex flex-col relative">
    <!-- Top Bar -->
    <header class="sticky top-0 z-50 h-[62px] flex items-center justify-between px-7 border-b border-border/50 bg-background/88 backdrop-blur-[16px]">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-[9px] bg-primary flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_oklch(0.7 0.2 130/0.3)]">
          <Link class="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <span class="font-display font-800 text-[17px] tracking-tight">roly<span class="text-primary">.</span>top</span>
          <span class="block font-mono text-[11px] tracking-wider text-muted-foreground leading-none -mt-0.5">by roldyoran</span>
        </div>
      </div>

      <div class="flex items-center gap-1.5">
        <ThemeToggle />

        <a
          href="https://github.com/roldyoran/shorturl"
          target="_blank"
          class="hidden sm:inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-[13px] font-500"
        >
          <Github class="w-3.5 h-3.5" />
          <span class="font-mono text-[10px] tracking-wider">GITHUB</span>
        </a>

        <Button
          v-if="!authStore.isAuthenticated"
          variant="outline"
          size="sm"
          class="hidden sm:flex items-center gap-2 px-3 h-8 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50"
          :disabled="authStore.isLoading"
          @click="authStore.signIn"
        >
          <Google class="w-4 h-4" />
          <span class="font-mono text-[10px] tracking-wider">SIGN IN</span>
        </Button>

        <div v-if="authStore.isAuthenticated" class="hidden sm:flex items-center gap-2">
          <!-- Explicit Dashboard button for discoverability -->
          <router-link to="/dashboard" class="inline-flex">
            <Button variant="outline" size="sm" class="flex items-center gap-2 px-3 h-8">
              <LayoutDashboard class="w-4 h-4" />
              <span class="font-mono text-[10px] tracking-wider">Dashboard</span>
            </Button>
          </router-link>

          <router-link
            to="/dashboard"
            class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 hover:bg-muted transition-colors"
          >
            <img
              v-if="authStore.userImage"
              :src="authStore.userImage"
              :alt="authStore.userName"
              class="w-5 h-5 rounded-full"
            />
            <div v-else class="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
              <User class="w-3 h-3 text-primary" />
            </div>
            <span class="font-mono text-[10px] tracking-wider text-foreground max-w-[100px] truncate">
              {{ authStore.userName }}
            </span>
          </router-link>
          <Button
            variant="ghost"
            size="sm"
            class="w-9 h-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            @click="handleSignOut"
          >
            <LogOut class="w-4 h-4" />
          </Button>
        </div>

        <!-- Mobile menu -->
        <Button variant="ghost" size="sm" class="sm:hidden w-9 h-9 p-0 text-muted-foreground" @click="mobileMenuOpen = !mobileMenuOpen">
          <Menu class="w-4 h-4" />
        </Button>
      </div>
    </header>

    <!-- Mobile menu dropdown -->
    <div v-if="mobileMenuOpen" class="sm:hidden border-b border-border bg-card/95 backdrop-blur-sm px-4 py-3 space-y-2">
      <Button
        v-if="!authStore.isAuthenticated"
        variant="outline"
        class="w-full justify-start gap-2"
        :disabled="authStore.isLoading"
        @click="authStore.signIn(); mobileMenuOpen = false"
      >
        <Google class="w-4 h-4" />
        Iniciar sesión con Google
      </Button>
      <router-link
        v-if="authStore.isAuthenticated"
        to="/dashboard"
        class="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 bg-primary/5 text-primary text-sm"
        @click="mobileMenuOpen = false"
      >
        <LayoutDashboard class="w-4 h-4" />
        Dashboard
      </router-link>
      <a
        href="https://github.com/roldyoran/shorturl"
        target="_blank"
        class="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground"
      >
        <Github class="w-4 h-4" />
        GitHub
      </a>
    </div>

    <!-- Home content -->
    <main class="flex-grow relative z-10">
      <!-- Hero -->
      <section class="flex flex-col items-center justify-center px-6 pt-10 pb-14 relative overflow-hidden">
        <div class="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none" style="background: radial-gradient(ellipse at 50% 30%, oklch(0.7 0.02 130 / 0.02) 0%, oklch(0.7 0.02 130 / 0.01) 40%, transparent 70%);"></div>

        <motion.div
          class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-card border border-border text-[11px] font-mono text-muted-foreground mb-8"
          :initial="{ opacity: 0, y: 20, filter: 'blur(8px)' }"
          :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :transition="{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }"
        >
          <CloudflareWorkers class="w-4 h-4" />
          Powered by Cloudflare Workers
        </motion.div>

        <motion.h1
          class="font-display font-800 text-center leading-[0.9] mb-4 text-foreground text-[clamp(40px,6vw,80px)] tracking-[-0.04em]"
          :initial="{ opacity: 0, y: 20, filter: 'blur(8px)' }"
          :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :transition="{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.12 }"
        >
          Acorta tu URL<br><span class="text-primary" style="text-shadow: 0 0 40px oklch(0.7 0.18 130 / 0.45), 0 0 80px oklch(0.7 0.18 130 / 0.22);">al instante.</span>
        </motion.h1>

        <motion.p
          class="text-[15px] text-muted-foreground text-center max-w-[400px] mb-[52px] leading-relaxed"
          :initial="{ opacity: 0, y: 20, filter: 'blur(8px)' }"
          :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :transition="{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.22 }"
        >
            Simple · Rápido · Gratis · Construido sobre infraestructura Edge
        </motion.p>

        <!-- Terminal Shortener Card -->
        <motion.div
          class="shortener-card w-full max-w-[640px]"
          :initial="{ opacity: 0, y: 20, filter: 'blur(8px)' }"
          :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :transition="{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.38 }"
        >
          <div class="sc-titlebar">
            <span class="sc-dot sc-dot-red"></span>
            <span class="sc-dot sc-dot-yellow"></span>
            <span class="sc-dot sc-dot-green"></span>
            <span class="sc-title-text">roly.top — acortador de URLs</span>
          </div>
          <div class="sc-body">
            <div v-if="!authStore.isAuthenticated" class="text-center py-4">
              <p class="text-sm text-muted-foreground mb-3">Inicia sesión para comenzar a acortar URLs</p>
              <Button
                variant="outline"
                size="sm"
                class="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                :disabled="authStore.isLoading"
                @click="authStore.signIn"
              >
                <Google class="w-4 h-4" />
                Iniciar sesión
              </Button>
            </div>

            <template v-else>
              <div v-if="hasReachedLimit" class="mb-3.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p class="text-sm text-destructive font-medium">
                  Has alcanzado el límite de {{ urlStore.urlLimit }} URLs. Elimina una antes de crear otra.
                </p>
              </div>

              <div class="terminal-row">
                <span class="terminal-prompt">
                  roly.top/
                  <span class="terminal-cursor"></span>
                </span>
                <input
                  ref="urlInputRef"
                  v-model="urlInput"
                  class="flex-1 h-[46px] px-3.5 bg-transparent border-none outline-none text-foreground font-mono text-[13px] placeholder:text-muted-foreground"
                  type="url"
                  placeholder="pega tu URL larga aquí..."
                  autocomplete="off"
                  spellcheck="false"
                  :disabled="hasReachedLimit"
                  @keydown.enter="handleShorten"
                />
                <button
                  class="shorten-btn"
                  :disabled="isLoading || hasReachedLimit"
                  @click="handleShorten"
                >
                  {{ isLoading ? 'Procesando...' : 'Acortar →' }}
                </button>
              </div>

              <div class="flex items-center justify-between gap-3 flex-wrap">
                <label class="flex items-center gap-2 cursor-pointer">
                  <Switch v-model="customAlias" />
                  <span class="text-xs text-muted-foreground font-500">Alias personalizado</span>
                </label>
                <span class="font-mono text-[11px] text-muted-foreground">
                  <span class="text-primary">{{ urlStore.urlCount }}</span> / {{ urlStore.urlLimit }} enlaces usados
                </span>
              </div>

              <div class="overflow-hidden max-h-0 opacity-0 transition-all duration-200" :class="customAlias ? 'max-h-[52px] opacity-100 mt-2.5' : ''">
                <input
                  v-model="alias"
                  class="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground font-mono text-xs outline-none transition-colors focus:border-primary focus:shadow-[0_0_0_3px_oklch(0.7 0.2_130/0.15)] placeholder:text-muted-foreground"
                  type="text"
                  placeholder="mi-alias (a-z 0-9, máx 9 caracteres)"
                  maxlength="9"
                  @input="onAliasInput"
                  @keydown.enter="handleShorten"
                />
              </div>

              <div v-if="shortUrl" ref="resultCardRef" class="mt-3 p-3.5 bg-primary/5 border border-primary/20 rounded-[10px] flex items-center gap-3" :class="resultLeaving ? 'animate-slide-out' : 'animate-slide-in'">
                <div class="flex-1 min-w-0">
                  <a class="font-mono text-sm font-700 text-primary block" href="#">{{ shortUrl }}</a>
                  <p class="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">{{ originalUrl }}</p>
                </div>
                <Button size="sm" class="bg-primary text-primary-foreground font-display font-700" @click="copyShortUrl">Copiar</Button>
                <Button variant="ghost" size="sm" class="w-7 h-7 p-0 text-muted-foreground" @click="dismissResult">
                  <X class="w-3.5 h-3.5" />
                </Button>
              </div>
            </template>
          </div>
        </motion.div>
      </section>

      <!-- Stats Strip -->
      <div class="stats-strip">
        <div class="stat-strip-item">
          <div class="stat-strip-num">{{ publicStats.publicUrls }}</div>
          <div class="stat-strip-label">enlaces públicos creados</div>
        </div>
        <div class="stat-strip-item">
          <div class="stat-strip-num">{{ publicStats.totalRedirects.toLocaleString() }}</div>
          <div class="stat-strip-label">redirecciones totales</div>
        </div>
        <div class="stat-strip-item">
          <div class="stat-strip-num">&lt;20ms</div>
          <div class="stat-strip-label">latencia promedio</div>
        </div>
        <div class="stat-strip-item hide-mobile">
          <div class="stat-strip-num">99.9%</div>
          <div class="stat-strip-label">uptime últimos 30 días</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="public-tabs">
        <div class="public-tabs-inner">
          <button class="pub-tab" :class="{ active: activeTab === 'list' }" @click="activeTab = 'list'">
            <List class="w-[14px] h-[14px]" />
            URLs públicas
            <span v-if="publicStats.publicUrls > 0" class="tab-count">{{ publicStats.publicUrls }}</span>
          </button>
          <button class="pub-tab" :class="{ active: activeTab === 'qr' }" @click="activeTab = 'qr'">
            <QrCode class="w-[14px] h-[14px]" />
            Generador QR
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="max-w-[1100px] mx-auto px-7 py-8 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            v-if="activeTab === 'list'"
            key="list"
            :initial="{ opacity: 0, y: 16 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -10 }"
            :transition="{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }"
          >
            <UrlsList mode="public" />
          </motion.div>
          <motion.div
            v-else-if="activeTab === 'qr'"
            key="qr"
            :initial="{ opacity: 0, y: 16 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -10 }"
            :transition="{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }"
          >
            <QrGenerator />
          </motion.div>
          <motion.div
            v-else-if="activeTab === 'myurls'"
            key="myurls"
            :initial="{ opacity: 0, y: 16 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -10 }"
            :transition="{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }"
          >
            <UrlsList mode="my" />
          </motion.div>
          <motion.div
            v-else-if="activeTab === 'info'"
            key="info"
            :initial="{ opacity: 0, y: 16 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -10 }"
            :transition="{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }"
          >
            <UrlInfoForm />
          </motion.div>
        </AnimatePresence>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-border bg-background/95 py-4 mt-auto">
      <div class="max-w-[1100px] mx-auto px-7 flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Link class="w-3 h-3 text-primary-foreground" />
            </div>
            <span class="font-display text-[13px] font-800">roly.top</span>
          </div>
          <span class="text-[11px] text-muted-foreground font-mono">&copy; {{ currentYear }} roldyoran</span>
        </div>
        <div class="flex items-center gap-5">
          <a href="https://github.com/roldyoran/shorturl" target="_blank" class="text-[12px] text-muted-foreground hover:text-primary transition-colors">Código abierto</a>
          <span class="text-[12px] text-muted-foreground">Privacidad</span>
          <span class="text-[12px] text-muted-foreground">Términos</span>
          <div class="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/15 text-primary text-[10px] font-mono">
            <span class="w-[4px] h-[4px] rounded-full bg-primary animate-pulse"></span>
            Operativo
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import confetti from "canvas-confetti";
import {
	Github,
	LayoutDashboard,
	Link,
	List,
	LogOut,
	Menu,
	QrCode,
	User,
	X,
} from "lucide-vue-next";
import Google from "@/assets/google.vue";
import CloudflareWorkers from "@/assets/cloudflare-workers.vue";
import { AnimatePresence, motion } from "motion-v";
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { z } from "zod";
import {
	getAppBaseUrl,
	getPublicStatsRequest,
	getUrlsRequest,
} from "@/api/http";
import QrGenerator from "@/components/features/qr-generator/QrGenerator.vue";
import UrlInfoForm from "@/components/features/url-info/UrlInfoForm.vue";
import UrlsList from "@/components/features/urls/UrlsList.vue";
import { Switch } from "@/components/ui/switch";
import ThemeToggle from "@/components/layout/ThemeToggle.vue";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/composables/useAuth";
import { useCopyToClipboard } from "@/composables/useCopyToClipboard";
import { useSeo } from "@/composables/useSeo";
import { useUrlShortener } from "@/composables/useUrlShortener";
import { useAuthStore } from "@/stores/authStore";
import { useUrlStore } from "@/stores/urlStore";

useSeo({
	title: "Acortador de URLs",
	description: "Acorta tus URLs de forma rapida y gratuita.",
	jsonLd: {
		"@context": "https://schema.org",
		"@type": "WebApplication",
		name: "roly.top",
		url: "https://roly.top",
		description: "Acorta tus URLs de forma rapida y gratuita.",
		applicationCategory: "UtilitiesApplication",
		operatingSystem: "Web",
		offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
	},
});

const router = useRouter();
const authStore = useAuthStore();
const urlStore = useUrlStore();
const { shortenUrl, isLoading } = useUrlShortener();
const { copyToClipboard } = useCopyToClipboard();
const { fetchSession: _fetchSession } = useAuth();

const mobileMenuOpen = ref(false);
const urlInput = ref("");
const alias = ref("");
const originalUrl = ref("");
const shortUrl = ref("");
const customAlias = ref(false);
const urlInputRef = ref<HTMLInputElement | null>(null);
const resultCardRef = ref<HTMLDivElement | null>(null);
const resultLeaving = ref(false);

const publicStats = reactive({ publicUrls: 0, totalRedirects: 0 });

const currentYear = computed(() =>
	new Intl.DateTimeFormat("es-ES", { year: "numeric" }).format(new Date()),
);

const hasReachedLimit = computed(
	() => !authStore.isAdmin && urlStore.urlCount >= urlStore.urlLimit,
);

const activeTab = ref<"list" | "qr" | "myurls" | "info">("list");

const urlSchema = z
	.string()
	.nonempty({ message: "Ingresa una URL" })
	.url({ message: "Ingresa una URL valida" })
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
	confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
};

const onAliasInput = (e: Event) => {
	const val = (e.target as HTMLInputElement).value || "";
	alias.value = val.replace(/[^a-z0-9]/g, "").slice(0, 9);
};

async function handleShorten() {
	const raw = (urlInput.value || "").trim();
	const parsed = urlSchema.safeParse(raw);
	if (!parsed.success) {
		const first = parsed.error.issues?.[0];
		toast.error(first?.message ?? "URL invalida");
		return;
	}
	const original = parsed.data;
	try {
		const result = await shortenUrl(original, alias.value || undefined);
		if (result.success) {
			shortUrl.value =
				(result as { shortUrl?: string; shortCode?: string }).shortUrl ??
				`${getAppBaseUrl()}/${(result as { shortCode?: string }).shortCode ?? result.shortUrl}`;
			originalUrl.value =
				(result as { originalUrl?: string }).originalUrl ?? original;
			urlInput.value = "";
			alias.value = "";
			customAlias.value = false;
			await nextTick();
			resultCardRef.value?.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
			fireConfetti();
		} else if (result.error) {
			toast.error(result.error);
		}
	} catch (err: unknown) {
		toast.error(
			(err as { message?: string })?.message || "Error al acortar la URL",
		);
	}
}

function copyShortUrl() {
	copyToClipboard(shortUrl.value, "URL copiada al portapapeles");
}

function dismissResult() {
	resultLeaving.value = true;
	setTimeout(() => {
		shortUrl.value = "";
		originalUrl.value = "";
		resultLeaving.value = false;
	}, 200);
}

async function handleSignOut() {
	try {
		await authStore.signOut();
	} catch {
		// Silenciar error
	} finally {
		authStore.resetAuth();
		router.push({ name: "home" });
		toast.success("Sesion cerrada", {
			description: "Has cerrado sesion correctamente.",
		});
	}
}

onMounted(async () => {
	// Inicializar authStore antes de inicializar urlStore con userId
	// fetchSession() es el helper bajo useAuth y authStore.initialize() ya llama a fetchSession
	try {
		await authStore.initialize();
	} catch (e) {
		console.error("Error initializing authStore:", e);
	}

	// Ahora que authStore tiene userId (si está autenticado), inicializamos urlStore con el userId
	urlStore.initialize(authStore.userId ?? undefined);

	// Sincronizar con el backend: obtener lista y límite real si el usuario está autenticado
	if (authStore.isAuthenticated) {
		try {
			const res = await getUrlsRequest();
			if (res && typeof res === "object") {
				// Establecer límite y actualizar la lista local en caso de que difiera
				if ("urlLimit" in res) urlStore.setUrlLimit(res.urlLimit);
				if (Array.isArray((res as any).urls)) {
					// actualizar store local y caché si es necesario
					const urls = (res as any).urls as any[];
					// Reemplazamos savedUrls en el store con los del servidor
					urlStore.clearAllUrls();
					urls.forEach((u: any) => urlStore.addUrl(u.originalUrl, u.shortCode));
				}
			}
		} catch (e) {
			console.error("Error fetching user urls for init:", e);
		}
	}

	try {
		const stats = await getPublicStatsRequest();
		publicStats.publicUrls = stats.publicUrls;
		publicStats.totalRedirects = stats.totalRedirects;
	} catch {
		// Silenciar error - stats son opcionales
	}
});
</script>

<style scoped>
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-6px); }
}
.animate-slide-in { animation: slideIn 0.2s ease; }
.animate-slide-out { animation: slideOut 0.2s ease forwards; }

.font-800 { font-weight: 800; }

/* Reduce hero gradient prominence in this view to avoid color wash over the headline */
:root.dark-mode {
  --background: #090909;
}
</style>
