<template>
  <footer class="border-t bg-gradient-to-b from-background/80 to-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 mt-auto">
    <div class="container mx-auto px-4">
      <!-- Mobile: Simple layout -->
      <div class="block md:hidden space-y-4">
        <!-- Logo y contador -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <Link class="w-3 h-3 text-primary-foreground" />
            </div>
            <h3 class="font-bold text-sm">roly.top</h3>
          </div>
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <div class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
            <span>{{ attempts.toLocaleString() }} URLs</span>
          </div>
        </div>
        
        <!-- Stack y GitHub -->
        <div class="flex items-center justify-between">
          <div class="flex flex-wrap gap-1">
            <Badge variant="outline" class="text-xs py-0 px-2">Cloudflare Workers</Badge>
            <Badge variant="secondary" class="text-xs py-0 px-2">Vue 3</Badge>
          </div>
          <a 
            href="https://github.com/roldyoran" 
            target="_blank" 
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 hover:underline transition-all"
          >
            <Github class="w-3 h-3" />
            <span>@roldyoran</span>
          </a>
        </div>
        
        <!-- Copyright -->
        <div class="text-center">
          <p class="text-xs text-muted-foreground">
              &copy; {{ new Intl.DateTimeFormat('es-ES', { year: 'numeric' }).format(new Date()) }} roly.top • Open Source
            </p>
        </div>
      </div>

      <!-- Desktop: Full layout -->
      <div class="hidden md:block">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Logo y descripción -->
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm">
                <Link class="w-4 h-4 text-primary-foreground" />
              </div>
              <h3 class="font-bold text-base">roly.top</h3>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              Acortador de URLs rápido y seguro. 
              <span class="inline-flex items-center gap-1">
                <Zap class="w-3 h-3" />
                Optimizado para velocidad.
              </span>
            </p>
            <div class="flex items-center gap-2 text-xs">
              <div class="flex items-center gap-1">
                <div class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                <span class="text-muted-foreground">Activo</span>
              </div>
              <div class="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
              <span class="text-muted-foreground">{{ attempts.toLocaleString() }} URLs</span>
            </div>
          </div>

          <!-- Stack Frontend -->
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <Code2 class="w-3.5 h-3.5 text-primary" />
              <h4 class="text-xs font-semibold text-foreground">Frontend</h4>
            </div>
            <div class="flex flex-wrap gap-1">
              <Badge variant="secondary" class="text-xs py-0 px-2 hover:bg-primary/10 transition-colors">Vue 3</Badge>
              <Badge variant="secondary" class="text-xs py-0 px-2 hover:bg-primary/10 transition-colors">TypeScript</Badge>
              <Badge variant="secondary" class="text-xs py-0 px-2 hover:bg-primary/10 transition-colors">Tailwind</Badge>
              <Badge variant="secondary" class="text-xs py-0 px-2 hover:bg-primary/10 transition-colors">Shadcn-vue/ui</Badge>
            </div>
          </div>

          <!-- Stack Backend -->
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <Zap class="w-3.5 h-3.5 text-primary" />
              <h4 class="text-xs font-semibold text-foreground">Backend</h4>
            </div>
            <div class="flex flex-wrap gap-1">
              <Badge variant="outline" class="text-xs py-0 px-2 hover:bg-primary/5 transition-colors">Cloudflare Workers</Badge>
              <Badge variant="outline" class="text-xs py-0 px-2 hover:bg-primary/5 transition-colors">D1</Badge>
              <Badge variant="outline" class="text-xs py-0 px-2 hover:bg-primary/5 transition-colors">Hono.js</Badge>
              <Badge variant="outline" class="text-xs py-0 px-2 hover:bg-primary/5 transition-colors">Zod</Badge>
            </div>
          </div>

          <!-- Enlaces -->
          <div class="space-y-3">
            <div class="space-y-2">
              <a 
                href="https://github.com/roldyoran" 
                target="_blank" 
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-all duration-300 group hover:underline "
              >
                <Github class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span class="transition-all">@roldyoran</span>
              </a>
              <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Heart class="w-3 h-3 text-red-500 animate-pulse" />
                <span>Open Source</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Separador y pie -->
        <div class="border-t mt-6 pt-4">
          <div class="flex flex-col md:flex-row justify-between items-center gap-3">
            <p class="text-xs text-muted-foreground">
              &copy; {{ new Intl.DateTimeFormat('es-ES', { year: 'numeric' }).format(new Date()) }} roly.top • API & Frontend
            </p>
            
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                <span class="text-xs text-muted-foreground">En línea</span>
                <span class="text-xs font-medium text-foreground ml-2">
                  {{ attempts.toLocaleString() }} URLs
                </span>
              </div>
              
              <div class="flex items-center gap-1">
                <div class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <span class="text-xs text-muted-foreground">v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { Link, Github, Heart, Code2, Zap } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";

// Props
interface Props {
	attempts: number;
}

defineProps<Props>();
</script>