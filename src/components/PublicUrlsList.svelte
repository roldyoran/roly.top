<script lang="ts">
  // Lista pública del index con datos reales del backend
  // (`GET /api/v1/public-links`, sin PII): la misma fuente que el
  // dashboard (`PublicLinksPanel`, ordenada por clics).
  //
  // RENDIMIENTO: isla con `client:visible`, el fetch arranca solo cuando
  // la pestaña entra en viewport. El TTFB/LCP del index no espera al D1;
  // mientras tanto se pintan skeletons del mismo tamaño (sin CLS).
  // El endpoint además lleva caché de borde (60s + SWR 300s).
  import type { PublicLink } from "@/server/domain/url/url.entity";
  import PublicQrDialog from "./PublicQrDialog.svelte";

  interface Props {
    labels: {
      copy: string;
      copied: string;
      copyFailed: string;
      clicks: string;
      visit: string;
      qr: string;
      qrClose: string;
      qrSave: string;
      downloaded: string;
      failed: string;
      empty: string;
      loadError: string;
      retry: string;
    };
    // Cuántas URLs pedir (el endpoint topa en 20).
    limit?: number;
    // Idioma para números y fechas (`es` vs `en`).
    lang?: string;
  }

  let { labels, limit = 10, lang = "es" }: Props = $props();

  type Status = "loading" | "ready" | "empty" | "error";
  let status = $state<Status>("loading");
  let links = $state<PublicLink[]>([]);
  // Código con icono de "copiado" temporal (como `CopyButton`).
  let copiedCode = $state<string | null>(null);
  // Enlace cuyo QR se muestra en el diálogo (null = cerrado).
  let selectedQr = $state<PublicLink | null>(null);

  function shortUrlOf(l: PublicLink): string {
    return `${window.location.origin}/${l.shortCode}`;
  }

  function openQr(l: PublicLink) {
    selectedQr = l;
  }

  function closeQr() {
    selectedQr = null;
  }

  // Derivados para el diálogo (evitan narrowing de uniones en el template).
  const qrShortCode = $derived(selectedQr?.shortCode ?? "");
  const qrShortUrl = $derived(selectedQr ? shortUrlOf(selectedQr) : "");

  const locale = $derived(lang === "en" ? "en-US" : "es-MX");

  function fmtClicks(n: number): string {
    return n.toLocaleString(locale);
  }

  function fmtDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
    return d.toLocaleDateString(locale, { year: "numeric", month: "2-digit", day: "2-digit" });
  }

  function showToast(title: string, variant: "success" | "error" = "success") {
    const manager = window.__starwindRuntime__?.toast;
    if (manager) manager.add({ title, variant });
  }

  async function load() {
    status = "loading";
    try {
      const res = await fetch(`/api/v1/public-links?page=1&limit=${limit}`);
      if (!res.ok) throw new Error(`public-links ${res.status}`);
      const json = await res.json();
      const data = (json?.data ?? []) as PublicLink[];
      links = data;
      status = data.length === 0 ? "empty" : "ready";
      // El badge de la pestaña (`UrlTabs`) muestra el total real.
      window.dispatchEvent(
        new CustomEvent("roly:public-count", {
          detail: { total: json?.pagination?.total ?? data.length },
        }),
      );
    } catch (err) {
      console.error("[public-urls]", err);
      status = "error";
    }
  }

  async function copyLink(l: PublicLink) {
    const value = `${window.location.origin}/${l.shortCode}`;
    try {
      await navigator.clipboard.writeText(value);
      copiedCode = l.shortCode;
      window.setTimeout(() => {
        if (copiedCode === l.shortCode) copiedCode = null;
      }, 1500);
      showToast(labels.copied, "success");
    } catch {
      showToast(labels.copyFailed, "error");
    }
  }

  // `client:visible` hidrata al entrar en viewport; ahí arranca el fetch.
  $effect(() => {
    void load();
  });
</script>

