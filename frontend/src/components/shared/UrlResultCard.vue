<template>
  <motion.div
    initial="hidden"
    animate="visible"
    :variants="cardVariants"
  >
    <Card class="result-card rounded-2xl p-4 mt-3">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span class="font-mono text-[10px] tracking-wider text-primary">URL ACORTADA EXITOSAMENTE</span>
        </div>
        <Button variant="ghost" size="sm" class="h-6 w-6 p-0" @click="$emit('close')">
          <X class="w-4 h-4" />
        </Button>
      </div>

      <div class="flex items-center gap-2 mt-3">
        <div class="flex-1 flex items-center gap-3 rounded-xl px-4 py-2.5 bg-card border border-primary/20">
          <Link class="w-4 h-4 flex-shrink-0 text-primary" />
          <span class="font-mono text-xs text-primary truncate">{{ shortUrl }}</span>
        </div>
        <motion.div whileHover="{ scale: 1.03 }" whileTap="{ scale: 0.97 }">
          <Button variant="outline" size="sm" @click="$emit('copy')" class="h-10 px-3 font-mono text-[10px] tracking-wider">
            <Copy class="w-3.5 h-3.5 mr-1.5" />
            COPIAR
          </Button>
        </motion.div>
        <Button variant="outline" size="sm" as-child class="h-10 w-10 p-0">
          <a :href="shortUrl" target="_blank" rel="noopener noreferrer" aria-label="Abrir URL acortada">
            <ExternalLink class="w-3.5 h-3.5" />
          </a>
        </Button>
      </div>

      <div v-if="originalUrl" class="mt-3">
        <Label class="font-mono text-[10px] text-muted-foreground">URL ORIGINAL</Label>
        <div class="font-mono text-xs text-foreground/70 truncate">{{ originalUrl }}</div>
      </div>

      <div class="flex items-center gap-4 pt-3 border-t border-border">
        <div class="flex items-center gap-1.5">
          <Eye class="w-3 h-3 text-muted-foreground" />
          <span class="font-mono text-[10px] text-muted-foreground">0 CLICS</span>
        </div>
        <div class="flex items-center gap-1.5">
          <Clock class="w-3 h-3 text-muted-foreground" />
          <span class="font-mono text-[10px] text-muted-foreground">HACE UN MOMENTO</span>
        </div>
        <div class="flex items-center gap-1.5 ml-auto">
          <div class="w-1.5 h-1.5 rounded-full bg-primary"></div>
          <span class="font-mono text-[10px] text-primary">EDGE ACTIVO</span>
        </div>
      </div>
    </Card>
  </motion.div>
</template>

<script setup lang="ts">
import { Clock, Copy, ExternalLink, Eye, Link, X } from "lucide-vue-next";
import { motion } from "motion-v";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

defineProps<{
	shortUrl: string;
	originalUrl?: string;
	animating?: boolean;
}>();

defineEmits<{
	copy: [];
	close: [];
}>();

const cardVariants = {
	hidden: {
		opacity: 0,
		y: 16,
		scale: 0.98,
		boxShadow: "0 0 0 rgba(0,0,0,0)",
	},
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
		transition: {
			duration: 0.5,
			ease: [0.22, 1, 0.36, 1],
		},
	},
};
</script>

<style scoped>
.result-card {
	border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
	background: var(--card);
}
</style>
