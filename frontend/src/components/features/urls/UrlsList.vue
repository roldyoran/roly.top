<template>
  <TooltipProvider>
    <Card>
      <CardHeader>
        <div v-if="isMyList" class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <CardTitle class="flex items-center gap-3">
              <Database class="w-6 h-6" />
              Mis URLs
            </CardTitle>
          </div>
          <Button
            @click="confirmClearUrls"
            variant="destructive"
            size="sm"
            :disabled="normalizedMyUrls.length === 0"
          >
            <Trash class="w-4 h-4 mr-2" />
            Borrar Todo
          </Button>
        </div>

        <div v-else class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle class="flex items-center gap-3">
              <Globe class="w-6 h-6" />
              Lista Pública de URLs
            </CardTitle>
            <CardDescription>Todas las URLs acortadas públicamente</CardDescription>
          </div>

          <div class="relative w-full sm:w-80">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar URLs..."
              class="pl-10"
            />
          </div>
        </div>

        <CardDescription v-if="isMyList">
          Tus URLs acortadas ({{ normalizedMyUrls.length }})
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div v-if="!isMyList && isLoading" class="text-center py-12">
          <div class="flex flex-col items-center space-y-4">
            <svg class="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div class="space-y-2">
              <p class="text-lg font-semibold">Cargando URLs...</p>
              <p class="text-muted-foreground">Obteniendo las URLs más recientes</p>
            </div>
          </div>
        </div>

        <div v-else-if="isMyList && !authStore.isAuthenticated" class="text-center py-12">
          <Database class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 class="text-lg font-semibold mb-2">Inicia sesión para ver tus URLs</h3>
          <p class="text-muted-foreground mb-4">Accede a tu cuenta para gestionar tus URLs acortadas</p>
          <Button @click="authStore.signIn" class="gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Iniciar sesión con Google
          </Button>
        </div>

        <div v-else-if="isMyList && normalizedMyUrls.length === 0" class="text-center py-12">
          <Database class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 class="text-lg font-semibold mb-2">No hay URLs guardadas</h3>
          <p class="text-muted-foreground">Las URLs acortadas aparecerán aquí automáticamente</p>
        </div>

        <div v-else-if="!isMyList && shortUrls.length === 0" class="text-center py-12">
          <Globe class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 class="text-lg font-semibold mb-2">No hay URLs disponibles</h3>
          <p class="text-muted-foreground">Las URLs aparecerán aquí una vez que sean creadas</p>
        </div>

        <div v-else-if="!isMyList && filteredUrls.length === 0" class="text-center py-12">
          <Search class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 class="text-lg font-semibold mb-2">No se encontraron resultados</h3>
          <p class="text-muted-foreground">Intenta con otros términos de búsqueda</p>
        </div>

        <motion.div
          v-else
          class="space-y-2"
          :class="shouldUseScroll ? 'max-h-[70vh] overflow-y-auto pr-1 scroll-container' : ''"
          initial="hidden"
          animate="visible"
          :variants="listContainerVariants"
        >
          <motion.div
            v-for="url in displayUrls"
            :key="`${url.shortCode}-${url.originalUrl}`"
            :variants="listItemVariants"
            class="url-item rounded-xl border border-border bg-card px-4 py-3 flex flex-col gap-0.5 transition-colors hover:bg-muted/40"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="font-mono text-xl font-semibold text-primary tracking-tight">
                /{{ url.shortCode }}
              </span>

              <div class="flex items-center gap-3 ml-auto">
                <div class="flex items-center gap-1.5 text-muted-foreground">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="2" y="14" width="4" height="7" rx="1"/>
                    <rect x="9" y="9" width="4" height="12" rx="1"/>
                    <rect x="16" y="4" width="4" height="17" rx="1"/>
                  </svg>
                  <span class="font-mono text-xs">{{ url.clicks || 0 }} clicks</span>
                </div>

                <div class="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger :asChild="true">
                      <Button @click="copyFullUrl(url.shortCode)" variant="ghost" size="sm" class="h-7 w-7 p-0">
                        <Copy class="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copiar URL</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger :asChild="true">
                      <Button @click="generateQR(url.shortCode)" variant="ghost" size="sm" class="h-7 w-7 p-0">
                        <QrCode class="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Generar QR</TooltipContent>
                  </Tooltip>

                  <Tooltip v-if="!isMyList">
                    <TooltipTrigger :asChild="true">
                      <Button
                        @click="openExternal(getFullShortUrl(url.shortCode))"
                        variant="ghost"
                        size="sm"
                        class="h-7 w-7 p-0"
                      >
                        <ExternalLink class="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Abrir en nueva pestaña</TooltipContent>
                  </Tooltip>

                  <Tooltip v-else>
                    <TooltipTrigger :asChild="true">
                      <Button
                        @click="removeUrl(url.shortCode)"
                        variant="ghost"
                        size="sm"
                        class="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash class="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Eliminar</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            <span class="font-mono text-sm text-muted-foreground truncate">
              {{ truncateText(url.originalUrl, 60) }}
            </span>

            <div class="flex justify-end mt-1">
              <span class="font-mono text-xs text-muted-foreground/60">
                {{ formatDate(url.createdAt) }}
              </span>
            </div>
          </motion.div>
        </motion.div>

        <div v-if="isMyList && totalPages > 1" class="flex items-center justify-between mt-4">
          <p class="text-sm text-muted-foreground">
            Página {{ currentPage }} de {{ totalPages }}
          </p>
          <div class="flex items-center gap-2">
            <Button
              @click="previousPage"
              :disabled="currentPage === 1"
              variant="outline"
              size="sm"
            >
              <ChevronLeft class="w-4 h-4" />
            </Button>

            <div class="flex gap-1">
              <Button
                v-for="page in visiblePages"
                :key="page"
                @click="currentPage = page"
                :variant="currentPage === page ? 'default' : 'outline'"
                size="sm"
                class="w-8 h-8 p-0"
              >
                {{ page }}
              </Button>
            </div>

            <Button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              variant="outline"
              size="sm"
            >
              <ChevronRight class="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Dialog :open="showQRModal" @update:open="showQRModal = $event">
          <DialogContent class="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Código QR</DialogTitle>
              <DialogDescription>
                Escanea este código para acceder a: {{ currentQRUrl }}
              </DialogDescription>
            </DialogHeader>
            <div class="flex items-center justify-center py-4">
              <canvas ref="qrCanvas" class="border rounded-lg"></canvas>
            </div>
            <div class="flex justify-center">
              <Button @click="downloadQR" variant="outline">
                <Download class="w-4 h-4 mr-2" />
                Descargar QR
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog v-if="isMyList" :open="showDeleteUrlDialog" @update:open="showDeleteUrlDialog = $event">
          <DialogContent class="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Eliminar URL</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres eliminar esta URL? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button @click="showDeleteUrlDialog = false" variant="outline">Cancelar</Button>
              <Button @click="confirmDeleteUrl" variant="destructive">Eliminar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog v-if="isMyList" :open="showClearAllDialog" @update:open="showClearAllDialog = $event">
          <DialogContent class="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Borrar todas las URLs</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres borrar todo el historial de URLs? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button @click="showClearAllDialog = false" variant="outline">Cancelar</Button>
              <Button @click="confirmClearAllUrls" variant="destructive">Borrar Todo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import {
	Database,
	Trash,
	Globe,
	Search,
	ExternalLink,
	Copy,
	QrCode,
	Download,
	ChevronLeft,
	ChevronRight,
} from "lucide-vue-next";
import { motion } from "motion-v";
import { useQuery } from "@tanstack/vue-query";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
	TooltipProvider,
} from "@/components/ui/tooltip";
import QRCode from "qrcode-generator";
import {
	getUrlsRequest,
	getPublicUrlsRequest,
	deleteUrlRequest,
	getAppBaseUrl,
} from "@/api/http";
import { useCopyToClipboard } from "@/composables/useCopyToClipboard";
import { useUrlStore } from "@/stores/urlStore";
import { useAuthStore } from "@/stores/authStore";
import { formatDate, truncateText } from "@/lib/utils";
import type { UrlInfoResponse } from "@/api/types";
import { toast } from "vue-sonner";