{#if status === "loading"}
  <div class="space-y-3 sm:space-y-1.5" aria-busy="true" aria-label="loading">
    {#each Array(5) as _}
      <div class="rounded-xl border border-border/50 bg-muted/20 p-4 sm:border-transparent sm:bg-transparent sm:p-3 sm:px-4 sm:py-3">
        <div class="flex flex-col gap-3 sm:hidden">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="h-5 w-2/3 animate-pulse rounded bg-muted"></div>
              <div class="mt-1.5 h-3.5 w-full animate-pulse rounded bg-muted/60"></div>
            </div>
            <div class="h-7 w-12 shrink-0 animate-pulse rounded bg-muted"></div>
          </div>
          <div class="h-3 w-24 animate-pulse rounded bg-muted/60"></div>
          <div class="flex items-center gap-2 border-t border-border/50 pt-3">
            <div class="h-8 flex-1 animate-pulse rounded-md bg-muted/60"></div>
            <div class="h-8 flex-1 animate-pulse rounded-md bg-muted/60"></div>
            <div class="h-8 flex-1 animate-pulse rounded-md bg-muted/60"></div>
          </div>
        </div>
        <div class="hidden flex-row items-center gap-4 sm:flex">
          <div class="min-w-0 flex-1">
            <div class="h-6 w-1/3 animate-pulse rounded bg-muted"></div>
            <div class="mt-1.5 h-3.5 w-2/3 animate-pulse rounded bg-muted/60"></div>
            <div class="mt-1.5 h-3 w-28 animate-pulse rounded bg-muted/60"></div>
          </div>
          <div class="h-8 w-40 shrink-0 animate-pulse rounded bg-muted/60"></div>
        </div>
      </div>
    {/each}
  </div>
{:else if status === "error"}
  <div class="flex flex-col items-center justify-center gap-3 py-10 text-center">
    <p class="text-sm text-muted-foreground">{labels.loadError}</p>
    <button
      type="button"
      onclick={() => void load()}
      class="inline-flex h-9 items-center rounded-lg border border-border/60 px-4 font-mono text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
    >
      {labels.retry}
    </button>
  </div>
{:else if status === "empty"}
  <p class="py-10 text-center text-sm text-muted-foreground">{labels.empty}</p>
{:else}
  <div class="space-y-3 sm:space-y-1.5">
    {#each links as item (item.shortCode)}
      {@const shortHost = typeof window !== "undefined" ? window.location.host : ""}
      <div class="group rounded-xl border border-border/50 bg-muted/20 p-4 transition-all hover:border-border hover:bg-muted/40 sm:border-transparent sm:bg-transparent sm:p-3 sm:px-4 sm:py-3 sm:hover:border-border sm:hover:bg-muted/40">
        <!-- Mobile layout (base) -->
        <div class="flex flex-col gap-3 sm:hidden">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="truncate font-mono text-base font-bold text-primary">
                  {shortHost}/{item.shortCode}
                </span>
                <button
                  type="button"
                  aria-label={labels.copy}
                  data-tip={labels.copy}
                  onclick={() => void copyLink(item)}
                  class="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  {#if copiedCode === item.shortCode}
                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l5 5l10 -10" /></svg>
                  {:else}
                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" /><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" /></svg>
                  {/if}
                </button>
              </div>
              <p class="mt-1 max-w-md truncate font-mono text-xs text-muted-foreground/70" title={item.originalUrl}>
                {item.originalUrl}
              </p>
            </div>
            <div class="shrink-0 text-right">
              <span class="font-display block text-xl font-extrabold text-foreground tabular-nums">
                {fmtClicks(item.clicks)}
              </span>
              <span class="font-mono text-[10px] text-muted-foreground">
                {labels.clicks}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 text-muted-foreground/50">
            <svg class="size-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M11 15h1" /><path d="M12 15v3" /></svg>
            <span class="font-mono text-[10px]">{fmtDate(item.createdAt)}</span>
          </div>
          <div class="flex items-center gap-2 border-t border-border/50 pt-3">
            <button
              type="button"
              onclick={() => openQr(item)}
              aria-label={labels.qr}
              data-tip={labels.qr}
              class="flex flex-1 items-center justify-center gap-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" /><path d="M7 17l0 .01" /><path d="M14 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" /><path d="M7 7l0 .01" /><path d="M4 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" /><path d="M17 7l0 .01" /><path d="M14 14l3 0" /><path d="M20 14l0 .01" /><path d="M14 14l0 3" /><path d="M14 20l3 0" /><path d="M17 17l3 0" /><path d="M20 17l0 3" /></svg>
              <span class="font-mono text-[11px]">{labels.qr}</span>
            </button>
            <a
              href={item.originalUrl}
              target="_blank"
              rel="noopener"
              aria-label={labels.visit}
              data-tip={labels.visit}
              class="flex flex-1 items-center justify-center gap-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>
              <span class="font-mono text-[11px]">{labels.visit}</span>
            </a>
            <button
              type="button"
              onclick={() => void copyLink(item)}
              aria-label={labels.copy}
              data-tip={copiedCode === item.shortCode ? labels.copied : labels.copy}
              class="flex flex-1 items-center justify-center gap-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              {#if copiedCode === item.shortCode}
                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l5 5l10 -10" /></svg>
              {:else}
                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" /><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" /></svg>
              {/if}
              <span class="font-mono text-[11px]">{copiedCode === item.shortCode ? labels.copied : labels.copy}</span>
            </button>
          </div>
        </div>

        <!-- Desktop layout -->
        <div class="hidden flex-row items-center gap-4 sm:flex">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="truncate font-mono text-xl font-bold text-primary">
                {shortHost}/{item.shortCode}
              </span>
              <button
                type="button"
                title={labels.copy}
                aria-label={labels.copy}
                data-tip={labels.copy}
                onclick={() => void copyLink(item)}
                class="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary [&_svg]:size-3.5"
              >
                {#if copiedCode === item.shortCode}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l5 5l10 -10" /></svg>
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" /><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" /></svg>
                {/if}
              </button>
            </div>
            <p class="mt-0.5 max-w-md truncate font-mono text-xs text-muted-foreground/70" title={item.originalUrl}>
              {item.originalUrl}
            </p>
            <div class="mt-1 flex items-center gap-1.5 text-muted-foreground/50">
              <svg class="size-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M11 15h1" /><path d="M12 15v3" /></svg>
              <span class="font-mono text-[10px]">{fmtDate(item.createdAt)}</span>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <div class="text-right">
              <span class="font-display block text-lg font-extrabold text-foreground tabular-nums">
                {fmtClicks(item.clicks)}
              </span>
              <span class="font-mono text-[10px] text-muted-foreground">
                {labels.clicks}
              </span>
            </div>
            <div class="h-6 w-px bg-border" aria-hidden="true"></div>
            <div class="flex items-center gap-4">
              <button
                type="button"
                onclick={() => openQr(item)}
                aria-label={labels.qr}
                data-tip={labels.qr}
                class="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" /><path d="M7 17l0 .01" /><path d="M14 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" /><path d="M7 7l0 .01" /><path d="M4 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4" /><path d="M17 7l0 .01" /><path d="M14 14l3 0" /><path d="M20 14l0 .01" /><path d="M14 14l0 3" /><path d="M14 20l3 0" /><path d="M17 17l3 0" /><path d="M20 17l0 3" /></svg>
              </button>
              <a
                href={item.originalUrl}
                target="_blank"
                rel="noopener"
                aria-label={labels.visit}
                data-tip={labels.visit}
                class="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>
              </a>
              <button
                type="button"
                aria-label={labels.copy}
                data-tip={labels.copy}
                onclick={() => void copyLink(item)}
                class="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {#if copiedCode === item.shortCode}
                  <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12l5 5l10 -10" /></svg>
                {:else}
                  <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" /><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" /></svg>
                {/if}
              </button>
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
  {#if selectedQr}
    <PublicQrDialog
      shortCode={qrShortCode}
      shortUrl={qrShortUrl}
      labels={{
        qr: labels.qr,
        save: labels.qrSave,
        copy: labels.copy,
        copied: labels.copied,
        copyFailed: labels.copyFailed,
        downloaded: labels.downloaded,
        failed: labels.failed,
        retry: labels.retry,
        close: labels.qrClose,
      }}
      onclose={closeQr}
    />
  {/if}
{/if}

<style>
  /* Tooltips CSS-only para las acciones (solo donde hay hover real;
     en táctil no se muestran y quedan title/aria-label). */
  @media (hover: hover) {
    [data-tip] {
      position: relative;
    }
    [data-tip]:hover::after,
    [data-tip]:focus-visible::after {
      content: attr(data-tip);
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%) translateY(2px);
      z-index: 30;
      padding: 4px 8px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--popover, var(--card));
      color: var(--foreground);
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 0.04em;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      animation: public-tip-in 0.15s ease forwards;
    }
  }

  @keyframes public-tip-in {
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-tip]:hover::after,
    [data-tip]:focus-visible::after {
      animation: none;
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
</style>
