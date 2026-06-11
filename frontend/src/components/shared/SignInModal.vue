<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center"
        @click.self="$emit('close')"
      >
        <div class="relative w-full max-w-[400px] mx-4">
          <div
            class="bg-card border border-border rounded-[20px] p-9 w-full shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_0_1px_var(--border)]"
          >
            <button
              class="absolute top-4 right-4 w-7 h-7 rounded-[7px] border border-border bg-muted flex items-center justify-center text-muted-foreground hover:bg-overlay hover:text-foreground transition-colors"
              @click="$emit('close')"
            >
              <X class="w-4 h-4" />
            </button>

            <div class="mb-5">
              <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mb-4 shadow-[0_0_16px_oklch(0.7_0.2_130/0.3)]">
                <Link class="w-4 h-4 text-primary-foreground" />
              </div>
              <h2 class="font-display text-[22px] font-800 tracking-tight mb-1.5">Welcome back</h2>
              <p class="text-[13px] text-muted-foreground leading-relaxed">
                Sign in to manage your links, view analytics, and access your personal dashboard.
              </p>
            </div>

            <button
              class="w-full h-12 rounded-[10px] border border-border bg-muted text-foreground text-sm font-500 cursor-pointer flex items-center justify-center gap-2.5 transition-all hover:bg-overlay hover:border-primary/30 mb-2.5"
              :disabled="authStore.isLoading"
              @click="handleGoogleSignIn"
            >
              <Google class="w-4 h-4" />
              Continue with Google
            </button>

            <div class="flex items-center gap-2.5 my-3">
              <div class="flex-1 h-px bg-border"></div>
              <span class="text-[11px] text-muted-foreground font-mono">or</span>
              <div class="flex-1 h-px bg-border"></div>
            </div>

            <button
              class="w-full h-12 rounded-[10px] border-none bg-primary text-primary-foreground font-display text-[15px] font-800 tracking-wide cursor-pointer transition-all hover:shadow-[0_0_32px_oklch(0.7_0.2_130/0.3)]"
              @click="handleDemo"
            >
              Try the demo dashboard →
            </button>

            <p class="mt-3.5 text-[11px] text-muted-foreground text-center leading-relaxed font-mono">
              Demo mode shows sample data. In production, Google OAuth stores your data securely via Cloudflare Workers KV.
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Link, X } from "lucide-vue-next";
import Google from "@/assets/google.vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

defineProps<{
	isOpen: boolean;
}>();

defineEmits<{
	close: [];
}>();

const router = useRouter();
const authStore = useAuthStore();

async function handleGoogleSignIn() {
	try {
		await authStore.signIn();
	} catch {
		// Error handled by auth store
	}
}

function handleDemo() {
	// For demo, just navigate to dashboard
	router.push("/dashboard");
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
