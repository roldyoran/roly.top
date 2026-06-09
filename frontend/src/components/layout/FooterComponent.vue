<template>
  <footer class="border-t bg-gradient-to-b from-background/80 to-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 mt-auto">
    <div class="container mx-auto px-4">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
            <Link class="w-3 h-3 text-primary-foreground" />
          </div>
          <h3 class="font-bold text-sm">roly.top</h3>
          <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
            <span>{{ attempts.toLocaleString() }} URLs</span>
          </div>
        </div>

        <div class="flex items-center gap-4 text-xs text-muted-foreground">
          <span>&copy; {{ currentYear }} roly.top · roldyoran</span>
          <div class="w-px h-3 bg-border"></div>
          <a
            href="https://github.com/roldyoran/shorturl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Github class="w-3 h-3" />
            <span>Open Source</span>
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Link, Github } from "lucide-vue-next";

interface Props {
	attempts: number;
}

defineProps<Props>();

const currentYear = computed(() =>
	new Intl.DateTimeFormat("es-ES", { year: "numeric" }).format(new Date()),
);
</script>
