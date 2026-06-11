<script setup lang="ts">
import { useColorMode } from "@vueuse/core";
import { Monitor, Moon, Sun } from "lucide-vue-next";
import { computed, ref } from "vue";
import { Button } from "@/components/ui/button";

const mode = useColorMode();
const buttonRef = ref<HTMLElement>();

const currentIcon = computed(() => {
	switch (mode.value) {
		case "dark":
			return Moon;
		case "light":
			return Sun;
		default:
			return Monitor;
	}
});

const toggleTheme = async (event: MouseEvent) => {
	if (!document.startViewTransition) {
		mode.value = mode.value === "light" ? "dark" : "light";
		return;
	}

	const x = event.clientX;
	const y = event.clientY;

	const endRadius = Math.hypot(
		Math.max(x, innerWidth - x),
		Math.max(y, innerHeight - y),
	);

	const transition = document.startViewTransition(() => {
		mode.value = mode.value === "light" ? "dark" : "light";
	});

	await transition.ready;

	document.documentElement.animate(
		{
			clipPath: [
				`circle(0px at ${x}px ${y}px)`,
				`circle(${endRadius}px at ${x}px ${y}px)`,
			],
		},
		{
			duration: 500,
			easing: "ease-in-out",
			pseudoElement: "::view-transition-new(root)",
		},
	);
};

defineExpose({
	toggleTheme,
});
</script>

<template>
	<Button
		ref="buttonRef"
		variant="outline"
		size="sm"
		class="h-9 w-9 p-0"
		@click="toggleTheme"
		:aria-label="mode === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'"
		:title="mode === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'"
	>
		<component
			:is="currentIcon"
			class="h-4 w-4 transition-transform duration-200 hover:scale-110"
			aria-hidden="true"
		/>
	</Button>
</template>

<style>
::view-transition-old(root),
::view-transition-new(root) {
	animation: none;
	mix-blend-mode: normal;
	z-index: 1;
}

::view-transition-new(root) {
	z-index: 9999;
}
</style>
