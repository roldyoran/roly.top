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
	"bg-[rgba(163,230,53,0.12)]! text-[var(--lime)]! border border-[rgba(163,230,53,0.25)]! rounded-[0.625rem]! shadow-[0_0_12px_var(--lime-glow),inset_0_1px_1px_var(--lime-soft)]! font-medium! [&>svg]:text-[var(--lime)]! [&>svg]:drop-shadow-[0_0_4px_var(--lime-glow)]";

const defaultItemClass = "text-[#a1a1aa]! hover:text-[#f4f4f5]! [&>svg]:text-[#a1a1aa]! [&>svg]:hover:text-[#f4f4f5]!";
</script>

<template>
	<Sidebar>
		<SidebarHeader>
			<SidebarMenu>
		<SidebarMenuItem>
				<router-link :to="{ name: 'home' }" class="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors">
					<div class="w-8 h-8 rounded-[9px] bg-primary flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_oklch(0.7 0.2 130/0.3)]">
						<Link class="w-4 h-4 text-primary-foreground" />
					</div>
					<div>
						<span class="font-display! font-800! text-[17px]! tracking-tight">roly<span class="text-primary">.</span>top</span>
						<span class="block font-mono! text-[11px]! tracking-wider text-muted-foreground leading-none -mt-0.5">by roldyoran</span>
					</div>
				</router-link>
			</SidebarMenuItem>
			</SidebarMenu>
		</SidebarHeader>

		<SidebarContent>
			<SidebarGroup class="py-1">
				<SidebarGroupLabel class="font-mono">Resumen</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
					<SidebarMenuItem v-for="item in resumenItems" :key="item.id">
						<SidebarMenuButton
							:is-active="currentPanel === item.id"
							:class="currentPanel === item.id ? activeItemClass : defaultItemClass"
							tooltip="item.label"
							@click="switchPanel(item.id)"
						>
							<component :is="item.icon" />
							<span>{{ item.label }}</span>
						</SidebarMenuButton>
						<SidebarMenuBadge
							v-if="item.id === 'myurls'"
							:class="currentPanel === 'myurls'
								? 'bg-[var(--lime)]! text-[#09090b]! border border-[var(--lime)]! font-bold! font-display! text-[11px]! h-4.5! min-w-4.5!'
								: 'opacity-50! text-[11px]! h-4.5! min-w-4.5! font-display!'"
						>
							{{ urlStore.urlCount }}
						</SidebarMenuBadge>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>

			<SidebarSeparator class="my-0" />

			<SidebarGroup class="py-1">
				<SidebarGroupLabel class="font-mono">Herramientas</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
					<SidebarMenuItem v-for="item in herramientasItems" :key="item.id">
						<SidebarMenuButton
							:is-active="currentPanel === item.id"
							:class="currentPanel === item.id ? activeItemClass : defaultItemClass"
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

			<SidebarSeparator class="my-0" />

			<SidebarGroup class="py-1">
				<SidebarGroupLabel class="font-mono">Cuenta</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
					<SidebarMenuItem v-for="item in cuentaItems" :key="item.id">
						<SidebarMenuButton
							:is-active="currentPanel === item.id"
							:class="currentPanel === item.id ? activeItemClass : defaultItemClass"
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

			<SidebarSeparator class="my-0" />

			<SidebarGroup v-if="authStore.isAdmin" class="py-1">
				<SidebarGroupLabel class="font-mono">
					<Shield class="mr-1.5 size-3 text-primary" />
					Admin
				</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
					<SidebarMenuItem v-for="item in adminItems" :key="item.id">
						<SidebarMenuButton
							:is-active="currentPanel === item.id"
							:class="currentPanel === item.id ? activeItemClass : defaultItemClass"
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
