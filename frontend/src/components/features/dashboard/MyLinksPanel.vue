<template>
	<TooltipProvider>
	<div class="flex flex-col gap-5">
		<!-- HEADER -->
		<div class="flex items-center justify-between flex-wrap gap-3">
			<div>
				<h3 class="font-display text-lg font-800 tracking-tight">
					Mis Enlaces
				</h3>
				<p class="text-xs font-mono text-muted-foreground mt-0.5">
					Administra todos tus enlaces acortados
				</p>
			</div>
			<Button
				size="sm"
				class="bg-primary text-primary-foreground font-mono font-700"
				@click="$emit('navigate', 'create')"
			>
				<Plus class="size-3.5" data-icon="inline-start" />
				Nuevo Enlace
			</Button>
		</div>

		<!-- QUICK STATS -->
		<div class="grid grid-cols-3 gap-3">
			<Card class="border-border/60">
				<CardContent class="p-3 relative overflow-hidden">
					<div class="flex items-center gap-2 mb-2">
						<div class="flex size-6 items-center justify-center rounded-md bg-primary/10">
							<Link class="size-3 text-primary" />
						</div>
						<span class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground">Total</span>
					</div>
					<p class="text-2xl font-display font-800 tracking-tight leading-none">{{ urls.length }}</p>
					<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
				</CardContent>
			</Card>
			<Card class="border-border/60">
				<CardContent class="p-3 relative overflow-hidden">
					<div class="flex items-center gap-2 mb-2">
						<div class="flex size-6 items-center justify-center rounded-md bg-primary/10">
							<MousePointerClick class="size-3 text-primary" />
						</div>
						<span class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground">Clics</span>
					</div>
					<p class="text-2xl font-display font-800 tracking-tight leading-none">{{ totalClicks }}</p>
					<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
				</CardContent>
			</Card>
			<Card class="border-border/60">
				<CardContent class="p-3 relative overflow-hidden">
					<div class="flex items-center gap-2 mb-2">
						<div class="flex size-6 items-center justify-center rounded-md bg-primary/10">
							<TrendingUp class="size-3 text-primary" />
						</div>
						<span class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground">Promedio</span>
					</div>
					<p class="text-2xl font-display font-800 tracking-tight leading-none">{{ avgClicks }}</p>
					<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
				</CardContent>
			</Card>
		</div>

		<!-- SEARCH -->
		<div class="relative w-full max-w-md">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
			<Input
				v-model="searchQuery"
				placeholder="Buscar enlaces..."
				class="pl-9 h-9 text-xs font-mono"
			/>
		</div>

		<!-- LOADING -->
		<div v-if="isLoading" class="flex flex-col gap-2.5">
			<Skeleton v-for="i in 4" :key="i" class="h-16 rounded-xl" />
		</div>

		<!-- EMPTY STATE -->
		<Empty v-else-if="urls.length === 0">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Link />
				</EmptyMedia>
				<EmptyTitle class="font-display">Sin enlaces aún</EmptyTitle>
				<EmptyDescription class="font-mono">
					Crea tu primer enlace corto para empezar
				</EmptyDescription>
			</EmptyHeader>
			<Button
				size="sm"
				class="bg-primary text-primary-foreground font-mono font-700"
				@click="$emit('navigate', 'create')"
			>
				<Plus class="size-3.5" data-icon="inline-start" />
				Crear enlace
			</Button>
		</Empty>

		<!-- LINKS LIST -->
		<template v-else>
			<div class="flex flex-col gap-3">
				<Card
					v-for="url in filteredUrls"
					:key="url.shortCode"
					class="border-border/60 relative overflow-hidden"
				>
					<CardContent class="p-4">
						<div class="flex items-center gap-4">
							<!-- Short URL -->
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2 mb-1.5">
									<span class="font-mono text-sm font-700 text-primary truncate">
										roly.top/{{ url.shortCode }}
									</span>
									<Button
										variant="ghost"
										size="icon"
										class="size-5 text-muted-foreground hover:text-foreground"
										title="Copiar enlace"
										@click="copyUrl(url.shortCode)"
									>
										<Copy class="size-3" />
									</Button>
								</div>
								<p class="text-[11px] font-mono text-muted-foreground truncate">
									{{ url.originalUrl }}
								</p>
							</div>

							<!-- Stats -->
							<div class="hidden sm:flex items-center gap-4 flex-shrink-0">
								<div class="text-right">
									<div class="flex items-center gap-1.5">
										<MousePointerClick class="size-3 text-muted-foreground" />
										<span class="text-sm font-display font-800">{{ url.visits }}</span>
									</div>
									<p class="text-[10px] font-mono text-muted-foreground">clics</p>
								</div>
								<Separator orientation="vertical" class="h-8" />
								<div class="text-right min-w-[70px]">
									<p class="text-[11px] font-mono text-muted-foreground">{{ formatDate(url.createdAt) }}</p>
								</div>
							</div>

							<!-- Actions -->
							<div class="flex items-center gap-1 flex-shrink-0">
								<Tooltip>
									<TooltipTrigger :asChild="true">
										<Button
											variant="ghost"
											size="sm"
											class="h-6 w-6 sm:h-7 sm:w-7 p-0"
											aria-label="Copiar URL"
											@click="copyUrl(url.shortCode)"
										>
											<Copy class="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Copiar URL</TooltipContent>
								</Tooltip>

								<Tooltip>
									<TooltipTrigger :asChild="true">
										<Button
											variant="ghost"
											size="sm"
											class="h-6 w-6 sm:h-7 sm:w-7 p-0"
											aria-label="Generar código QR"
											@click="generateQR(url.shortCode)"
										>
											<QrCode class="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Generar QR</TooltipContent>
								</Tooltip>

								<Tooltip>
									<TooltipTrigger :asChild="true">
										<Button
											variant="ghost"
											size="sm"
											class="h-6 w-6 sm:h-7 sm:w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
											aria-label="Eliminar URL"
											@click="confirmDelete(url.shortCode)"
										>
											<Trash2 class="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Eliminar</TooltipContent>
								</Tooltip>
							</div>
						</div>

						<!-- Top accent line -->
						<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

						<!-- Mobile stats row -->
						<div class="mt-2.5 flex items-center gap-3 sm:hidden">
							<div class="flex items-center gap-1.5">
								<MousePointerClick class="size-3 text-muted-foreground" />
								<span class="text-xs font-mono font-700">{{ url.visits }} clics</span>
							</div>
							<span class="text-[10px] font-mono text-muted-foreground">{{ formatDate(url.createdAt) }}</span>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- NO RESULTS -->
			<div
				v-if="filteredUrls.length === 0 && searchQuery"
				class="flex flex-col items-center py-10"
			>
				<Search class="size-8 text-muted-foreground/30 mb-2" />
				<p class="text-xs font-mono text-muted-foreground">
					Sin resultados para "{{ searchQuery }}"
				</p>
			</div>
		</template>

		<!-- DELETE DIALOG -->
		<Dialog v-model:open="deleteDialogOpen">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Eliminar enlace</DialogTitle>
					<DialogDescription>
						Se eliminará permanentemente
						<span class="font-mono text-foreground">/{{ deleteTarget }}</span>.
						Esta acción no se puede deshacer.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" @click="deleteDialogOpen = false">
						Cancelar
					</Button>
					<Button
						variant="destructive"
						:disabled="isDeleting"
						@click="executeDelete"
					>
						{{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<!-- QR DIALOG -->
		<Dialog v-model:open="showQRModal">
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
	</div>
	</TooltipProvider>
</template>

<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
	Copy,
	Download,
	Link,
	MousePointerClick,
	Plus,
	QrCode,
	Search,
	Trash2,
	TrendingUp,
} from "lucide-vue-next";
import QRCode from "qrcode-generator";
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import { deleteUrlRequest, getAppBaseUrl, getUrlsRequest } from "@/api/http";
import type { UrlInfoResponse } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopyToClipboard } from "@/composables/useCopyToClipboard";
import { useUrlStore } from "@/stores/urlStore";

