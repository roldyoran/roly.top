<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"];
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  }>(),
  { as: "h3" },
);
</script>

<template>
  <component
    :is="as"
    data-slot="card-title"
    :class="cn('leading-none font-semibold', props.class)"
  >
    <slot />
  </component>
</template>
