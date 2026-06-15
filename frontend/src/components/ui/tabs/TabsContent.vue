<script setup lang="ts">
import { reactiveOmit } from "@/lib/utils";
import type { TabsContentProps } from "reka-ui";
import { TabsContent } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<
	TabsContentProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
  <TabsContent
    data-slot="tabs-content"
    :class="cn('flex-1 outline-none data-[state=active]:animate-in data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=active]:fade-in-0 duration-200', props.class)"
    v-bind="delegatedProps"
  >
    <slot />
  </TabsContent>
</template>