defineEmits<{
	navigate: [panel: string];
}>();

const { copyToClipboard } = useCopyToClipboard();
const queryClient = useQueryClient();
const urlStore = useUrlStore();
const searchQuery = ref("");
const deleteDialogOpen = ref(false);
const deleteTarget = ref("");
const isDeleting = ref(false);

// QR modal state (same as UrlsList)
const showQRModal = ref(false);
const qrCanvas = ref<HTMLCanvasElement>();
const currentQRUrl = ref<string>("");

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
			urls.value = [...data.urls].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
			if (typeof data.urlLimit === "number") {
				urlStore.setUrlLimit(data.urlLimit);
			}
			urlStore.clearAllUrls();
			data.urls.forEach((u) => {
				urlStore.addUrl(u.originalUrl, u.shortCode);
			});
		} else {
			urls.value = [];
		}
	},
	{ immediate: true },
);

const filteredUrls = computed(() => {
	if (!searchQuery.value) return urls.value;
	const q = searchQuery.value.toLowerCase();
	return urls.value.filter(
		(u) =>
			u.shortCode.toLowerCase().includes(q) ||
			u.originalUrl.toLowerCase().includes(q),
	);
});

const totalClicks = computed(() =>
	urls.value.reduce((sum, u) => sum + (u.visits || 0), 0),
);

