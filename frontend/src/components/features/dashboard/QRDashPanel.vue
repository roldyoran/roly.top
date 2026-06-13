<template>
  <div class="flex flex-col gap-5">
    <div>
      <h2 class="font-display text-lg font-800 tracking-tight">Generador de QR</h2>
      <p class="text-xs font-mono text-muted-foreground mt-0.5">Genera códigos QR para tus enlaces</p>
    </div>

    <Card class="w-full border-border/60">
      <CardContent class="p-6 flex flex-col gap-5">
        <div class="flex flex-col gap-4">
          <div class="space-y-2">
            <Label class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground">Selecciona un enlace o ingresa una URL</Label>
            <Select v-model="selectedUrl" :disabled="urls.length === 0">
              <SelectTrigger class="flex-1">
                <SelectValue :placeholder="urls.length > 0 ? 'Tus enlaces recientes...' : 'No tienes enlaces'" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="url in urls" :key="url.shortCode" :value="`roly.top/${url.shortCode}`">
                  <span class="font-mono text-xs">roly.top/{{ url.shortCode }}</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground">O ingresa manualmente</Label>
            <div class="flex gap-2">
              <Input
                v-model="qrUrl"
                type="url"
                placeholder="https://ejemplo.com o pega un enlace roly.top/..."
              />
              <Button class="bg-primary text-primary-foreground font-mono font-700 shrink-0" @click="generateFromInput">
                Generar
              </Button>
            </div>
          </div>

          <div class="space-y-2">
            <div :class="['p-3 border rounded-md', qrDataUrl ? 'bg-card border-border' : 'bg-muted/10 border-border-dim']">
              <div class="flex items-center gap-3 mb-2 w-full flex-wrap">
                <Label class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground">Color</Label>
                <input :disabled="!qrDataUrl" type="color" v-model="color1" class="w-10 h-8 p-0 rounded-md border border-border" />

                <Label class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground ml-2">Gradiente</Label>
                <Switch :disabled="!qrDataUrl" v-model="useGradient" />
                <input v-if="useGradient" :disabled="!qrDataUrl" type="color" v-model="color2" class="w-10 h-8 p-0 ml-2 rounded-md border border-border" />

                <Label class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground ml-2">Módulos</Label>
                <Switch :disabled="!qrDataUrl" v-model="roundedModules" />

                <Label class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground ml-2">Logo del sitio</Label>
                <Switch :disabled="!qrDataUrl" v-model="useDefaultLogo" />

                <div class="ml-auto text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground">Opciones disponibles después de generar</div>
              </div>
            </div>
          </div>

          <div v-if="error" class="text-destructive text-sm" role="alert" aria-live="polite">
            {{ error }}
          </div>
        </div>

        <div ref="qrResult" class="flex flex-col gap-4">
          <div class="flex justify-center p-4 rounded-lg border bg-muted/30">
            <div :class="['w-48 h-48 flex items-center justify-center border border-border rounded-md overflow-hidden relative', qrDataUrl ? 'bg-white' : 'bg-card']">
              <canvas ref="qrCanvas" class="w-full h-full"></canvas>
              <div v-if="!qrDataUrl" class="absolute inset-0 flex flex-col items-center justify-center bg-muted/30 border border-dashed border-border/60 rounded-xl text-muted-foreground font-mono pointer-events-none">
                <QrCode class="size-11 text-muted-foreground/30 mb-2.5" />
                <span class="text-xs">Aquí aparecerá tu QR</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col items-center gap-2">
            <div class="flex gap-2">
              <Button @click="downloadQr" variant="outline" size="sm" class="font-mono font-600 text-[11px] border-border/60">
                <Download class="size-3" data-icon="inline-start" />
                Descargar QR
              </Button>
              <Button @click="copyQrDataUrl" variant="outline" size="sm" class="font-mono font-600 text-[11px] border-border/60">
                <Copy class="size-3" data-icon="inline-start" />
                Copiar Imagen
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { Copy, Download, QrCode } from "lucide-vue-next";
import qrcode from "qrcode-generator";
import { nextTick, ref, watch } from "vue";
import { toast } from "vue-sonner";
import { getUrlsRequest } from "@/api/http";
import type { UrlInfoResponse } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import defaultLogo from "@/assets/vue.svg";

const qrUrl = ref("");
const selectedUrl = ref("");

const qrDataUrl = ref<string>("");
const error = ref<string>("");
const isGenerating = ref<boolean>(false);
const qrResult = ref<HTMLElement | null>(null);
const qrCanvas = ref<HTMLCanvasElement | null>(null);

const color1 = ref<string>("#09090B");
const color2 = ref<string>("#4ade80");
const useGradient = ref<boolean>(false);
const roundedModules = ref<boolean>(false);
const useDefaultLogo = ref<boolean>(false);
const defaultLogoSizePercent = 0.18;
const canvasSize = ref<number>(192);
const canvasPadding = ref<number>(6);

const urlsQuery = useQuery({
	queryKey: ["userUrls"],
	queryFn: async ({ signal }) => {
		const res = await getUrlsRequest(signal);
		return res as { urls: UrlInfoResponse[]; urlLimit: number };
	},
	staleTime: 5 * 60 * 1000,
	refetchOnWindowFocus: false,
});