type Mode = "my" | "public";

type SavedUrl = {
	original: string;
	short: string;
	date: string;
	clicks?: number;
	visits?: number;
};

type NormalizedUrl = {
	shortCode: string;
	originalUrl: string;
	createdAt: string;
	clicks: number;
	raw: SavedUrl | UrlInfoResponse;
};

const props = withDefaults(defineProps<{ mode?: Mode }>(), {
	mode: "my",
});

const isMyList = computed(() => props.mode === "my");

const urlStore = useUrlStore();
const authStore = useAuthStore();
const { copyToClipboard } = useCopyToClipboard();

// Public list state
const shortUrls = ref<UrlInfoResponse[]>([]);
const myUrls = ref<UrlInfoResponse[]>([]);
const searchQuery = ref<string>("");
const isLoading = ref<boolean>(false);

// Pagination state (my list)
const currentPage = ref(1);
const itemsPerPage = 10;

// QR modal state
const showQRModal = ref(false);
const qrCanvas = ref<HTMLCanvasElement>();
const currentQRUrl = ref<string>("");

// Confirmation dialogs (my list)
const showDeleteUrlDialog = ref(false);
const showClearAllDialog = ref(false);
const urlToDelete = ref<string | null>(null);

// Computed: normalize lists
const publicClicksByShort = computed(() => {
	const map = new Map<string, number>();
	for (const url of shortUrls.value) {
		map.set(url.shortCode, url.visits || 0);
	}
	return map;
});

