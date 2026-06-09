<template>
  <TooltipProvider>
    <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-3">
        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Información de URL
      </CardTitle>
      <CardDescription>Obtén información detallada sobre una URL acortada</CardDescription>
    </CardHeader>
    
    <CardContent class="space-y-6">
      <!-- Auth Required Message -->
      <AuthRequired
        v-if="!authStore.isAuthenticated"
        title="Sesión requerida"
        description="Debes iniciar sesión para ver la información de URLs."
      />

      <!-- Search Form (only when authenticated) -->
      <form v-else @submit="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="short-url-code">Código de URL Corta</Label>
          <div class="flex gap-2">
            <Input 
              id="short-url-code"
              v-model="shortCode"
              type="text"
              maxlength="9"
              placeholder="Ej: abc123456"
              required
            />
            <Button type="submit" :disabled="isLoading">
              <span v-if="!isLoading">Buscar</span>
              <div v-else class="flex items-center gap-2">
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Buscando...
              </div>
            </Button>
          </div>
        </div>
        
        <!-- Error Message -->
        <div v-if="error" class="text-destructive text-sm">
          {{ error }}
        </div>
      </form>
      
      <!-- Results -->
      <div v-if="urlInfo" class="space-y-4">
        <div class="space-y-4">
          <div>
            <Label class="text-sm font-medium">URL Original</Label>
              <div class="flex items-center space-x-2 mt-1">
              <Input 
                :modelValue="urlInfo.originalUrl"
                readonly
                class="flex-1"
              />

              <Tooltip>
                <TooltipTrigger :asChild="true">
                  <Button @click="copyOriginalUrl()" variant="outline" size="sm">
                    <Copy class="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copiar URL original</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 gap-4">
            <Card>
              <CardContent class="p-4 text-center">
                <div class="text-2xl font-bold">{{ urlInfo.visits || 0 }}</div>
                <div class="text-sm text-muted-foreground">Clicks</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent class="p-4 text-center">
                <div class="text-2xl font-bold">{{ formattedDate }}</div>
                <div class="text-sm text-muted-foreground">Creada</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CardContent>
    </Card>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Copy } from "lucide-vue-next";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUrlInfoRequest } from "@/api/http";
import { useCopyToClipboard } from "@/composables/useCopyToClipboard";
import { useAuthStore } from "@/stores/authStore";
import AuthRequired from "@/components/shared/AuthRequired.vue";
import { formatDate } from "@/lib/utils";
import type { UrlInfoResponse } from "@/api/types";
import { toast } from "vue-sonner";
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";

// Composables
const { copyToClipboard } = useCopyToClipboard();
const authStore = useAuthStore();

// Reactive state
const shortCode = ref<string>("");
const urlInfo = ref<UrlInfoResponse | null>(null);
const error = ref<string>("");
const isLoading = ref<boolean>(false);

// Computed
const formattedDate = computed(() => {
	return urlInfo.value ? formatDate(urlInfo.value.createdAt) : "";
});

// Methods
const handleSubmit = async (event: Event) => {
	event.preventDefault();
	error.value = "";
	urlInfo.value = null;

	if (!shortCode.value.trim()) {
		error.value = "Por favor ingresa el código de la URL corta.";
		return;
	}

	isLoading.value = true;

	try {
		const data = await getUrlInfoRequest(shortCode.value.trim());
		urlInfo.value = data;

		if (data) {
			toast.success("Información obtenida", {
				description: "Se ha encontrado la información de la URL",
			});
		}
	} catch (err: any) {
		const status = err?.response?.status;
		if (status === 404) {
			const searchedCode = shortCode.value.trim();
			error.value = `No existe una URL con el código "${searchedCode}"`;
			toast.error("URL no encontrada", {
				description: `El código "${searchedCode}" no existe en la base de datos`,
			});
		} else {
			const errorMessage =
				err?.response?.data?.message ||
				"Error al obtener información de la URL";
			error.value = errorMessage;
			toast.error("Error al obtener información", {
				description: errorMessage,
			});
		}
	} finally {
		isLoading.value = false;
	}
};

const copyOriginalUrl = () => {
	if (urlInfo.value?.originalUrl) {
		copyToClipboard(urlInfo.value.originalUrl, "URL original copiada");
	}
};
</script>