<script lang="ts">
  // Escáner QR público (tab "Escanear QR" del index): pega (Ctrl+V o botón),
  // arrastra o suelta una imagen y decodifica el QR en el navegador.
  //
  // 100% CLIENTE: `jsqr` se importa de forma dinámica al primer escaneo y
  // la isla usa `client:visible`, así que el peso solo se descarga al usar
  // el tab. Decisiones puras testeadas en `src/lib/qr-scan.ts` (qué es
  // imagen, qué enlace es seguro pintar, intentos de escalado).
  import { onMount } from "svelte";
  import {
    firstImageIndex,
    isHttpUrl,
    isImageType,
    pickImageType,
    scaledAttempts,
  } from "@/lib/qr-scan";

  interface Labels {
    title: string;
    desc: string;
    paste: string;
    upload: string;
    clear: string;
    result: string;
    copy: string;
    copied: string;
    openLink: string;
    emptyResult: string;
    noImageYet: string;
    dropHint: string;
    httpsNote: string;
    statusReady: string;
    statusReading: string;
    statusAnalyzing: string;
    statusNoImage: string;
    statusUnsupported: string;
    statusDenied: string;
    statusClipboardEmpty: string;
    statusNoQr: string;
    statusDone: string;
    statusError: string;
    statusReadError: string;
    statusCopyError: string;
  }

  interface Props {
    labels: Labels;
  }

  let { labels }: Props = $props();

  type StatusTone = "info" | "ok" | "error" | "busy";

  const TONES: Record<StatusTone, string> = {
    info: "text-muted-foreground",
    ok: "text-primary",
    error: "text-error",
    busy: "text-amber-400",
  };

  const MAX_SIDE = 1400;

  let previewUrl = $state<string | null>(null);
  let result = $state("");
  let statusMsg = $state(labels.statusReady);
  let statusTone = $state<StatusTone>("info");
  let busy = $state(false);
  let copied = $state(false);

  let canvas: HTMLCanvasElement | null = null;
  let jsQrMod: typeof import("jsqr") | null = null;
  let fileInput: HTMLInputElement | undefined = $state(undefined);

  function setStatus(msg: string, tone: StatusTone = "info") {
    statusMsg = msg;
    statusTone = tone;
  }

  async function decode(blob: Blob): Promise<string | null> {
    if (!jsQrMod) jsQrMod = await import("jsqr");
    if (!canvas) {
      canvas = document.createElement("canvas");
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = url;
      if (img.decode) {
        await img.decode();
      } else {
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error("decode"));
        });
      }
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) return null;
      // Intento rápido escalado + reintento a tamaño real (ver qr-scan).
      for (const size of scaledAttempts(w, h, MAX_SIDE)) {
        canvas.width = size.width;
        canvas.height = size.height;
        ctx.clearRect(0, 0, size.width, size.height);
        ctx.drawImage(img, 0, 0, size.width, size.height);
        const pixels = ctx.getImageData(0, 0, size.width, size.height);
        const code = jsQrMod.default(pixels.data, size.width, size.height, {
          inversionAttempts: "attemptBoth",
        });
        if (code?.data) return code.data;
      }
      return null;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function processBlob(blob: Blob | null) {
    if (!blob || !isImageType(blob.type)) {
      setStatus(labels.statusNoImage, "error");
      return;
    }
    setStatus(labels.statusAnalyzing, "busy");
    busy = true;
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(blob);
      const code = await decode(blob);
      if (code) {
        result = code;
        copied = false;
        setStatus(labels.statusDone, "ok");
      } else {
        result = "";
        setStatus(labels.statusNoQr, "error");
      }
    } catch (err) {
      console.error(err);
      result = "";
      setStatus(labels.statusError, "error");
    } finally {
      busy = false;
    }
  }

  async function readClipboardImage() {
    if (!navigator.clipboard || !("read" in navigator.clipboard)) {
      setStatus(labels.statusUnsupported, "error");
      return;
    }
    try {
      setStatus(labels.statusReading, "busy");
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = pickImageType(item.types);
        if (imageType) {
          await processBlob(await item.getType(imageType));
          return;
        }
      }
      setStatus(labels.statusClipboardEmpty, "error");
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setStatus(labels.statusDenied, "error");
      } else {
        setStatus(
          `${labels.statusReadError}${err instanceof Error ? `: ${err.message}` : ""}`,
          "error",
        );
      }
    }
  }

  function clearAll() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
    result = "";
    copied = false;
    if (fileInput) fileInput.value = "";
    setStatus(labels.statusReady);
  }

  function openPicker() {
    fileInput?.click();
  }

  async function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement | null;
    const files = input?.files ? Array.from(input.files) : [];
    if (!files.length) return;
    // Con varios archivos se escanea la primera imagen; si no hay
    // ninguna se informa del tipo inválido igual que al pegar.
    const idx = firstImageIndex(files);
    await processBlob(files[idx >= 0 ? idx : 0]);
    if (input) input.value = "";
  }

  async function copyResult() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      copied = true;
      window.setTimeout(() => (copied = false), 1200);
    } catch {
      setStatus(labels.statusCopyError, "error");
    }
  }

  onMount(() => {
    // Fallback Ctrl+V en cualquier parte de la página.
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (isImageType(item.type)) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) void processBlob(file);
          return;
        }
      }
    }

    function handleDrag(e: DragEvent, on: boolean) {
      const zone = document.querySelector("[data-qr-scan-drop]");
      if (e) e.preventDefault();
      zone?.classList.toggle("border-primary/50", on);
      zone?.classList.toggle("bg-primary/5", on);
    }

    function handleDrop(e: DragEvent) {
      handleDrag(e, false);
      const files = e.dataTransfer?.files
        ? Array.from(e.dataTransfer.files)
        : [];
      if (!files.length) return;
      const idx = firstImageIndex(files);
      void processBlob(files[idx >= 0 ? idx : 0]);
    }

    const zone = document.querySelector("[data-qr-scan-drop]");
    const onDragEnter = (e: DragEvent) => handleDrag(e, true);
    const onDragOver = (e: DragEvent) => handleDrag(e, true);
    const onDragLeave = (e: DragEvent) => handleDrag(e, false);

    window.addEventListener("paste", handlePaste as EventListener);
    zone?.addEventListener("dragenter", onDragEnter as EventListener);
    zone?.addEventListener("dragover", onDragOver as EventListener);
    zone?.addEventListener("dragleave", onDragLeave as EventListener);
    zone?.addEventListener("drop", handleDrop as EventListener);
    return () => {
      window.removeEventListener("paste", handlePaste as EventListener);
      zone?.removeEventListener("dragenter", onDragEnter as EventListener);
      zone?.removeEventListener("dragover", onDragOver as EventListener);
      zone?.removeEventListener("dragleave", onDragLeave as EventListener);
      zone?.removeEventListener("drop", handleDrop as EventListener);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  });

  const showLink = $derived(isHttpUrl(result));