const normalizedMyUrls = computed<NormalizedUrl[]>(() => {
	if (myUrls.value.length > 0) {
		return myUrls.value.map((url) => ({
			shortCode: url.shortCode,
			originalUrl: url.originalUrl,
			createdAt: url.createdAt,
			clicks: url.visits || 0,
			raw: url,
		}));
	}
	return urlStore.savedUrls.map((url: SavedUrl) => {
		const savedClicks = url.clicks ?? url.visits;
		const clicks = savedClicks ?? publicClicksByShort.value.get(url.short) ?? 0;
		return {
			shortCode: url.short,
			originalUrl: url.original,
			createdAt: url.date,
			clicks,
			raw: url,
		};
	});
});

const normalizedPublicUrls = computed<NormalizedUrl[]>(() =>
	shortUrls.value.map((url) => ({
		shortCode: url.shortCode,
		originalUrl: url.originalUrl,
		createdAt: url.createdAt,
		clicks: url.visits || 0,
		raw: url,
	})),
);

const filteredUrls = computed(() => {
	if (!searchQuery.value.trim()) {
		return normalizedPublicUrls.value;
	}
	const query = searchQuery.value.toLowerCase();
	return normalizedPublicUrls.value.filter(
		(url) =>
			url.shortCode.toLowerCase().includes(query) ||
			url.originalUrl.toLowerCase().includes(query),
	);
});

const totalPages = computed(() =>
	Math.ceil(normalizedMyUrls.value.length / itemsPerPage),
);

const paginatedUrls = computed(() => {
	const start = (currentPage.value - 1) * itemsPerPage;
	const end = start + itemsPerPage;
	return normalizedMyUrls.value.slice(start, end);
});

const visiblePages = computed(() => {
	const pages: number[] = [];
	const maxVisible = 5;
	let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
	let end = Math.min(totalPages.value, start + maxVisible - 1);
	if (end - start + 1 < maxVisible) {
		start = Math.max(1, end - maxVisible + 1);
	}
	for (let i = start; i <= end; i++) {
		pages.push(i);
	}
	return pages;
});

const displayUrls = computed(() =>
	isMyList.value ? paginatedUrls.value : filteredUrls.value,
);

const shouldUseScroll = computed(() => {
	if (isMyList.value) {
		return normalizedMyUrls.value.length > itemsPerPage;
	}
	return filteredUrls.value.length > 8;
});

