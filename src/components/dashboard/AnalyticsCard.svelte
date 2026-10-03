<script lang="ts">
  // Tipos únicos del dashboard (ver `src/shared/dashboard.ts`) y cliente
  // HTTP centralizado (ver `src/lib/api-client.ts`).
  import type { DashboardClicksByDay, DashboardSummary } from "@/shared/dashboard";
  import { apiFetch, ApiError } from "@/lib/api-client";

  type Range = "7d" | "30d" | "90d";
  type RangeDays = 7 | 30 | 90;

  type SeriesPoint = DashboardClicksByDay;

  interface Props {
    labels: {
      title?: string;
      totalClicks?: string;
      range7d?: string;
      range30d?: string;
      range90d?: string;
    };
    series: SeriesPoint[];
    // Idioma para formatear números (`es-MX` vs `en-US`).
    lang?: string;
    // Mensaje cuando el rango no tiene ningún clic.
    emptyLabel?: string;
  }

  const RANGES: { id: Range; days: RangeDays; labelKey: keyof Props["labels"] }[] = [
    { id: "7d", days: 7, labelKey: "range7d" },
    { id: "30d", days: 30, labelKey: "range30d" },
    { id: "90d", days: 90, labelKey: "range90d" },
  ];

  const W = 720;
  const H = 200;
  const PAD = { top: 16, right: 8, bottom: 22, left: 28 };

let { labels, series, lang = "es", emptyLabel = "Sin datos" }: Props = $props();

let range = $state<Range>("7d");
let loading = $state(false);
let fetchedSeries = $state<SeriesPoint[] | null>(null);

const currentSeries = $derived(fetchedSeries ?? series);

function fmtDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function fmtDayShort(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(8, 10);
    return d.toLocaleDateString(undefined, { day: "2-digit" });
  }

