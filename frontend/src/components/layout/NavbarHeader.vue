<template>
  <header class="sticky top-0 z-50 h-14 border-b border-border/50 bg-background/80 backdrop-blur-md">
    <div class="flex items-center justify-between h-full px-6 gap-4">
      <router-link :to="{ name: 'home' }" class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-md border border-border bg-card flex items-center justify-center">
          <Link class="w-4 h-4 text-primary" />
        </div>
        <div>
          <span class="font-display font-800 text-[17px] text-foreground tracking-tight">roly.top</span>
          <span class="block font-mono text-[11px] tracking-wider text-muted-foreground leading-none -mt-0.5">by roldyoran</span>
        </div>
        <div class="w-2 h-2 rounded-full bg-primary animate-pulse ml-1"></div>
      </router-link>

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
          <Google class="w-4 h-4" />
          <span class="font-mono text-[10px] tracking-wider">SIGN IN</span>
        </Button>

        <!-- Usuario autenticado -->
        <div v-if="authStore.isAuthenticated" class="hidden sm:flex items-center gap-2">
          <router-link
            to="/dashboard"
            class="flex items-center gap-1.5 px-3 h-8 rounded-full border border-border bg-card/60 hover:bg-muted transition-colors"
          >
            <LayoutDashboard class="w-3.5 h-3.5 text-primary" />
            <span class="font-mono text-[10px] tracking-wider text-foreground">DASHBOARD</span>
          </router-link>
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
            aria-label="Cerrar sesión"
            @click="handleSignOut"
          >
            <LogOut class="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        <!-- Menú móvil -->
        <Drawer>
          <DrawerTrigger as-child>
            <Button variant="ghost" size="sm" class="sm:hidden w-9 h-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="Abrir menú">
              <Menu class="w-4 h-4" aria-hidden="true" />
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
                <Google class="w-4 h-4" />
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
                <Button variant="ghost" size="sm" @click="handleSignOut" aria-label="Cerrar sesión">
                  <LogOut class="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>

              <router-link
                v-if="authStore.isAuthenticated"
                to="/dashboard"
                class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 hover:bg-muted transition-colors"
              >
                <LayoutDashboard class="w-3.5 h-3.5 text-primary" />
                <span class="font-mono text-[10px] tracking-wider text-foreground font-bold">DASHBOARD</span>
              </router-link>

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
import {
	Github,
	LayoutDashboard,
	Link,
	LogOut,
	Menu,
	Shield,
	User,
} from "lucide-vue-next";
import Google from "@/assets/google.vue";
import { useRouter } from "vue-router";
import { toast } from "vue-sonner";
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
	} catch {
		// Silenciar error del backend
	} finally {
		authStore.resetAuth();
		router.push({ name: "home" });
		toast.success("Sesión cerrada", {
			description: "Has cerrado sesión correctamente.",
		});
	}
}
</script>
