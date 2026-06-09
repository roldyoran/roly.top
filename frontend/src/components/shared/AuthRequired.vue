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
        <svg class="w-4 h-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {{ buttonText }}
      </Button>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
