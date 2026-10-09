<script lang="ts">
  // Tipo único del top de enlaces (ver `src/shared/dashboard.ts`).
  import type { DashboardTopLink } from "@/shared/dashboard";

  interface Props {
    labels: {
      title?: string;
    };
    topLinks: DashboardTopLink[];
    emptyLabel?: string;
  }

  let { labels, topLinks, emptyLabel = "No data yet" }: Props = $props();

  const rows = $derived(topLinks);
  const max = $derived(
    Math.max(1, ...rows.map((r) => r.clicks)),
  );
</script>

<div class="flex min-w-0 flex-col gap-3 border-t border-border/50 pt-4">
  <h3 class="font-display text-sm font-bold tracking-tight text-foreground">{labels.title ?? "Top links"}</h3>

  {#if rows.length === 0}
    <p class="text-[13px] text-muted-foreground text-center py-6">{emptyLabel}</p>
  {:else}
    <ol class="flex flex-col gap-2.5">
      {#each rows as row, i}
        {@const pct = (row.clicks / max) * 100}
        <li class="grid grid-cols-[1.25rem_1fr_auto] items-center gap-2.5">
          <span class="font-mono text-[11px] text-muted-foreground/70 text-center">{i + 1}</span>
          <div class="relative flex items-center">
            <div class="relative h-5 w-full rounded-full bg-muted/50 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-primary to-primary/85 rounded-full shadow-[0_0_12px_oklch(var(--primary)/0.25)]"
                style:width={`${pct}%`}
                style:transition="width 600ms cubic-bezier(0.22, 1, 0.36, 1)"
              ></div>
            </div>
            <div class="absolute inset-0 flex items-center px-2.5 pointer-events-none">
              <span class="font-mono text-[11px] text-primary-foreground font-semibold drop-shadow-sm">{row.shortCode}</span>
            </div>
          </div>
          <span class="font-display text-sm font-bold text-foreground min-w-9 text-right">{row.clicks}</span>
        </li>
      {/each}
    </ol>
  {/if}
</div>
