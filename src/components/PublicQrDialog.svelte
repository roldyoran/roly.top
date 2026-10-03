<script lang="ts">
  // Diálogo QR para las URLs públicas del index: genera el código con la
  // misma librería y preset de marca compartido (`src/lib/qr-style.ts`:
  // `qr-code-styling`, logo central `/icon.svg`, verde de alto contraste).
  //
  // SSR-SAFE: la librería toca `canvas`/DOM, así que se importa de forma
  // dinámica solo cuando el diálogo se abre (el peso ~500KB no lastra el
  // primer pintado del index). Mobile-first: bottom-sheet en móvil,
  // modal centrado en desktop.
  import { onMount } from "svelte";
  import { buildBrandedQrOptions } from "@/lib/qr-style";

  interface Props {
    shortCode: string;
    shortUrl: string;
    labels: {
      qr: string;
      save: string;
      copy: string;
      copied: string;
      copyFailed: string;
      downloaded: string;
      failed: string;
      retry: string;
      close: string;
    };
    onclose: () => void;
  }

  let { shortCode, shortUrl, labels, onclose }: Props = $props();

  type QrInstance = InstanceType<typeof import("qr-code-styling").default>;

  let mountEl: HTMLDivElement | undefined = $state(undefined);
  let closeEl: HTMLButtonElement | undefined = $state(undefined);
  let qr = $state<QrInstance | null>(null);
  let ready = $state(false);
  let busy = $state(false);
  let copied = $state(false);
  let failed = $state(false);
  let cancelled = false;

  function notify(title: string, variant: "success" | "error" = "success") {
    window.__starwindRuntime__?.toast?.add({ title, variant });
  }

  // Preset de marca compartido (ver `src/lib/qr-style.ts`).
  function buildOptions(text: string): ConstructorParameters<typeof import("qr-code-styling").default>[0] {
    return buildBrandedQrOptions(text, { size: 240, withLogo: true });
  }

  async function downloadPng() {
    if (!qr || busy) return;
    busy = true;
    try {
      await qr.download({ name: `roly-${shortCode}`, extension: "png" });
      notify(labels.downloaded, "success");
    } catch (err) {
      console.error("[qr-dialog] download png failed", err);
      // Fallback: el SVG no pasa por canvas y casi nunca falla.
      try {
        await qr.download({ name: `roly-${shortCode}`, extension: "svg" });
        notify(labels.downloaded, "success");
      } catch (fallbackErr) {
        console.error("[qr-dialog] download svg fallback failed", fallbackErr);
        notify(labels.failed, "error");
      }
    } finally {
      busy = false;
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      copied = true;
      window.setTimeout(() => (copied = false), 1500);
      notify(labels.copied, "success");
    } catch {
      notify(labels.copyFailed, "error");
    }
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Escape") onclose();
  }

  async function createQr() {
    if (!mountEl || cancelled) return;
    failed = false;
    try {
      const { default: QRCodeStyling } = await import("qr-code-styling");
      if (cancelled || !mountEl) return;
      // Si se reintenta, limpiar el render anterior.
      mountEl.replaceChildren();
      qr = new QRCodeStyling(buildOptions(shortUrl));
      qr.append(mountEl);
      ready = true;
    } catch (err) {
      console.error("[qr-dialog] create failed", err);
      failed = true;
      notify(labels.failed, "error");
    }
  }

  onMount(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    closeEl?.focus();
    void createQr();
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  });
</script>

<div
  class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5"
  role="dialog"
  aria-modal="true"
  aria-label={`${labels.qr}: ${shortCode}`}
>
  <button
    type="button"
    aria-label={labels.close}
    onclick={onclose}
    class="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
  ></button>

  <div class="animate-slide-up relative w-full rounded-t-2xl border border-border bg-card p-5 sm:max-w-sm sm:rounded-2xl sm:p-6">
    <div class="mb-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 class="font-display text-lg font-bold tracking-tight text-foreground">{labels.qr}</h2>
        <p class="mt-0.5 truncate font-mono text-xs text-primary" title={shortUrl}>{shortUrl}</p>
      </div>
      <button
        type="button"
        bind:this={closeEl}
        onclick={onclose}
        aria-label={labels.close}
        title={labels.close}
        class="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
      </button>
    </div>

    <div class="mx-auto flex w-full max-w-70 items-center justify-center rounded-2xl border border-border/60 bg-white p-4">
      {#if failed}
        <div class="flex flex-col items-center gap-3 py-8 text-center">
          <p class="text-sm text-muted-foreground">{labels.failed}</p>
          <button
            type="button"
            onclick={() => void createQr()}
            class="inline-flex h-9 items-center rounded-lg border border-border/60 px-4 font-mono text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            {labels.retry}
          </button>
        </div>
      {:else}
        {#if !ready}
          <div class="flex flex-col items-center gap-3 py-10">
            <svg
              class="size-8 animate-spin text-primary"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        {/if}
        <div bind:this={mountEl} class="flex w-full items-center justify-center [&>canvas]:h-auto [&>canvas]:w-full [&>canvas]:rounded-xl [&>svg]:h-auto [&>svg]:w-full [&>svg]:rounded-xl"></div>
      {/if}
    </div>

    <div class="mt-4 flex gap-2">
      <button
        type="button"
        onclick={() => void downloadPng()}
        disabled={!ready || busy}
        class="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 font-mono text-xs font-bold text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {#if busy}
          <svg
            class="size-3.5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        {/if}
        {labels.save}
      </button>
      <button
        type="button"
        onclick={() => void copyLink()}
        class="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border/60 px-3 font-mono text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
      >
        {copied ? labels.copied : labels.copy}
      </button>
    </div>
  </div>
</div>