const urls = ref<UrlInfoResponse[]>([]);

watch(
	urlsQuery.data,
	(data) => {
		if (data?.urls && Array.isArray(data.urls)) {
			urls.value = [...data.urls].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);
		}
	},
	{ immediate: true },
);

watch(selectedUrl, (val) => {
	if (val) {
		qrUrl.value = val;
		void generateFromInput();
	}
});

let _regenTimer: ReturnType<typeof setTimeout> | null = null;
watch([color1, color2, useGradient, roundedModules, useDefaultLogo], () => {
	if (!qrDataUrl.value) return;
	if (!qrUrl.value || !qrUrl.value.trim()) return;
	if (_regenTimer) clearTimeout(_regenTimer);
	_regenTimer = setTimeout(async () => {
		isGenerating.value = true;
		try {
			await drawCustomQr(qrUrl.value.trim());
		} finally {
			isGenerating.value = false;
		}
	}, 150);
});

async function generateFromInput() {
	error.value = "";
	qrDataUrl.value = "";
	isGenerating.value = true;
	if (!qrUrl.value.trim()) {
		error.value = "Por favor ingresa una URL.";
		isGenerating.value = false;
		return;
	}

	try {
		await drawCustomQr(qrUrl.value.trim());

		await nextTick();
		const el =
			(qrResult.value as unknown as { $el?: HTMLElement })?.$el ??
			qrResult.value;
		if (el && typeof el.scrollIntoView === "function") {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	} catch (err: unknown) {
		error.value = (err as Error).message || "Error al generar el código QR";
	} finally {
		isGenerating.value = false;
	}
}

async function drawCustomQr(text: string) {
	const size = canvasSize.value;
	const canvas = qrCanvas.value;
	if (!canvas) return;
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas 2D no disponible");

	const qr = qrcode(0, "M");
	qr.addData(text);
	qr.make();

	const moduleCount = qr.getModuleCount();
	const pad = canvasPadding.value || 6;
	const avail = size - pad * 2;
	const cell = avail / moduleCount;
	const moduleScale = 1.08;
	const scaledCell = cell * moduleScale;

	ctx.clearRect(0, 0, size, size);
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, size, size);

	let moduleFill: CanvasGradient | string;
	if (useGradient.value) {
		const grad = ctx.createLinearGradient(0, 0, size, size);
		grad.addColorStop(0, color1.value);
		grad.addColorStop(1, color2.value);
		moduleFill = grad;
	} else {
		moduleFill = color1.value;
	}

	ctx.fillStyle = moduleFill;
	for (let r = 0; r < moduleCount; r++) {
		for (let c = 0; c < moduleCount; c++) {
			if (!qr.isDark(r, c)) continue;
			const baseX = pad + c * cell;
			const baseY = pad + r * cell;
			const w = Math.ceil(scaledCell);
			const h = Math.ceil(scaledCell);
			const x = Math.round(baseX - (w - cell) / 2);
			const y = Math.round(baseY - (h - cell) / 2);

			if (roundedModules.value) {
				const cx = x + w / 2;
				const cy = y + h / 2;
				const radius = Math.max(1, scaledCell * 0.45);
				ctx.beginPath();
				ctx.arc(cx, cy, radius, 0, Math.PI * 2);
				ctx.fill();
			} else {
				ctx.fillRect(x, y, w, h);
			}
		}
	}

	if (useDefaultLogo.value) {
		try {
			await new Promise<void>((resolve, reject) => {
				const img = new Image();
				img.crossOrigin = "anonymous";
				img.onload = () => {
					const logoSize = Math.floor(size * defaultLogoSizePercent);
					const lx = Math.floor((size - logoSize) / 2);
					const ly = Math.floor((size - logoSize) / 2);

					const logoPad = Math.floor(logoSize * 0.12);
					const bgW = logoSize + logoPad * 2;
					const bgH = logoSize + logoPad * 2;
					const bgX = lx - logoPad;
					const bgY = ly - logoPad;

					ctx.fillStyle = "#fff";
					const r = Math.max(6, Math.floor(bgW * 0.12));
					roundRect(ctx, bgX, bgY, bgW, bgH, r);
					ctx.fill();

					ctx.drawImage(img, lx, ly, logoSize, logoSize);
					resolve();
				};
				img.onerror = reject;
				img.src = defaultLogo;
			});
		} catch (e) {
			console.warn("Error cargando logo:", e);
		}
	}

	qrDataUrl.value = canvas.toDataURL("image/png");
}

function roundRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number,
) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}

const downloadQr = () => {
	const canvas = qrCanvas.value;
	if (!canvas) return;
	const link = document.createElement("a");
	link.href = canvas.toDataURL("image/png");
	link.download = "qr-roly-top.png";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	toast.success("QR descargado correctamente");
};

const copyQrDataUrl = async () => {
	const canvas = qrCanvas.value;
	if (!canvas) return;
	try {
		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob((b) => resolve(b), "image/png"),
		);
		if (!blob) return;
		await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
		toast.success("Imagen del QR copiada al portapapeles");
	} catch (e) {
		console.error(e);
		toast.error("No se pudo copiar la imagen al portapapeles");
	}
};
</script>
