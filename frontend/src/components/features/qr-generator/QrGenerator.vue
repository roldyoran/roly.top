<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-3 font-display">
        <QrCode class="w-6 h-6 shrink-0" />
        Generar QR
      </CardTitle>
      <CardDescription>
        Crea un código QR a partir de cualquier URL
      </CardDescription>
    </CardHeader>

    <CardContent class="space-y-6">
      <form @submit="handleGenerate" class="space-y-4">
        <div class="space-y-2">
          <Label for="qr-url">URL</Label>
          <div class="flex gap-2">
            <Input
              id="qr-url"
              v-model="urlInput"
              type="url"
              name="qr-url"
              autocomplete="url"
              placeholder="https://ejemplo.com..."
              required
            />
            <Button type="submit" :disabled="isGenerating">
              <span v-if="!isGenerating">Generar</span>
              <div v-else class="flex items-center gap-2" aria-live="polite">
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando…
              </div>
            </Button>
          </div>
        </div>

        <!-- Opciones del QR: ubicadas justo debajo del input -->
        <div class="space-y-2">
          <div :class="['p-3 border rounded-md', qrDataUrl ? 'bg-card border-border' : 'bg-muted/10 border-border-dim']">
            <div class="flex items-center gap-3 mb-2 w-full flex-wrap">
              <Label class="text-xs">Color</Label>
              <input :disabled="!qrDataUrl" type="color" v-model="color1" class="w-10 h-8 p-0 rounded-md border border-border" />

              <Label class="text-xs ml-2">Gradiente</Label>
              <Switch :disabled="!qrDataUrl" v-model="useGradient" />
              <input v-if="useGradient" :disabled="!qrDataUrl" type="color" v-model="color2" class="w-10 h-8 p-0 ml-2 rounded-md border border-border" />

              <Label class="text-xs ml-2">Módulos</Label>
              <Switch :disabled="!qrDataUrl" v-model="roundedModules" />

              <Label class="text-xs ml-2">Logo del sitio</Label>
              <Switch :disabled="!qrDataUrl" v-model="useDefaultLogo" />

              <div class="ml-auto text-xs text-muted-foreground">Opciones disponibles después de generar</div>
            </div>
          </div>
        </div>

        <div v-if="error" class="text-destructive text-sm" role="alert" aria-live="polite">
          {{ error }}
        </div>
      </form>

      <motion.div
        ref="qrResult"
        :initial="{ opacity: 0, scale: 0.95, y: 12 }"
        :animate="qrDataUrl ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }"
        :transition="{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }"
        class="space-y-4"
      >
        <div class="flex justify-center p-4 rounded-lg border bg-muted/30">
          <div :class="['w-48 h-48 flex items-center justify-center border border-border rounded-md overflow-hidden relative', qrDataUrl ? 'bg-white' : 'bg-card']">
            <canvas ref="qrCanvas" class="w-full h-full"></canvas>
            <div v-if="!qrDataUrl" class="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground font-mono pointer-events-none">
              <QrCode class="w-8 h-8 mb-1 text-muted-foreground" />
              <span class="text-xs">Aquí aparecerá tu QR</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center gap-2">
          <div class="flex gap-2">
            <Button @click="downloadQr" variant="outline" size="sm" :disabled="!qrDataUrl">
              <Download class="w-4 h-4 mr-2" aria-hidden="true" />
              Descargar QR
            </Button>
            <Button @click="copyQrDataUrl" variant="outline" size="sm" :disabled="!qrDataUrl">
              <Copy class="w-4 h-4 mr-2" aria-hidden="true" />
              Copiar Imagen
            </Button>
          </div>
        </div>
      </motion.div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Copy, Download, QrCode } from "lucide-vue-next";
import { motion } from "motion-v";
import qrcode from "qrcode-generator";
import { nextTick, ref, watch } from "vue";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const props = defineProps<{ initialUrl?: string }>();

const urlInput = ref<string>("");
const qrDataUrl = ref<string>("");
const error = ref<string>("");
const isGenerating = ref<boolean>(false);
const qrResult = ref<HTMLElement | null>(null);
const qrCanvas = ref<HTMLCanvasElement | null>(null);

// customization options
const color1 = ref<string>("#09090B");
const color2 = ref<string>("#4ade80");
const useGradient = ref<boolean>(false);
const roundedModules = ref<boolean>(false);
const useDefaultLogo = ref<boolean>(false);
const defaultLogoSizePercent = 0.18;
const canvasSize = ref<number>(192);
const canvasPadding = ref<number>(6);