</script>

<section aria-label={labels.title} class="mx-auto flex w-full max-w-3xl flex-col gap-5">
  <div class="text-center">
    <h2 class="font-display text-lg font-bold tracking-tight text-foreground">{labels.title}</h2>
    <p class="mt-1 text-xs text-muted-foreground">{labels.desc}</p>
  </div>

  <div class="flex flex-col gap-2">
    <button
      type="button"
      onclick={() => void readClipboardImage()}
      disabled={busy}
      class="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-mono text-xs font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-4"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 5H7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" /><path d="M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2" /><path d="M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2" /></svg>
      {labels.paste}
    </button>
    <div class="flex gap-2">
      <button
        type="button"
        onclick={openPicker}
        disabled={busy}
        class="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border/60 px-4 font-mono text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-4"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M12 17v-6" /><path d="M9.5 14.5l2.5 -2.5l2.5 2.5" /></svg>
        {labels.upload}
      </button>
      <button
        type="button"
        onclick={clearAll}
        class="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border/60 px-4 font-mono text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
      >
        {labels.clear}
      </button>
    </div>
    <input
      type="file"
      accept="image/*"
      class="hidden"
      bind:this={fileInput}
      onchange={(e) => void handleFileInput(e)}
      aria-hidden="true"
      tabindex="-1"
    />
  </div>

  <p class="font-mono text-xs {TONES[statusTone]}" role="status">{statusMsg}</p>

  <div class="grid gap-4 sm:grid-cols-2">
    <div
      data-qr-scan-drop
      role="button"
      tabindex="0"
      aria-label={labels.upload}
      onclick={openPicker}
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPicker();
        }
      }}
      class="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/60 bg-muted/20 transition-all hover:border-primary/40 hover:bg-primary/5 focus-visible:border-primary/40 focus-visible:outline-none"
    >
      {#if previewUrl}
        <img src={previewUrl} class="h-full w-full object-contain" alt="" />
        <span class="pointer-events-none absolute right-3 bottom-3 rounded-md bg-background/80 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur-sm">
          {labels.upload}
        </span>
      {:else}
        <div class="flex flex-col items-center gap-3 px-6 text-center">
          <span class="flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-6 text-primary"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M5 12h14" /><path d="M3 7v-2a2 2 0 0 1 2 -2h2" /><path d="M3 17v2a2 2 0 0 0 2 2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M17 21h2a2 2 0 0 0 2 -2v-2" /></svg>
          </span>
          <span>
            <span class="block font-mono text-xs text-muted-foreground">{labels.noImageYet}</span>
            <span class="mt-1 block font-mono text-[11px] text-muted-foreground/60">{labels.dropHint}</span>
          </span>
        </div>
      {/if}
    </div>

    <div class="flex flex-col gap-2">
      <span class="font-mono text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{labels.result}</span>
      <div class="min-h-32 flex-1 overflow-auto rounded-xl border border-border/60 bg-muted/20 p-4 text-sm break-all whitespace-pre-wrap text-foreground">
        {#if result}
          <p>{result}</p>
          {#if showLink}
            <a
              href={result.trim()}
              target="_blank"
              rel="noopener noreferrer"
              class="mt-3 inline-block font-mono text-xs text-primary underline underline-offset-2 hover:brightness-110"
            >
              {labels.openLink}
            </a>
          {/if}
        {:else}
          <span class="text-muted-foreground/60">{labels.emptyResult}</span>
        {/if}
      </div>
      <button
        type="button"
        onclick={() => void copyResult()}
        disabled={!result}
        class="inline-flex h-9 items-center justify-center rounded-lg border border-border/60 px-3 font-mono text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copied ? labels.copied : labels.copy}
      </button>
    </div>
  </div>

  <p class="text-[11px] leading-relaxed text-muted-foreground/70">{labels.httpsNote}</p>
</section>
