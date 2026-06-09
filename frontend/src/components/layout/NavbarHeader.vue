<template>
  <header class="sticky top-0 z-50 h-14 border-b border-border/50 bg-background/80 backdrop-blur-md">
    <div class="flex items-center justify-between h-full px-6 gap-4">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-md border border-border bg-card flex items-center justify-center">
          <Link class="w-4 h-4 text-primary" />
        </div>
        <div>
          <span class="font-display font-800 text-[17px] text-foreground tracking-tight">roly.top</span>
          <span class="block font-mono text-[11px] tracking-wider text-muted-foreground leading-none -mt-0.5">by roldyoran</span>
        </div>
        <div class="w-2 h-2 rounded-full bg-primary animate-pulse ml-1"></div>
      </div>

      <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60">
        <span class="font-mono text-[10px] tracking-wider text-muted-foreground">URLS</span>
        <span class="font-mono text-[10px] tracking-wider text-primary font-bold">{{ urlStore.urlCount }}</span>
        <div class="w-px h-3 bg-border"></div>
        <span class="font-mono text-[10px] tracking-wider text-muted-foreground">LÍMITE</span>
        <span class="font-mono text-[10px] tracking-wider text-foreground">{{ urlStore.urlLimit }}</span>
      </div>

      <div class="flex-1"></div>

      <div class="flex items-center gap-1">
        <ThemeToggle />

        <!-- Botón de Google Sign In (no autenticado) -->
        <Button
          v-if="!authStore.isAuthenticated"
          variant="outline"
          size="sm"
          class="hidden sm:flex items-center gap-2 px-3 h-8"
          :disabled="authStore.isLoading"
          @click="authStore.signIn"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span class="font-mono text-[10px] tracking-wider">SIGN IN</span>
        </Button>

        <!-- Usuario autenticado -->
        <div v-if="authStore.isAuthenticated" class="hidden sm:flex items-center gap-2">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60">
            <img
              v-if="authStore.userImage"
              :src="authStore.userImage"
              :alt="authStore.userName"
              class="w-5 h-5 rounded-full"
            />
            <div v-else class="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
              <User class="w-3 h-3 text-primary" />
            </div>
            <span class="font-mono text-[10px] tracking-wider text-foreground max-w-[100px] truncate">
              {{ authStore.userName }}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="w-9 h-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            @click="handleSignOut"
          >
            <LogOut class="w-4 h-4" />
          </Button>
        </div>

        <!-- Menú móvil -->
        <Drawer>
          <DrawerTrigger as-child>
            <Button variant="ghost" size="sm" class="sm:hidden w-9 h-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted">
              <Menu class="w-4 h-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader class="text-left">
              <DrawerTitle>Menú</DrawerTitle>
              <DrawerDescription>Opciones de navegación</DrawerDescription>
            </DrawerHeader>
            <div class="px-4 pb-8 space-y-4">
              <!-- Botón Google Sign In (móvil) -->
              <Button
                v-if="!authStore.isAuthenticated"
                variant="outline"
                class="w-full justify-start gap-2"
                :disabled="authStore.isLoading"
                @click="authStore.signIn"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in con Google
              </Button>

              <!-- Usuario autenticado (móvil) -->
              <div v-if="authStore.isAuthenticated" class="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/60">
                <img
                  v-if="authStore.userImage"
                  :src="authStore.userImage"
                  :alt="authStore.userName"
                  class="w-8 h-8 rounded-full"
                />
                <div v-else class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User class="w-4 h-4 text-primary" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm truncate">{{ authStore.userName }}</p>
                  <p class="text-xs text-muted-foreground truncate">{{ authStore.userEmail }}</p>
                </div>
                <Button variant="ghost" size="sm" @click="handleSignOut">
                  <LogOut class="w-4 h-4" />
                </Button>
              </div>

              <router-link
                v-if="authStore.isAdmin"
                to="/admin"
                class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/50 bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Shield class="w-3.5 h-3.5 text-primary" />
                <span class="font-mono text-[10px] tracking-wider text-primary font-bold">DASHBOARD ADMIN</span>
              </router-link>

              <Button variant="outline" as-child class="w-full justify-start gap-2">
                <a href="https://github.com/roldyoran/shorturl" target="_blank">
                  <Github class="w-4 h-4" />
                  GitHub
                </a>
              </Button>
            </div>
          </DrawerContent>
        </Drawer>

        <div v-if="authStore.isAdmin" class="hidden sm:flex items-center gap-1.5">
          <router-link
            to="/admin"
            class="flex items-center gap-1.5 px-3 h-8 rounded-full border border-primary/50 bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <Shield class="w-3.5 h-3.5 text-primary" />
            <span class="font-mono text-[10px] tracking-wider text-primary font-bold">ADMIN</span>
          </router-link>
        </div>

        <Button variant="ghost" size="sm" as-child class="hidden sm:flex items-center gap-1.5 px-3 h-8 text-muted-foreground hover:text-foreground hover:bg-muted">
          <a href="https://github.com/roldyoran/shorturl" target="_blank">
            <Github class="w-3.5 h-3.5" />
            <span class="font-mono text-[10px] tracking-wider">GITHUB</span>
          </a>
        </Button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Github, Link, LogOut, Menu, Shield, User } from "lucide-vue-next";
import { toast } from "vue-sonner";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { useAuthStore } from "@/stores/authStore";
import { useUrlStore } from "@/stores/urlStore";
import ThemeToggle from "./ThemeToggle.vue";

defineProps<{
	attempts: number;
}>();

const router = useRouter();
const urlStore = useUrlStore();
const authStore = useAuthStore();

async function handleSignOut() {
	try {
		await authStore.signOut();
		authStore.resetAuth();
		router.push({ name: "home" });
		toast.success("Sesión cerrada", {
			description: "Has cerrado sesión correctamente.",
		});
	} catch {
		toast.error("Error al cerrar sesión");
	}
}
</script>
