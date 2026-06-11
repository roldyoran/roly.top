<template>
  <Card class="rounded-2xl p-6 sm:p-8 text-center">
    <div class="space-y-4">
      <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <svg class="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
        </svg>
      </div>
      <div>
        <h3 class="font-display font-bold text-lg text-foreground">{{ title }}</h3>
        <p class="text-sm text-muted-foreground mt-1">
          {{ description }}
        </p>
      </div>
      <Button
        @click="authStore.signIn()"
        :disabled="authStore.isLoading"
        class="gap-2"
      >
        <Google class="w-4 h-4" />
        {{ buttonText }}
      </Button>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import Google from "@/assets/google.vue";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";

withDefaults(
	defineProps<{
		title?: string;
		description?: string;
		buttonText?: string;
	}>(),
	{
		title: "Inicia sesión para continuar",
		description: "Autentícate con Google para acceder a esta funcionalidad.",
		buttonText: "Sign in con Google",
	},
);

const authStore = useAuthStore();
</script>