const listContainerVariants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.04,
		},
	},
};

const listItemVariants = {
	hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
	visible: {
		opacity: 1,
		y: 0,
		filter: "blur(0px)",
		transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
	},
};

const getFullShortUrl = (shortCode: string): string => {
	return `${getAppBaseUrl()}/${shortCode}`;
};

const copyFullUrl = (shortCode: string) => {
	copyToClipboard(getFullShortUrl(shortCode), "URL completa copiada");
};

const openExternal = (url: string) => {
	window.open(url, "_blank");
};

const removeUrl = (shortCode: string) => {
	urlToDelete.value = shortCode;
	showDeleteUrlDialog.value = true;
};

const queryClient = useQueryClient();

const deleteUrlMutation = useMutation<
	void,
	unknown,
	string,
	{ previousMyUrls: any[] }
>({
	mutationFn: async (shortCode: string) => {
		return await deleteUrlRequest(shortCode);
	},
	onMutate: async (shortCode: string) => {
		await queryClient.cancelQueries({ queryKey: ["userUrls"] });
		const previousMyUrls = myUrls.value
			? JSON.parse(JSON.stringify(myUrls.value))
			: [];
		// Optimistically remove from local UI and store
		myUrls.value = myUrls.value.filter((u) => u.shortCode !== shortCode);
		try {
			urlStore.removeUrl("", shortCode);
		} catch (e) {
			/* ignore */
		}
		return { previousMyUrls };
	},
	onError: (err: unknown, _shortCode: string, context: any) => {
		if (context?.previousMyUrls) myUrls.value = context.previousMyUrls;
		console.error("deleteUrlMutation error:", err);
	},
	onSettled: () => {
		queryClient.invalidateQueries({ queryKey: ["userUrls"] });
		queryClient.invalidateQueries({ queryKey: ["publicUrls"] });
	},
});

const confirmDeleteUrl = async () => {
	if (!urlToDelete.value) return;
	const shortCode = urlToDelete.value;
	try {
		await deleteUrlMutation.mutateAsync(shortCode);
		if (paginatedUrls.value.length === 0 && currentPage.value > 1) {
			currentPage.value--;
		}
		toast.success("URL eliminada", {
			description: "La URL ha sido eliminada correctamente",
		});
	} catch (error: any) {
		const message =
			error?.response?.data?.message || "Error al eliminar la URL";
		toast.error("Error al eliminar", { description: message });
	} finally {
		showDeleteUrlDialog.value = false;
		urlToDelete.value = null;
	}
};

const confirmClearUrls = () => {
	showClearAllDialog.value = true;
};

const confirmClearAllUrls = () => {
	urlStore.clearAllUrls();
	currentPage.value = 1;
	showClearAllDialog.value = false;
	toast.warning("Historial borrado", {
		description: "Se ha eliminado todo el historial de URLs",
	});
};

const previousPage = () => {
	if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
	if (currentPage.value < totalPages.value) currentPage.value++;
};

// QR Code functions
const generateQR = (shortCode: string) => {
	const fullUrl = getFullShortUrl(shortCode);
	currentQRUrl.value = fullUrl;
	showQRModal.value = true;
	setTimeout(() => {
		createQRCode(fullUrl);
	}, 100);
};

const createQRCode = (url: string) => {
	if (!qrCanvas.value) return;

	const qr = QRCode(0, "M");
	qr.addData(url);
	qr.make();

	const canvas = qrCanvas.value;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	const moduleCount = qr.getModuleCount();
	const moduleSize = 6;
	const margin = 4;
	canvas.width = canvas.height = moduleCount * moduleSize + margin * 2;

	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "#000000";
	const offset = margin;
	for (let y = 0; y < moduleCount; y++) {
		for (let x = 0; x < moduleCount; x++) {
			if (qr.isDark(y, x)) {
				ctx.fillRect(
					offset + x * moduleSize,
					offset + y * moduleSize,
					moduleSize,
					moduleSize,
				);
			}
		}
	}
};

