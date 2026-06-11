<template>
  <div class="max-w-[560px]">
    <h2 class="font-display text-lg font-800 tracking-tight mb-1">Crear Nuevo Enlace Corto</h2>
    <p class="text-sm text-muted-foreground mb-6">Tus enlaces están vinculados a tu cuenta y rastreados en analíticas.</p>

    <Card>
      <CardContent class="p-6">
        <div class="mb-4">
          <Label class="text-xs font-semibold mb-1.5 block">URL de destino *</Label>
          <Input
            v-model="urlInput"
            type="url"
            placeholder="https://tu-url-larga.com/con/ruta?y=params"
            @keydown.enter="handleShorten"
          />
        </div>

        <div class="mb-4">
          <Label class="text-xs font-semibold mb-1.5 block">
            Alias personalizado <span class="text-muted-foreground font-400">(opcional)</span>
          </Label>
          <Input
            v-model="alias"
            type="text"
            placeholder="mi-enlace"
            maxlength="9"
          />
        </div>

        <div class="flex items-center gap-3 p-3 bg-muted border border-border rounded-lg mb-5">
          <Switch v-model="isPublic" />
          <div>
            <div class="text-[13px] font-600">Visible en la lista pública</div>
            <div class="text-[11px] text-muted-foreground font-mono mt-0.5">Cualquiera puede ver este enlace en la página principal</div>
          </div>
        </div>

        <div class="flex gap-2">
          <Button
            class="bg-primary text-primary-foreground font-display font-700"
            :disabled="isLoading || !urlInput.trim()"
            @click="handleShorten"
          >
            <Link class="w-3.5 h-3.5" />
            {{ isLoading ? 'Creando...' : 'Crear Enlace Corto' }}
          </Button>
          <Button variant="secondary" @click="clearForm">Limpiar</Button>
        </div>

        <div v-if="shortUrl" class="mt-4 p-3.5 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <div class="font-mono text-sm font-700 text-primary">{{ shortUrl }}</div>
            <div class="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">{{ urlInput }}</div>
          </div>
          <Button size="sm" class="bg-primary text-primary-foreground" @click="copyShortUrl">Copiar</Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Link } from "lucide-vue-next";
import { ref } from "vue";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCopyToClipboard } from "@/composables/useCopyToClipboard";
import { useUrlShortener } from "@/composables/useUrlShortener";

const { shortenUrl, isLoading } = useUrlShortener();
const { copyToClipboard } = useCopyToClipboard();

const urlInput = ref("");
const alias = ref("");
const isPublic = ref(true);
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
	isPublic.value = true;
	shortUrl.value = "";
}
</script>
