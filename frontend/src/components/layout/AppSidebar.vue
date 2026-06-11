<script setup lang="ts">
import {
	Activity,
	Globe,
	LayoutDashboard,
	Link,
	LogOut,
	Plus,
	QrCode,
	Settings,
	Shield,
	Users,
} from "lucide-vue-next";
import { useRouter } from "vue-router";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/authStore";
import { useUrlStore } from "@/stores/urlStore";

defineProps<{
	currentPanel: string;
}>();

const emit = defineEmits<{
	"update:panel": [value: string];
}>();

const router = useRouter();
const authStore = useAuthStore();
const urlStore = useUrlStore();

function switchPanel(id: string) {
	emit("update:panel", id);
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

const resumenItems = [
	{ id: "overview", label: "Panel", icon: LayoutDashboard },
	{ id: "myurls", label: "Mis Enlaces", icon: Link },
	{ id: "analytics", label: "Analíticas", icon: Activity },
];

const herramientasItems = [
	{ id: "create", label: "Nuevo Enlace", icon: Plus },
	{ id: "qrdash", label: "Códigos QR", icon: QrCode },
	{ id: "publiclist", label: "Enlaces Públicos", icon: Globe },
];

const cuentaItems = [{ id: "settings", label: "Configuración", icon: Settings }];

const adminItems = [
	{ id: "admin-users", label: "Gestión de Usuarios", icon: Users },
	{ id: "admin-urls", label: "Gestión de URLs", icon: Link },
];

const activeItemClass =
	"bg-[var(--bg-elevated)]! text-[var(--lime)]! border border-[var(--lime-dim)]! rounded-[0.625rem]! shadow-[0_0_12px_var(--lime-glow),inset_0_1px_1px_var(--lime-soft)]! font-medium! [&>svg]:text-[var(--lime)]! [&>svg]:drop-shadow-[0_0_4px_var(--lime-glow)]";
</script>

<template>
	<Sidebar>
		<SidebarHeader>
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton size="lg" as-child>
						<router-link :to="{ name: 'home' }">
							<div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_16px_var(--lime-glow)]">
								<Link class="size-4" />
							</div>
							<div class="grid flex-1 text-left text-sm leading-tight">
								<span class="truncate font-display font-800">roly<span class="text-primary">.</span>top</span>
								<span class="truncate font-mono text-[10px] tracking-wider text-muted-foreground">by roldyoran</span>
							</div>
						</router-link>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarHeader>

		<SidebarContent>
			<SidebarGroup>
				<SidebarGroupLabel>Resumen</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
					<SidebarMenuItem v-for="item in resumenItems" :key="item.id">
						<SidebarMenuButton
							:is-active="currentPanel === item.id"
							:class="currentPanel === item.id ? activeItemClass : ''"
							tooltip="item.label"
							@click="switchPanel(item.id)"
						>
							<component :is="item.icon" />
							<span>{{ item.label }}</span>
						</SidebarMenuButton>
							<SidebarMenuBadge v-if="item.id === 'myurls'">
								{{ urlStore.urlCount }}
							</SidebarMenuBadge>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>

			<SidebarSeparator />

			<SidebarGroup>
				<SidebarGroupLabel>Herramientas</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
					<SidebarMenuItem v-for="item in herramientasItems" :key="item.id">
						<SidebarMenuButton
							:is-active="currentPanel === item.id"
							:class="currentPanel === item.id ? activeItemClass : ''"
							tooltip="item.label"
							@click="switchPanel(item.id)"
						>
							<component :is="item.icon" />
							<span>{{ item.label }}</span>
						</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>

			<SidebarSeparator />

			<SidebarGroup>
				<SidebarGroupLabel>Cuenta</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
					<SidebarMenuItem v-for="item in cuentaItems" :key="item.id">
						<SidebarMenuButton
							:is-active="currentPanel === item.id"
							:class="currentPanel === item.id ? activeItemClass : ''"
							tooltip="item.label"
							@click="switchPanel(item.id)"
						>
							<component :is="item.icon" />
							<span>{{ item.label }}</span>
						</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>

			<SidebarGroup v-if="authStore.isAdmin">
				<SidebarGroupLabel>
					<Shield class="mr-1.5 size-3 text-primary" />
					Admin
				</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
					<SidebarMenuItem v-for="item in adminItems" :key="item.id">
						<SidebarMenuButton
							:is-active="currentPanel === item.id"
							:class="currentPanel === item.id ? activeItemClass : ''"
							tooltip="item.label"
							@click="switchPanel(item.id)"
						>
							<component :is="item.icon" />
							<span>{{ item.label }}</span>
						</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>

		<SidebarFooter>
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						class="text-destructive hover:text-destructive"
						@click="handleSignOut"
					>
						<LogOut />
						<span>Cerrar sesión</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarFooter>
	</Sidebar>
</template>
