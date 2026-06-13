<template>
	<TooltipProvider>
		<div class="min-h-screen flex flex-col">
			<main class="flex-grow container mx-auto px-4 py-6">
				<div class="flex flex-col lg:flex-row gap-8">
					<div class="lg:hidden mb-2">
						<Sheet v-model:open="sidebarOpen">
							<SheetTrigger as-child>
								<Button variant="outline" size="sm" class="gap-2 rounded-xl h-9">
									<Menu class="w-4 h-4" />
									<span class="text-xs font-medium">Menú</span>
								</Button>
							</SheetTrigger>
							<SheetContent side="left" class="w-64 p-0">
								<SheetHeader class="p-4 pb-2">
									<SheetTitle class="flex items-center gap-2.5 text-sm font-semibold">
										<div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
											<Shield class="w-4 h-4 text-primary" />
										</div>
										Panel Admin
									</SheetTitle>
									<SheetDescription class="text-[11px] text-muted-foreground ml-[42px] leading-tight text-left">
										Gestión del sistema
									</SheetDescription>
								</SheetHeader>
								<nav class="space-y-0.5 px-3 py-2">
									<router-link
										v-for="item in navItems"
										:key="item.to"
										:to="item.to"
										class="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
										:class="$route.path === item.to
											? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
											: 'text-muted-foreground hover:text-foreground hover:bg-muted/60'"
										@click="sidebarOpen = false"
									>
										<div
											class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-200"
											:class="$route.path === item.to
												? 'bg-primary-foreground/20'
												: 'bg-muted group-hover:bg-muted'"
										>
											<component :is="item.icon" class="w-3.5 h-3.5" />
										</div>
										{{ item.label }}
									</router-link>
								</nav>
							</SheetContent>
						</Sheet>
					</div>

					<aside class="hidden lg:block w-60 flex-shrink-0">
						<div class="lg:sticky lg:top-6">
							<div class="mb-6 px-1">
								<div class="flex items-center gap-2.5 mb-1">
									<div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
										<Shield class="w-4 h-4 text-primary" />
									</div>
									<span class="font-display text-sm font-semibold tracking-tight">Panel Admin</span>
								</div>
								<p class="text-[11px] text-muted-foreground ml-[42px] leading-tight">Gestión del sistema</p>
							</div>

							<nav class="space-y-0.5">
								<router-link
									v-for="item in navItems"
									:key="item.to"
									:to="item.to"
									class="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
									:class="$route.path === item.to
										? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
										: 'text-muted-foreground hover:text-foreground hover:bg-muted/60'"
								>
									<div
										class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-200"
										:class="$route.path === item.to
											? 'bg-primary-foreground/20'
											: 'bg-muted group-hover:bg-muted'"
									>
										<component :is="item.icon" class="w-3.5 h-3.5" />
									</div>
									{{ item.label }}
								</router-link>
							</nav>
						</div>
					</aside>

					<div class="flex-1 min-w-0 animate-fade-in-up">
						<router-view />
					</div>
				</div>
			</main>
		</div>
	</TooltipProvider>
</template>

<script setup lang="ts">
import { LayoutDashboard, Link, Menu, Shield, Users } from "lucide-vue-next";
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";

const sidebarOpen = ref(false);

const navItems = [
	{ to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ to: "/admin/users", label: "Usuarios", icon: Users },
	{ to: "/admin/urls", label: "URLs", icon: Link },
];
</script>