const avgClicks = computed(() => {
	if (urls.value.length === 0) return "0";
	return String(Math.round(totalClicks.value / urls.value.length));
});

const deleteMutation = useMutation({
	mutationFn: async (shortCode: string) => {
		await deleteUrlRequest(shortCode);
	},
	onMutate: async (shortCode) => {
		await queryClient.cancelQueries({ queryKey: ["userUrls"] });
		const previous = urls.value;
		urls.value = urls.value.filter((u) => u.shortCode !== shortCode);

		// Optimistically remove from urlStore to update limit state immediately
		const targetUrl = previous.find((u) => u.shortCode === shortCode);
		if (targetUrl) {
			urlStore.removeUrl(targetUrl.originalUrl, shortCode);
		}

		return { previous };
	},
	onError: (_err, shortCode, context) => {
		if (context?.previous) {
			urls.value = context.previous;
			// Rollback urlStore state
			const targetUrl = context.previous.find((u) => u.shortCode === shortCode);
			if (targetUrl) {
				urlStore.addUrl(targetUrl.originalUrl, shortCode);
			}
		}
		toast.error("Error al eliminar", {
			description: "No se pudo eliminar el enlace.",
		});
	},
	onSettled: () => {
		queryClient.invalidateQueries({ queryKey: ["userUrls"] });
	},
});

function formatDate(dateStr: string) {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function copyUrl(shortCode: string) {
	copyToClipboard(`roly.top/${shortCode}`, "¡Copiado!");
}

function confirmDelete(shortCode: string) {
	deleteTarget.value = shortCode;
	deleteDialogOpen.value = true;
}

// QR Code functions (same as UrlsList)
const getFullShortUrl = (shortCode: string): string => {
	return `${getAppBaseUrl()}/${shortCode}`;
};

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

async function executeDelete() {
	isDeleting.value = true;
	try {
		await deleteMutation.mutateAsync(deleteTarget.value);
		toast.success("Enlace eliminado", {
			description: `/${deleteTarget.value} fue eliminado.`,
		});
		deleteDialogOpen.value = false;
	} catch {
		// error handled in onError
	} finally {
		isDeleting.value = false;
	}
}
</script>
