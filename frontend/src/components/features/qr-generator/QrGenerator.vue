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
          <div class="w-48 h-48 flex items-center justify-center border border-border rounded-md bg-card overflow-hidden">
            <img
              v-if="qrDataUrl"
              :src="qrDataUrl"
              alt="Código QR generado"
              class="w-full h-full object-contain"
            />

            <div v-else class="w-full h-full flex flex-col items-center justify-center text-muted-foreground font-mono">
              <QrCode class="w-8 h-8 mb-1 text-muted-foreground" />
              <span class="text-xs">Aquí aparecerá tu QR</span>
            </div>
          </div>
        </div>

        <div class="flex justify-center gap-2">
          <Button @click="downloadQr" variant="outline" size="sm" :disabled="!qrDataUrl">
            <Download class="w-4 h-4 mr-2" aria-hidden="true" />
            Descargar QR
          </Button>
          <Button @click="copyQrDataUrl" variant="outline" size="sm" :disabled="!qrDataUrl">
            <Copy class="w-4 h-4 mr-2" aria-hidden="true" />
            Copiar Imagen
          </Button>
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

const props = defineProps<{ initialUrl?: string }>();

const urlInput = ref<string>("");
const qrDataUrl = ref<string>("");
const error = ref<string>("");
const isGenerating = ref<boolean>(false);
const qrResult = ref<HTMLElement | null>(null);

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
		const qr = qrcode(0, "M");
		qr.addData(urlInput.value);
		qr.make();

		qrDataUrl.value = qr.createDataURL(4, 0);

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

const downloadQr = () => {
	if (!qrDataUrl.value) return;

	const link = document.createElement("a");
	link.href = qrDataUrl.value;
	link.download = "qr-code.png";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	toast.success("QR descargado correctamente");
};

const copyQrDataUrl = async () => {
	if (!qrDataUrl.value) return;

	try {
		const base64Data = qrDataUrl.value.split(",")[1];
		const byteCharacters = atob(base64Data);
		const byteNumbers = new Array(byteCharacters.length);
		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumbers);
		const blob = new Blob([byteArray], { type: "image/png" });

		await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);

		toast.success("Imagen del QR copiada al portapapeles");
	} catch {
		toast.error("No se pudo copiar la imagen al portapapeles");
	}
};
</script>