import defaultLogo from "@/assets/vue.svg";

async function generateFromInput() {
	error.value = "";
	qrDataUrl.value = "";
	isGenerating.value = true;
	console.log("[QrGenerator] generateFromInput start", { url: urlInput.value });

	if (!urlInput.value.trim()) {
		error.value = "Por favor ingresa una URL.";
		isGenerating.value = false;
		return;
	}

	try {
		await drawCustomQr(urlInput.value.trim());

		await nextTick();
		const el =
			(qrResult.value as unknown as { $el?: HTMLElement })?.$el ??
			qrResult.value;
		if (el && typeof el.scrollIntoView === "function") {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
		}
		console.log("[QrGenerator] generated successfully");
	} catch (err: unknown) {
		error.value = (err as Error).message || "Error al generar el código QR";
		console.error("[QrGenerator] generate error", err);
	} finally {
		isGenerating.value = false;
	}
}

const handleGenerate = async (event: Event) => {
	event.preventDefault();
	await generateFromInput();
};

// If initialUrl prop provided, watch and auto-generate
watch(
	() => props.initialUrl,
	(val) => {
		console.log("[QrGenerator] initialUrl changed:", val);
		if (val) {
			urlInput.value = val;
			void generateFromInput();
		}
	},
	{ immediate: true },
);

// Auto-update QR when options change (live preview) — only after a QR has been generated
let _regenTimer: ReturnType<typeof setTimeout> | null = null;
watch([color1, color2, useGradient, roundedModules, useDefaultLogo], () => {
	if (!qrDataUrl.value) return; // require a generated QR first
	if (!urlInput.value || !urlInput.value.trim()) return;
	if (_regenTimer) clearTimeout(_regenTimer);
	_regenTimer = setTimeout(async () => {
		isGenerating.value = true;
		try {
			await drawCustomQr(urlInput.value.trim());
		} finally {
			isGenerating.value = false;
		}
	}, 150);
});

async function drawCustomQr(text: string) {
	const size = canvasSize.value;
	const canvas = qrCanvas.value;
	if (!canvas) return;
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas 2D no disponible");

	// create qr
	const qr = qrcode(0, "M");
	qr.addData(text);
	qr.make();

	const moduleCount = qr.getModuleCount();
	// add padding around QR
	const pad = typeof canvasPadding !== 'undefined' ? canvasPadding.value || 6 : 6;
	const avail = size - pad * 2;
	const cell = avail / moduleCount;
	// slightly increase module size to improve scanner reliability
	const moduleScale = 1.08; // 8% larger
	const scaledCell = cell * moduleScale;

	// main canvas: white background
	ctx.clearRect(0, 0, size, size);
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, size, size);

	// prepare fill style (solid color or gradient)
	let moduleFill: CanvasGradient | string;
	if (useGradient.value) {
		const grad = ctx.createLinearGradient(0, 0, size, size);
		grad.addColorStop(0, color1.value);
		grad.addColorStop(1, color2.value);
		moduleFill = grad;
	} else {
		moduleFill = color1.value;
	}

	// draw modules directly onto main canvas (supports rounded modules)
	ctx.fillStyle = moduleFill;
	for (let r = 0; r < moduleCount; r++) {
		for (let c = 0; c < moduleCount; c++) {
			if (!qr.isDark(r, c)) continue;
			// center the scaled module inside the original cell position
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

	// add default logo if requested
	if (useDefaultLogo.value) {
		try {
			await new Promise<void>((resolve, reject) => {
				const img = new Image();
				img.crossOrigin = "anonymous";
				img.onload = () => {
					const logoSize = Math.floor(size * defaultLogoSizePercent);
					const lx = Math.floor((size - logoSize) / 2);
					const ly = Math.floor((size - logoSize) / 2);

					// white rounded background for logo
					const pad = Math.floor(logoSize * 0.12);
					const bgW = logoSize + pad * 2;
					const bgH = logoSize + pad * 2;
					const bgX = lx - pad;
					const bgY = ly - pad;

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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
	link.download = "qr-code.png";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	toast.success("QR descargado correctamente");
};

const copyQrDataUrl = async () => {
	const canvas = qrCanvas.value;
	if (!canvas) return;
	try {
		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
		if (!blob) return;
		await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
		toast.success("Imagen del QR copiada al portapapeles");
	} catch (e) {
		console.error(e);
		toast.error("No se pudo copiar la imagen al portapapeles");
	}
};
</script>
