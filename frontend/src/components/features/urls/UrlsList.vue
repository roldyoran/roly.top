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
            :disabled="urlStore.savedUrls.length === 0"
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
          Tus URLs acortadas guardadas localmente ({{ urlStore.savedUrls.length }})
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

        <div v-else-if="isMyList && urlStore.savedUrls.length === 0" class="text-center py-12">
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
                        @click="removeUrl((url.raw as SavedUrl).original, (url.raw as SavedUrl).short)"
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
const urlToDelete = ref<{ original: string; short: string } | null>(null);

// Computed: normalize lists
const publicClicksByShort = computed(() => {
	const map = new Map<string, number>();
	for (const url of shortUrls.value) {
		map.set(url.shortCode, url.visits || 0);
	}
	return map;
});

const normalizedMyUrls = computed<NormalizedUrl[]>(() =>
	urlStore.savedUrls.map((url: SavedUrl) => {
		const savedClicks = url.clicks ?? url.visits;
		const clicks = savedClicks ?? publicClicksByShort.value.get(url.short) ?? 0;
		return {
			shortCode: url.short,
			originalUrl: url.original,
			createdAt: url.date,
			clicks,
			raw: url,
		};
	}),
);

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

const removeUrl = (original: string, short: string) => {
	urlToDelete.value = { original, short };
	showDeleteUrlDialog.value = true;
};

const confirmDeleteUrl = () => {
	if (urlToDelete.value) {
		urlStore.removeUrl(urlToDelete.value.original, urlToDelete.value.short);
		if (paginatedUrls.value.length === 0 && currentPage.value > 1) {
			currentPage.value--;
		}
		toast.success("URL eliminada", {
			description: "La URL ha sido eliminada correctamente",
		});
	}
	showDeleteUrlDialog.value = false;
	urlToDelete.value = null;
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

const loadUrls = async () => {
	if (!urlStore.shouldFetchPublicList() && shortUrls.value.length > 0) {
		return;
	}

	if (isMyList.value && !authStore.isAuthenticated) {
		shortUrls.value = [];
		return;
	}

	isLoading.value = true;
	try {
		const response = isMyList.value
			? await getUrlsRequest()
			: await getPublicUrlsRequest();

		if (
			isMyList.value &&
			response &&
			typeof response === "object" &&
			"urls" in response
		) {
			// Respuesta del nuevo formato: { urls: UrlInfoResponse[], urlLimit: number }
			const { urls, urlLimit } = response;
			urlStore.setUrlLimit(urlLimit);
			if (Array.isArray(urls)) {
				shortUrls.value = urls.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
				);
				urlStore.updatePublicListFetchTime();
				toast.success("URLs cargadas", {
					description: "Lista de URLs actualizada correctamente",
				});
			} else {
				shortUrls.value = [];
				toast.warning("Sin URLs", {
					description: "No se encontraron URLs disponibles",
				});
			}
		} else if (Array.isArray(response)) {
			// Respuesta del formato antiguo (para URLs públicas)
			shortUrls.value = response.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
			urlStore.updatePublicListFetchTime();
			toast.success("URLs cargadas", {
				description: "Lista de URLs actualizada correctamente",
			});
		} else {
			shortUrls.value = [];
			toast.warning("Sin URLs", {
				description: "No se encontraron URLs disponibles",
			});
		}
	} catch (error: any) {
		console.error("Error loading URLs:", error);
		const errorMessage =
			error?.response?.data?.message || "Error al cargar las URLs";
		toast.error("Error al cargar", {
			description: errorMessage,
		});
		shortUrls.value = [];
	} finally {
		isLoading.value = false;
	}
};

onMounted(() => {
	if (!isMyList.value) {
		loadUrls();
	} else if (authStore.isAuthenticated && urlStore.savedUrls.length > 0) {
		loadUrls();
	}
});

watch(isMyList, (value) => {
	if (!value && shortUrls.value.length === 0) {
		loadUrls();
	}
	if (
		value &&
		authStore.isAuthenticated &&
		urlStore.savedUrls.length > 0 &&
		shortUrls.value.length === 0
	) {
		loadUrls();
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
