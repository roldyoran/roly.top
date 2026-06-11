<template>
  <div>
    <h2 class="font-display text-lg font-800 tracking-tight mb-5">Generador de Códigos QR</h2>

    <Card class="max-w-[540px]">
      <CardContent class="p-7">
        <div class="mb-4">
          <Label class="text-xs font-semibold mb-1.5 block">Selecciona un enlace o ingresa una URL</Label>
          <div class="flex gap-2">
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
          <Label class="text-xs font-semibold mb-1.5 block">
            O ingresa manualmente
          </Label>
          <div class="flex gap-2">
            <Input
              v-model="qrUrl"
              type="url"
              placeholder="https://ejemplo.com o pega un enlace roly.top/..."
            />
            <Button class="bg-primary text-primary-foreground font-display font-700 shrink-0" @click="generateQR">
              Generar
            </Button>
          </div>
        </div>

        <div v-if="!qrGenerated" class="flex flex-col items-center justify-center h-[220px] bg-muted border border-dashed border-border rounded-xl">
          <QrCode class="w-11 h-11 text-muted-foreground/30 mb-2.5" />
          <p class="text-xs text-muted-foreground font-mono">Selecciona o ingresa una URL para generar</p>
        </div>

        <div v-else class="flex flex-col items-center py-6">
          <div class="bg-card p-3 rounded-[10px]">
            <canvas ref="qrCanvas" width="200" height="200"></canvas>
          </div>
          <div class="flex gap-2 mt-4">
            <Button size="sm" class="bg-primary text-primary-foreground" @click="downloadQR">Descargar PNG</Button>
            <Button variant="secondary" size="sm" @click="copyUrl">Copiar enlace</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { QrCode } from "lucide-vue-next";
import qrcode from "qrcode-generator";
import { computed, ref, watch } from "vue";
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
const qrGenerated = ref(false);
const qrCanvas = ref<HTMLCanvasElement | null>(null);

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
		generateQR();
	}
});

function generateQR() {
	const url = qrUrl.value.trim();
	if (!url) return;

	const qr = qrcode(0, "M");
	qr.addData(url);
	qr.make();

	const canvas = qrCanvas.value;
	if (!canvas) return;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	const size = 200;
	canvas.width = size;
	canvas.height = size;

	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, size, size);

	const moduleCount = qr.getModuleCount();
	const cellSize = size / moduleCount;

	for (let r = 0; r < moduleCount; r++) {
		for (let c = 0; c < moduleCount; c++) {
			if (qr.isDark(r, c)) {
				ctx.fillStyle = "#09090B";
				ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
			}
		}
	}

	qrGenerated.value = true;
}

function downloadQR() {
	const canvas = qrCanvas.value;
	if (!canvas) return;
	const a = document.createElement("a");
	a.href = canvas.toDataURL("image/png");
	a.download = "qr-roly-top.png";
	a.click();
}

function copyUrl() {
	copyToClipboard(qrUrl.value, "¡URL copiada!");
}
</script>
