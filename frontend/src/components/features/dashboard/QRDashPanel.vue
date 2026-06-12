<template>
  <div>
    <div>
      <h2 class="font-display text-lg font-800 tracking-tight">Generador de QR</h2>
      <p class="text-xs font-mono text-muted-foreground mt-0.5">Genera códigos QR para tus enlaces</p>
    </div>

    <Card class="w-full max-w-[540px] border-border/60">
      <CardContent class="p-5">
        <div class="mb-4">
          <Label class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground mb-1.5 block">Selecciona un enlace o ingresa una URL</Label>
          <div class="flex flex-col sm:flex-row gap-2">
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
        </div>

        <div class="mb-4">
          <Label class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground mb-1.5 block">
            O ingresa manualmente
          </Label>
          <div class="flex flex-col sm:flex-row gap-2">
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

        <div class="mt-4">
          <div v-if="error" class="text-destructive text-sm mb-2" role="alert">{{ error }}</div>

          <div v-if="qrDataUrl" ref="qrResult" class="flex flex-col gap-4">
            <div class="flex justify-center p-4 rounded-lg border bg-muted/30">
              <img :src="qrDataUrl" alt="Código QR generado" class="w-48 h-48 border-4 border-white" />
            </div>

            <div class="flex justify-center gap-2">
              <Button @click="downloadQr" variant="outline" size="sm" class="font-mono font-600 text-[11px] border-border/60"><Download class="size-3" data-icon="inline-start" />Descargar QR</Button>
              <Button @click="copyQrDataUrl" variant="outline" size="sm" class="font-mono font-600 text-[11px] border-border/60"><Copy class="size-3" data-icon="inline-start" />Copiar Imagen</Button>
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center h-[220px] bg-muted/30 border border-dashed border-border/60 rounded-xl">
            <QrCode class="size-11 text-muted-foreground/30 mb-2.5" />
            <p class="text-xs text-muted-foreground font-mono">Selecciona o ingresa una URL para generar</p>
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
import { useCopyToClipboard } from "@/composables/useCopyToClipboard";

const { copyToClipboard } = useCopyToClipboard();
const qrUrl = ref("");
const selectedUrl = ref("");

// QR generator state (adapted from QrGenerator.vue)
const qrDataUrl = ref<string>("");
const error = ref<string>("");
const isGenerating = ref<boolean>(false);
const qrResult = ref<HTMLElement | null>(null);

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
		const qr = qrcode(0, "M");
		qr.addData(qrUrl.value);
		qr.make();

		qrDataUrl.value = qr.createDataURL(4, 0);

		await nextTick();
		const el = qrResult.value as unknown as
			| { $el?: HTMLElement }
			| HTMLElement
			| null;
		const realEl = (el as any)?.$el ?? el;
		if (
			realEl &&
			typeof (realEl as HTMLElement).scrollIntoView === "function"
		) {
			(realEl as HTMLElement).scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
		}
	} catch (err: unknown) {
		error.value = (err as Error).message || "Error al generar el código QR";
		console.error("[QRDashPanel] generate error", err);
	} finally {
		isGenerating.value = false;
	}
}

const downloadQr = () => {
	if (!qrDataUrl.value) return;

	const link = document.createElement("a");
	link.href = qrDataUrl.value;
	link.download = "qr-roly-top.png";
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

function copyUrl() {
	if (!qrUrl.value) return;
	copyToClipboard(qrUrl.value, "¡URL copiada!");
}
</script>
