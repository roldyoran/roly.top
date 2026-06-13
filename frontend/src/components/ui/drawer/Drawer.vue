<script lang="ts" setup>
import { useForwardPropsEmits } from "reka-ui";
import type { DrawerRootEmits, DrawerRootProps } from "vaul-vue";
import { DrawerRoot } from "vaul-vue";

const props = withDefaults(defineProps<DrawerRootProps>(), {
	shouldScaleBackground: true,
});

const emits = defineEmits<DrawerRootEmits>();

// cast to any to satisfy TS when creating spread from forwarded props
const forwarded = useForwardPropsEmits(props as any, emits) as Record<
	string,
	any
>;
</script>

<template>
  <DrawerRoot
    data-slot="drawer"
    v-bind="forwarded"
  >
    <slot />
  </DrawerRoot>
</template>
