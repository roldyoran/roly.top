<template>
  <div class="w-full max-w-[560px]">
    <div class="mb-6">
      <h2 class="font-display text-lg font-800 tracking-tight">Crear Nuevo Enlace</h2>
      <p class="text-xs font-mono text-muted-foreground mt-0.5">Acorta una URL y guárdala en tu cuenta</p>
    </div>

    <Card class="border-border/60">
      <CardContent class="p-6">
        <div class="flex flex-col gap-4">
          <div>
            <Label class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground mb-1.5 block">URL de destino *</Label>
            <Input
              v-model="urlInput"
              type="url"
              placeholder="https://tu-url-larga.com/con/ruta?y=params"
              class="h-9"
              @keydown.enter="handleShorten"
            />
          </div>

          <div>
            <Label class="text-[10px] font-mono font-700 tracking-widest uppercase text-muted-foreground mb-1.5 block">
              Alias personalizado <span class="text-muted-foreground font-400">(opcional)</span>
            </Label>
            <Input
              v-model="alias"
              type="text"
              placeholder="mi-enlace"
              maxlength="9"
              class="h-9"
            />
          </div>

          <div class="flex gap-2">
            <Button
              class="bg-primary text-primary-foreground font-mono font-700"
              :disabled="isLoading || !urlInput.trim()"
              @click="handleShorten"
            >
              <Link class="size-3.5" data-icon="inline-start" />
              {{ isLoading ? 'Creando...' : 'Crear Enlace Corto' }}
            </Button>
            <Button variant="secondary" @click="clearForm">Limpiar</Button>
          </div>

          <Card v-if="shortUrl" class="w-full border-border/60 relative overflow-hidden">
            <CardContent class="p-4">
              <div class="flex items-center gap-3">
                <div class="flex-1 min-w-0">
                  <div class="font-mono text-sm font-700 text-primary">{{ shortUrl }}</div>
                  <div class="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">{{ urlInput }}</div>
                </div>
                <Button size="sm" class="bg-primary text-primary-foreground font-mono font-700" @click="copyShortUrl">
                  <Copy class="size-3.5" data-icon="inline-start" />
                  Copiar
                </Button>
              </div>
              <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Copy, Link } from "lucide-vue-next";
import { ref } from "vue";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCopyToClipboard } from "@/composables/useCopyToClipboard";
import { useUrlShortener } from "@/composables/useUrlShortener";

const { shortenUrl, isLoading } = useUrlShortener();
const { copyToClipboard } = useCopyToClipboard();

const urlInput = ref("");
const alias = ref("");
const shortUrl = ref("");

async function handleShorten() {
	const url = urlInput.value.trim();
	if (!url) return;

	try {
		const result = await shortenUrl(url, alias.value || undefined);
		if (result.success) {
			shortUrl.value = result.shortUrl || "";
			toast.success("¡Enlace creado!", { description: shortUrl.value });
		}
	} catch (err: unknown) {
		toast.error(
			(err as { message?: string })?.message || "Error al crear el enlace",
		);
	}
}

function copyShortUrl() {
	copyToClipboard(shortUrl.value, "¡Copiado!");
}

function clearForm() {
	urlInput.value = "";
	alias.value = "";
	shortUrl.value = "";
}
</script>
