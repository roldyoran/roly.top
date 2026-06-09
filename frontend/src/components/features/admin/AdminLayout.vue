<template>
	<TooltipProvider>
		<div class="min-h-screen flex flex-col">
			<main class="flex-grow container mx-auto px-4 py-6">
				<div class="flex flex-col lg:flex-row gap-6">
					<aside class="w-full lg:w-56 flex-shrink-0">
						<nav class="space-y-1">
							<router-link
								v-for="item in navItems"
								:key="item.to"
								:to="item.to"
								class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
								:class="$route.path === item.to
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:text-foreground hover:bg-muted'"
							>
								<component :is="item.icon" class="w-4 h-4" />
								{{ item.label }}
							</router-link>
						</nav>
					</aside>

					<div class="flex-1 min-w-0">
						<router-view />
					</div>
				</div>
			</main>
		</div>
	</TooltipProvider>
</template>

<script setup lang="ts">
import { LayoutDashboard, Link, Users } from "lucide-vue-next";
import { TooltipProvider } from "@/components/ui/tooltip";

const navItems = [
	{ to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ to: "/admin/users", label: "Usuarios", icon: Users },
	{ to: "/admin/urls", label: "URLs", icon: Link },
];
</script>
