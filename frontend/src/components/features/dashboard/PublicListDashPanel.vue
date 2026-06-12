<template>
	<div class="flex flex-col gap-3">
		<div>
			<h2 class="font-display text-lg font-800 tracking-tight">Enlaces Públicos</h2>
			<p class="text-[10px] font-mono text-muted-foreground mt-0.5">Explora los enlaces acortados públicos</p>
		</div>

		<div class="relative max-w-sm">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
			<Input
				v-model="searchQuery"
				placeholder="Buscar URLs públicas..."
				class="pl-9 h-9 text-xs font-mono"
			/>
		</div>

		<div v-if="isLoading" class="flex flex-col gap-2">
			<div v-for="i in 5" :key="i" class="rounded-xl border border-border bg-card px-4 py-3">
				<Skeleton class="h-5 w-32 mb-2" />
				<Skeleton class="h-3.5 w-full max-w-xs" />
			</div>
		</div>

		<Empty v-else-if="filteredUrls.length === 0">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Globe />
				</EmptyMedia>
				<EmptyTitle class="font-display">Sin enlaces públicos</EmptyTitle>
				<EmptyDescription class="font-mono">
					No se encontraron enlaces públicos
				</EmptyDescription>
			</EmptyHeader>
		</Empty>

		<div v-else class="flex flex-col gap-2">
			<div
				v-for="url in filteredUrls"
				:key="url.shortCode"
				class="rounded-xl border border-border bg-card px-4 py-3 flex flex-col gap-0.5 transition-colors hover:bg-muted/40"
			>
				<div class="flex items-center justify-between gap-3">
					<span class="font-mono text-xl font-semibold text-primary tracking-tight">
						/{{ url.shortCode }}
					</span>

					<div class="flex items-center gap-3 ml-auto">
						<div class="flex items-center gap-1.5 text-muted-foreground">
							<MousePointerClick class="size-3.5" />
							<span class="font-mono text-xs">{{ url.visits || 0 }} clics</span>
						</div>

						<div class="flex items-center gap-1">
							<Button
								variant="ghost"
								size="sm"
								class="size-7 p-0 text-muted-foreground hover:text-foreground"
								@click="copyUrl(url.shortCode)"
							>
								<Copy class="size-3.5" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								class="size-7 p-0 text-muted-foreground hover:text-foreground"
								@click="openExternal(url.shortCode)"
							>
								<ExternalLink class="size-3.5" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								class="size-7 p-0 text-muted-foreground hover:text-foreground"
								@click="openQr(url.shortCode)"
							>
								<QrCode class="size-3.5" />
							</Button>
						</div>
					</div>
				</div>

				<span class="font-mono text-sm text-muted-foreground truncate">
					{{ url.originalUrl }}
				</span>

				<div class="flex justify-end mt-1">
					<span class="font-mono text-[10px] text-muted-foreground/60">
						{{ formatDate(url.createdAt) }}
					</span>
				</div>
			</div>
		</div>

		<!-- QR Dialog -->
		<Dialog v-model:open="qrDialogOpen">
			<DialogContent class="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Código QR</DialogTitle>
					<DialogDescription>
						Escanea este código para acceder a: {{ currentQrUrl }}
					</DialogDescription>
				</DialogHeader>
				<div class="flex items-center justify-center py-4">
					<canvas ref="qrCanvas" class="border rounded-lg" />
				</div>
				<div class="flex justify-center">
					<Button @click="downloadQr" variant="outline" size="sm" class="font-mono font-600 text-[11px] border-border/60">
						<Download class="size-3" data-icon="inline-start" />
						Descargar QR
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import {
	Copy,
	Download,
	ExternalLink,
	Globe,
	MousePointerClick,
	QrCode,
	Search,
} from "lucide-vue-next";
import QRCode from "qrcode-generator";
import { computed, ref, watch } from "vue";
import { getAppBaseUrl, getPublicUrlsRequest } from "@/api/http";
import type { UrlInfoResponse } from "@/api/types";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useCopyToClipboard } from "@/composables/useCopyToClipboard";

const { copyToClipboard } = useCopyToClipboard();
const searchQuery = ref("");
const shortUrls = ref<UrlInfoResponse[]>([]);

const qrDialogOpen = ref(false);
const currentQrUrl = ref("");
const qrCanvas = ref<HTMLCanvasElement>();

const publicQuery = useQuery({
	queryKey: ["publicUrls"],
	queryFn: async ({ signal }) => {
		const res = await getPublicUrlsRequest(signal);
		return res;
	},
	staleTime: 5 * 60 * 1000,
	gcTime: 10 * 60 * 1000,
	refetchOnWindowFocus: false,
});

const isLoading = computed(
	() => publicQuery.isLoading.value || publicQuery.isFetching.value,
);

watch(
	publicQuery.data,
	(data) => {
		if (data && Array.isArray(data)) {
			shortUrls.value = [...data].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
		} else {
			shortUrls.value = [];
		}
	},
	{ immediate: true },
);

const filteredUrls = computed(() => {
	if (!searchQuery.value) return shortUrls.value;
	const q = searchQuery.value.toLowerCase();
	return shortUrls.value.filter(
		(u) =>
			u.shortCode.toLowerCase().includes(q) ||
			u.originalUrl.toLowerCase().includes(q),
	);
});

function formatDate(dateStr: string) {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function copyUrl(shortCode: string) {
	copyToClipboard(`roly.top/${shortCode}`, "¡Copiado!");
}

function openExternal(shortCode: string) {
	window.open(`${getAppBaseUrl()}/${shortCode}`, "_blank");
}

function openQr(shortCode: string) {
	currentQrUrl.value = `${getAppBaseUrl()}/${shortCode}`;
	qrDialogOpen.value = true;
	setTimeout(() => {
		createQr(currentQrUrl.value);
	}, 100);
}

function createQr(url: string) {
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
	for (let y = 0; y < moduleCount; y++) {
		for (let x = 0; x < moduleCount; x++) {
			if (qr.isDark(y, x)) {
				ctx.fillRect(
					margin + x * moduleSize,
					margin + y * moduleSize,
					moduleSize,
					moduleSize,
				);
			}
		}
	}
}

function downloadQr() {
	if (!qrCanvas.value) return;
	const dataUrl = qrCanvas.value.toDataURL("image/png");
	const link = document.createElement("a");
	link.download = "qr-roly-top.png";
	link.href = dataUrl;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
</script>
