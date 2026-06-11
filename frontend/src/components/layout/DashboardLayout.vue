<template>
  <div class="relative min-h-screen">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-top">
        <router-link :to="{ name: 'home' }" class="sidebar-logo">
          <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_var(--lime-glow)]">
            <Link class="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <span class="font-display font-800 text-sm tracking-tight">roly<span class="text-primary">.</span>top</span>
            <span class="block font-mono text-[10px] tracking-wider text-muted-foreground leading-none -mt-0.5">by roldyoran</span>
          </div>
        </router-link>
      </div>

      <div class="sidebar-user">
        <div v-if="authStore.userImage" class="w-[34px] h-[34px] rounded-[9px] overflow-hidden flex-shrink-0">
          <img :src="authStore.userImage" :alt="authStore.userName" class="w-full h-full object-cover" />
        </div>
        <div v-else class="user-avatar">
          {{ userInitial }}
        </div>
        <div class="user-info">
          <div class="user-name">{{ authStore.userName || 'Invitado' }}</div>
          <div class="user-email">{{ authStore.userEmail || 'Sin sesión' }}</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-group">
          <div class="nav-group-label">Resumen</div>
          <button class="nav-item" :class="{ active: currentPanel === 'overview' }" @click="switchPanel('overview')">
            <LayoutDashboard class="w-[15px] h-[15px]" />
            Panel
          </button>
          <button class="nav-item" :class="{ active: currentPanel === 'myurls' }" @click="switchPanel('myurls')">
            <Link class="w-[15px] h-[15px]" />
            Mis Enlaces
            <span class="nav-badge">{{ urlStore.urlCount }}</span>
          </button>
          <button class="nav-item" :class="{ active: currentPanel === 'analytics' }" @click="switchPanel('analytics')">
            <Activity class="w-[15px] h-[15px]" />
            Analíticas
          </button>
        </div>
        <div class="nav-group">
          <div class="nav-group-label">Herramientas</div>
          <button class="nav-item" :class="{ active: currentPanel === 'create' }" @click="switchPanel('create')">
            <Plus class="w-[15px] h-[15px]" />
            Nuevo Enlace
          </button>
          <button class="nav-item" :class="{ active: currentPanel === 'qrdash' }" @click="switchPanel('qrdash')">
            <QrCode class="w-[15px] h-[15px]" />
            Códigos QR
          </button>
          <button class="nav-item" :class="{ active: currentPanel === 'publiclist' }" @click="switchPanel('publiclist')">
            <Globe class="w-[15px] h-[15px]" />
            Enlaces Públicos
          </button>
        </div>
        <div class="nav-group">
          <div class="nav-group-label">Cuenta</div>
          <button class="nav-item" :class="{ active: currentPanel === 'settings' }" @click="switchPanel('settings')">
            <Settings class="w-[15px] h-[15px]" />
            Configuración
          </button>
        </div>
        <div v-if="authStore.isAdmin" class="nav-group">
          <div class="nav-group-label flex items-center gap-1.5">
            <Shield class="w-3 h-3 text-primary" />
            Admin
          </div>
          <button class="nav-item" :class="{ active: currentPanel === 'admin-users' }" @click="switchPanel('admin-users')">
            <Users class="w-[15px] h-[15px]" />
            Gestión de Usuarios
          </button>
          <button class="nav-item" :class="{ active: currentPanel === 'admin-urls' }" @click="switchPanel('admin-urls')">
            <Link class="w-[15px] h-[15px]" />
            Gestión de URLs
          </button>
        </div>
      </nav>

      <div class="sidebar-bottom">
        <button class="nav-item text-destructive hover:text-destructive" @click="handleSignOut">
          <LogOut class="w-[15px] h-[15px]" />
          Cerrar sesión
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <div class="dash-content">
      <header class="dash-topbar">
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="sm" class="lg:hidden p-0 h-9 w-9" @click="sidebarOpen = !sidebarOpen">
            <Menu class="w-4 h-4" />
          </Button>
          <div class="flex items-center gap-2 font-mono text-sm">
            <span class="font-display font-800 text-primary">roly.top</span>
            <span class="text-muted-foreground">/</span>
            <span class="font-bold text-foreground">{{ panelLabels[currentPanel] || currentPanel }}</span>
          </div>
        </div>
        <div class="dash-topbar-right">
          <ThemeToggle />
          <Button size="sm" class="bg-primary text-primary-foreground font-display font-700 h-8 px-3" @click="switchPanel('create')">
            <Plus class="w-3 h-3 mr-1" />
            Nuevo Enlace
          </Button>
        </div>
      </header>

      <main class="dash-main">
        <slot :panel="currentPanel" />
      </main>
    </div>

    <!-- Mobile sidebar overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-foreground/50 z-50 lg:hidden"
      @click="sidebarOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import {
	Activity,
	Globe,
	LayoutDashboard,
	Link,
	LogOut,
	Menu,
	Plus,
	QrCode,
	Settings,
	Shield,
	Users,
} from "lucide-vue-next";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { useUrlStore } from "@/stores/urlStore";
import ThemeToggle from "./ThemeToggle.vue";

const props = defineProps<{
	panel?: string;
}>();

const emit = defineEmits<{
	"update:panel": [value: string];
}>();

const router = useRouter();
const authStore = useAuthStore();
const urlStore = useUrlStore();

const sidebarOpen = ref(false);

const panelLabels: Record<string, string> = {
	overview: "Panel",
	myurls: "Mis Enlaces",
	create: "Nuevo Enlace",
	analytics: "Analíticas",
	qrdash: "Códigos QR",
	publiclist: "Enlaces Públicos",
	settings: "Configuración",
	"admin-users": "Gestión de Usuarios",
	"admin-urls": "Gestión de URLs",
};

const currentPanel = computed(() => props.panel || "overview");

const userInitial = computed(() => {
	const name = authStore.userName;
	if (name) return name.charAt(0).toUpperCase();
	return "U";
});

function switchPanel(id: string) {
	emit("update:panel", id);
	sidebarOpen.value = false;
}

async function handleSignOut() {
	try {
		await authStore.signOut();
	} catch {
		// Silenciar error
	} finally {
		authStore.resetAuth();
		router.push({ name: "home" });
	}
}
</script>