const downloadQR = () => {
	if (!qrCanvas.value) {
		toast.error("Error", {
			description: "No se encontró el código QR",
		});
		return;
	}
	try {
		const dataUrl = qrCanvas.value.toDataURL("image/png");
		const cleanUrl = currentQRUrl.value
			.replace(/^https?:\/\//, "")
			.replace(/\//g, "-")
			.slice(0, 50);
		const fileName = `qr-${cleanUrl || "codigo"}.png`;
		const link = document.createElement("a");
		link.download = fileName;
		link.href = dataUrl;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		toast.success("QR descargado", {
			description: "El código QR se ha descargado correctamente",
		});
	} catch (error) {
		console.error("Error al descargar el QR:", error);
		toast.error("Error al descargar", {
			description: "No se pudo descargar el código QR",
		});
	}
};

// Integración con Vue Query para lista pública
const PUBLIC_TTL = 5 * 60 * 1000;

const cachedPublic = urlStore.loadPublicCache
	? urlStore.loadPublicCache()
	: null;
if (cachedPublic && cachedPublic.length > 0) {
	shortUrls.value = cachedPublic.sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
}

const publicQuery = useQuery({
	queryKey: ["publicUrls"],
	queryFn: async ({ signal }: any) => {
		const res = await getPublicUrlsRequest(signal);
		return res;
	},
	enabled: computed(() => !isMyList.value),
	staleTime: PUBLIC_TTL,
	gcTime: PUBLIC_TTL * 2,
	refetchOnWindowFocus: false,
	initialData: cachedPublic ?? undefined,
});

watch(publicQuery.data, (data: any) => {
	if (data) {
		if (Array.isArray(data)) {
			shortUrls.value = [...data].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
			urlStore.savePublicCache && urlStore.savePublicCache(shortUrls.value);
			urlStore.updatePublicListFetchTime();
		} else {
			shortUrls.value = [];
		}
	}
}, { immediate: true });

watch(publicQuery.error, (err: any) => {
	if (err) console.error("Error fetching public urls:", err);
});

// Query para las URLs del usuario autenticado (my URLs)
const userKey = computed(() => ["userUrls", authStore.userId]);

const userQuery = useQuery({
	queryKey: userKey,
	queryFn: async ({ signal }: any) => {
		// backend devuelve { urls: UrlInfoResponse[], urlLimit }
		const res = await getUrlsRequest(signal);
		return res;
	},
	enabled: computed(() => isMyList.value && authStore.isAuthenticated),
	staleTime: PUBLIC_TTL,
	gcTime: PUBLIC_TTL * 2,
	refetchOnWindowFocus: false,
});

watch(userQuery.data, (data: any) => {
	if (data) {
		if (data && typeof data === "object" && "urls" in data) {
			const { urls, urlLimit } = data;
			urlStore.setUrlLimit(urlLimit);
			if (Array.isArray(urls)) {
				myUrls.value = [...urls].sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
				);
			} else {
				myUrls.value = [];
			}
		} else {
			myUrls.value = [];
		}
	}
}, { immediate: true });

watch(userQuery.error, (err: any) => {
	if (err) console.error("Error fetching user urls:", err);
});

// onMounted: Vue Query maneja las cargas automáticas para public/user URLs a través de `enabled`.
onMounted(() => {
	// No es necesario forzar fetch: useQuery maneja inicialización.
});

watch(isMyList, (value) => {
	if (!value) {
		// switched to public list: refetch public query if needed
		if (shortUrls.value.length === 0) {
			publicQuery.refetch();
		}
	} else {
		// switched to my list: refetch user query if authenticated
		if (authStore.isAuthenticated && myUrls.value.length === 0) {
			userQuery.refetch();
		}
	}
});
</script>

<style scoped>
.scroll-container {
  scrollbar-gutter: stable;
}

.scroll-container::-webkit-scrollbar {
  width: 6px;
}
.scroll-container::-webkit-scrollbar-track {
  background: transparent;
}
.scroll-container::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 4px;
}
.scroll-container::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.4);
}
</style>