async function fetchRange(next: Range) {
  const days = RANGES.find((r) => r.id === next)?.days ?? 7;
  loading = true;
  try {
    // `apiFetch` ya incluye las cookies de sesión y lanza `ApiError`
    // tipado si el backend responde 401/429/500.
    const json = await apiFetch<{ data?: DashboardSummary }>(
      "/api/v1/dashboard/summary",
      { query: { rangeDays: days } },
    );
    const nextData = json.data?.clicksByDay;
    if (nextData) fetchedSeries = nextData;
  } catch (err) {
    // keep current series on failure; loguear para depurar sin romper la UI
    if (err instanceof ApiError) console.error("[analytics]", err.code, err.message);
  } finally {
    loading = false;
  }
}

  let hoveredIndex = $state<number | null>(null);

  const total = $derived(currentSeries.reduce((acc, p) => acc + p.clicks, 0));
  // Rango vacío: la línea quedaría plana en cero; mostrar mensaje.
  const isEmpty = $derived(currentSeries.length > 0 && total === 0);
  const innerW = $derived(W - PAD.left - PAD.right);
  const innerH = $derived(H - PAD.top - PAD.bottom);
  const maxVal = $derived(
    Math.max(1, ...currentSeries.map((p) => p.clicks)) * 1.2,
  );

  const points = $derived(
    currentSeries.map((p, i) => {
      const denom = Math.max(1, currentSeries.length - 1);
      const x = PAD.left + (innerW * i) / denom;
      const y = PAD.top + innerH - (p.clicks / maxVal) * innerH;
      return { x, y, date: p.date, value: p.clicks };
    }),
  );

  function smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length === 0) return "";
    const d = [`M ${pts[0].x} ${pts[0].y}`];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d.push(`C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`);
    }
    return d.join(" ");
  }

  function areaPath(pts: { x: number; y: number }[]): string {
    const line = smoothPath(pts);
    if (!line) return "";
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L ${last.x} ${PAD.top + innerH} L ${first.x} ${PAD.top + innerH} Z`;
  }

  const lineD = $derived(smoothPath(points));
  const areaD = $derived(areaPath(points));

  function fmt(n: number) {
    // Antes hardcodeado a `en-US`: respeta el idioma del dashboard.
    return n.toLocaleString(lang === "en" ? "en-US" : "es-MX");
  }

  function onPickRange(next: Range) {
    range = next;
    void fetchRange(next);
  }

  const xTickStep = $derived(Math.max(1, Math.ceil(currentSeries.length / 7)));
</script>

<div class="flex min-w-0 flex-col gap-3">
  <header class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-baseline gap-2">
      <span class="text-sm text-muted-foreground">{labels.totalClicks ?? "Total clicks"}:</span>
      <span class="font-display text-xl font-bold text-foreground tracking-tight">{fmt(total)}</span>
      {#if loading}
        <!-- Skeleton durante el refetch (antes unos "…" estáticos) -->
        <span class="inline-block h-4 w-16 animate-pulse rounded bg-muted" aria-label="loading"></span>
      {/if}
    </div>

    <div class="flex flex-wrap items-center gap-4">
      <div class="inline-flex items-center gap-1" role="tablist" aria-label="Range">
        {#each RANGES as r}
          <button
            type="button"
            role="tab"
            aria-selected={range === r.id}
            class="px-2 py-1 rounded-md text-xs text-muted-foreground transition-colors hover:text-foreground {range === r.id ? 'text-foreground' : ''}"
            onclick={() => onPickRange(r.id)}
          >
            {labels[r.labelKey] ?? r.id}
          </button>
        {/each}
      </div>
    </div>
  </header>

  <div class="relative w-full">
    <svg
      viewBox="0 0 {W} {H}"
      preserveAspectRatio="xMidYMid meet"
      class="w-full h-auto block"
      aria-label={labels.title ?? "Trend chart"}
      role="img"
    >
      <defs>
        <linearGradient id="analytics-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="oklch(var(--primary))" stop-opacity="0.55" />
          <stop offset="100%" stop-color="oklch(var(--primary))" stop-opacity="0" />
        </linearGradient>
      </defs>

      {#each [0, 1, 2, 3, 4] as g}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + (innerH * g) / 4}
          y2={PAD.top + (innerH * g) / 4}
          class="stroke-border stroke-1 stroke-dasharray-[3_3] opacity-55"
        />
      {/each}

      {#each [0, 1, 2, 3, 4] as g}
        <text
          x={PAD.left - 8}
          y={PAD.top + (innerH * g) / 4 + 4}
          text-anchor="end"
          class="fill-muted-foreground text-[10px] font-mono"
        >
          {Math.round(maxVal * (1 - g / 4))}
        </text>
      {/each}

      <path d={areaD} fill="url(#analytics-area)" />
      <path d={lineD} class="fill-none stroke-primary stroke-[2.5] stroke-linecap-round stroke-linejoin-round drop-shadow-[0_0_6px_oklch(var(--primary)/0.35)]" />

      {#each points as p, i}
        <circle
          cx={p.x}
          cy={p.y}
          r={hoveredIndex === i ? 5 : 3.5}
          class="fill-primary stroke-card stroke-2 cursor-pointer transition-[r] duration-150"
          onmouseenter={() => (hoveredIndex = i)}
          onmouseleave={() => (hoveredIndex = null)}
          onclick={() => (hoveredIndex = hoveredIndex === i ? null : i)}
          onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              hoveredIndex = hoveredIndex === i ? null : i;
            }
          }}
          role="button"
          tabindex="0"
          aria-label="{fmtDate(p.date)} {p.value} clicks"
        />
      {/each}

      {#each points as p, i}
        {#if i % xTickStep === 0 || i === points.length - 1}
          <text
            x={p.x}
            y={H - 6}
            text-anchor="middle"
            class="fill-muted-foreground text-[10px] font-mono"
          >
            {fmtDayShort(p.date)}
          </text>
        {/if}
      {/each}
    </svg>

    {#if hoveredIndex !== null}
      <div
        class="absolute top-0 -translate-x-1/2 flex items-center gap-1.5 rounded-md bg-foreground text-background px-2 py-1 text-[11px] font-mono pointer-events-none whitespace-nowrap"
        style:left={`${(points[hoveredIndex].x / W) * 100}%`}
      >
        <span class="text-background/60">{fmtDate(points[hoveredIndex].date)}</span>
        <span class="font-bold">{points[hoveredIndex].value}</span>
        <span class="text-background/60">clicks</span>
      </div>
    {/if}
    {#if isEmpty && !loading}
      <div class="absolute inset-0 flex items-center justify-center">
        <p class="rounded-full border border-border/60 bg-background/80 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur-sm">
          {emptyLabel}
        </p>
      </div>
    {/if}
  </div>
</div>
