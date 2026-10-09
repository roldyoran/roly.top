<script lang="ts">
  // Generador QR público multitipo (tab "Generador QR" del index).
  //
  // 100% ANÓNIMO Y CLIENTE: no hay fetch ni guardado, todo se construye en
  // el navegador con `buildQrPayload` y se renderiza con el preset de marca
  // compartido (`buildBrandedQrOptions`: verde #1a2e05, extra-redondeado,
  // fondo blanco, EC H).
  //
  // SSR-SAFE + RENDIMIENTO: `qr-code-styling` (~500KB) se importa de forma
  // dinámica en `onMount`; la isla usa `client:visible` así que el peso solo
  // se descarga al entrar en viewport. Mobile-first: preview arriba,
  // formulario debajo; en `sm:` dos columnas (preview + formulario).
  import { onMount } from "svelte";
  import {
    buildQrPayload,
    qrFileBase,
    EMPTY_QR_FIELDS,
    type QrFields,
    type QrType,
  } from "@/lib/qr-payload";
  import { buildBrandedQrOptions } from "@/lib/qr-style";

  interface Labels {
    title: string;
    desc: string;
    typeLabel: string;
    typeUrl: string;
    typeText: string;
    typeWifi: string;
    typeVcard: string;
    typeEmail: string;
    typeSms: string;
    typePhone: string;
    typeWhatsapp: string;
    typeGeo: string;
    fieldUrl: string;
    fieldUrlPh: string;
    fieldText: string;
    fieldTextPh: string;
    fieldSsid: string;
    fieldSsidPh: string;
    fieldPassword: string;
    fieldPasswordPh: string;
    fieldSecurity: string;
    secWpa: string;
    secWep: string;
    secOpen: string;
    fieldHidden: string;
    fieldFirstName: string;
    fieldLastName: string;
    fieldVcardPhone: string;
    fieldVcardEmail: string;
    fieldOrg: string;
    fieldEmailTo: string;
    fieldSubject: string;
    fieldBody: string;
    fieldSmsNumber: string;
    fieldSmsMessage: string;
    fieldPhoneNumber: string;
    fieldWaNumber: string;
    fieldWaNumberPh: string;
    fieldWaMessage: string;
    fieldLat: string;
    fieldLng: string;
    logo: string;
    invalid: string;
    current: string;
    png: string;
    svg: string;
    copy: string;
    copied: string;
    downloaded: string;
    failed: string;
    loading: string;
  }

  interface Props {
    labels: Labels;
  }

  let { labels }: Props = $props();

  type QrInstance = InstanceType<typeof import("qr-code-styling").default>;
  type QrClass = typeof import("qr-code-styling").default;

  const TYPES: { id: QrType; label: keyof Labels }[] = [
    { id: "url", label: "typeUrl" },
    { id: "text", label: "typeText" },
    { id: "wifi", label: "typeWifi" },
    { id: "vcard", label: "typeVcard" },
    { id: "email", label: "typeEmail" },
    { id: "sms", label: "typeSms" },
    { id: "phone", label: "typePhone" },
    { id: "whatsapp", label: "typeWhatsapp" },
    { id: "geo", label: "typeGeo" },
  ];

  const FALLBACK = "https://roly.top";

  let qrType = $state<QrType>("url");
  let fields = $state<QrFields>({ ...EMPTY_QR_FIELDS });
  let showLogo = $state(true);

  let mountEl: HTMLDivElement | undefined = $state(undefined);
  let qr = $state<QrInstance | null>(null);
  let QrCtor = $state<QrClass | null>(null);
  let ready = $state(false);
  let busy = $state<"png" | "svg" | null>(null);
  let copied = $state(false);

  const payload = $derived(buildQrPayload(qrType, fields));
  const valid = $derived(payload.length > 0);
  // Preview nunca vacío: si el form está incompleto se muestra el fallback
  // (la descarga/copia se deshabilitan hasta que sea válido).
  const renderData = $derived(valid ? payload : FALLBACK);
  const fileBase = $derived(qrFileBase(qrType));

  const inputCls =
    "h-10 w-full rounded-lg border border-input bg-transparent px-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:border-primary/40";
  const labelCls =
    "font-mono text-[11px] font-medium tracking-wider text-muted-foreground uppercase";

  function notify(title: string, variant: "success" | "error" = "success") {
    window.__starwindRuntime__?.toast?.add({ title, variant });
  }

  onMount(() => {
    let cancelled = false;
    // Las filas de "Mis enlaces" y "Enlaces Públicos" (dashboard)
    // pre-rellenan el generador disparando `roly:qr-generate` con la URL
    // corta: se mapea al tipo URL.
    function handleQrGenerate(e: Event) {
      const url = (e as CustomEvent<{ url?: string }>).detail?.url;
      if (typeof url === "string" && url.trim()) {
        qrType = "url";
        fields.url = url.trim();
      }
    }
    window.addEventListener("roly:qr-generate", handleQrGenerate);
    (async () => {
      const { default: QRCodeStyling } = await import("qr-code-styling");
      if (cancelled || !mountEl) return;
      QrCtor = QRCodeStyling;
      qr = new QRCodeStyling(buildBrandedQrOptions(renderData, { withLogo: showLogo }));
      qr.append(mountEl);
      ready = true;
    })().catch(() => {
      // Sin generador (bundle falló): se queda el loader + reintento.
    });
    return () => {
      cancelled = true;
      window.removeEventListener("roly:qr-generate", handleQrGenerate);
    };
  });

  // Redibuja el contenido al escribir/cambiar de tipo (sin recrear).
  $effect(() => {
    const text = renderData;
    if (qr) qr.update({ data: text });
  });

  // El logo central se alterna recreando la instancia (el `update` parcial
  // de `image` no limpia el logo previo de forma fiable entre versiones).
  function toggleLogo() {
    showLogo = !showLogo;
    if (qr && QrCtor && mountEl) {
      try {
        mountEl.replaceChildren();
        qr = new QrCtor(buildBrandedQrOptions(renderData, { withLogo: showLogo }));
        qr.append(mountEl);
      } catch {
        notify(labels.failed, "error");
      }
    }
  }

  async function download(ext: "png" | "svg") {
    if (!qr || busy || !valid) return;
    busy = ext;
    try {
      await qr.download({ name: `roly-${fileBase}`, extension: ext });
      notify(labels.downloaded, "success");
    } catch {
      notify(labels.failed, "error");
    } finally {
      busy = null;
    }
  }

  async function copyPayload() {
    if (!valid) return;
    try {
      await navigator.clipboard.writeText(payload);
      copied = true;
      window.setTimeout(() => (copied = false), 1500);
      notify(labels.copied, "success");
    } catch {
      notify(labels.failed, "error");
    }
  }
</script>

<section aria-label={labels.title} class="mx-auto flex w-full max-w-3xl flex-col gap-5">
  <div class="text-center">
    <h2 class="font-display text-lg font-bold tracking-tight text-foreground">{labels.title}</h2>
    <p class="mt-1 text-xs text-muted-foreground">{labels.desc}</p>
  </div>

  <!-- Selector de tipo: grid 3 cols en móvil, wrap en desktop -->
  <div class="flex flex-col gap-2">
    <div role="tablist" aria-label={labels.typeLabel} class="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:justify-center">
      {#each TYPES as t (t.id)}
        <button
          type="button"
          role="tab"
          aria-selected={qrType === t.id}
          onclick={() => (qrType = t.id)}
          class="h-9 rounded-lg border px-2 font-mono text-[11px] font-semibold transition-colors {qrType === t.id
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
        >
          {labels[t.label]}
        </button>
      {/each}
    </div>
  </div>

  <div class="grid grid-cols-1 gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
    <!-- Preview con estilo de marca -->
    <div class="flex flex-col items-center gap-2">
      <div class="mx-auto flex w-full max-w-80 items-center justify-center rounded-2xl border border-border/60 bg-white p-4 sm:mx-0 sm:w-72">
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
            <p class="animate-pulse font-mono text-xs text-muted-foreground">{labels.loading}</p>
          </div>
        {/if}
        <div bind:this={mountEl} class="flex w-full items-center justify-center [&>canvas]:h-auto [&>canvas]:w-full [&>canvas]:rounded-xl [&>svg]:h-auto [&>svg]:w-full [&>svg]:rounded-xl"></div>
      </div>
      {#if ready}
        <p class="w-full max-w-80 truncate text-center font-mono text-[11px] text-muted-foreground sm:text-left" title={valid ? payload : FALLBACK}>
          <span class="text-muted-foreground/60">{labels.current}: </span>{valid ? payload : FALLBACK}
        </p>
      {/if}
      <!-- Toggle logo central -->
      <button
        type="button"
        role="switch"
        aria-checked={showLogo}
        onclick={toggleLogo}
        class="flex items-center gap-2.5 select-none"
      >
        <span
          aria-hidden="true"
          class="relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-full border border-transparent transition-colors {showLogo ? 'bg-primary' : 'bg-muted'}"
        >
          <span
            class="inline-block size-4.5 rounded-full bg-white shadow transition-transform {showLogo ? 'translate-x-5' : 'translate-x-0.5'}"
          ></span>
        </span>
        <span class="font-mono text-[11px] text-muted-foreground">{labels.logo}</span>
      </button>
    </div>

    <!-- Formulario dinámico por tipo -->
    <div class="flex min-w-0 flex-col gap-3">
      {#if qrType === "url"}
        <label class="flex flex-col gap-1.5">
          <span class={labelCls}>{labels.fieldUrl}</span>
          <input type="url" bind:value={fields.url} placeholder={labels.fieldUrlPh} class={inputCls} autocomplete="off" spellcheck="false" />
        </label>
      {:else if qrType === "text"}
        <label class="flex flex-col gap-1.5">
          <span class={labelCls}>{labels.fieldText}</span>
          <textarea bind:value={fields.text} placeholder={labels.fieldTextPh} rows="4" class="{inputCls} h-auto min-h-24 py-2.5"></textarea>
        </label>
      {:else if qrType === "wifi"}
        <label class="flex flex-col gap-1.5">
          <span class={labelCls}>{labels.fieldSsid}</span>
          <input type="text" bind:value={fields.ssid} placeholder={labels.fieldSsidPh} class={inputCls} autocomplete="off" />
        </label>
        <div class="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          <label class="flex flex-col gap-1.5">
            <span class={labelCls}>{labels.fieldPassword}</span>
            <input type="password" bind:value={fields.password} placeholder={labels.fieldPasswordPh} class={inputCls} autocomplete="off" disabled={fields.security === "nopass"} />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class={labelCls}>{labels.fieldSecurity}</span>
            <select bind:value={fields.security} class="{inputCls} bg-card">
              <option value="WPA">{labels.secWpa}</option>
              <option value="WEP">{labels.secWep}</option>
              <option value="nopass">{labels.secOpen}</option>
            </select>
          </label>
        </div>
        <label class="flex cursor-pointer items-center gap-2 font-mono text-xs text-muted-foreground select-none">
          <input type="checkbox" bind:checked={fields.hidden} class="size-4 accent-lime-400" />
          {labels.fieldHidden}
        </label>
      {:else if qrType === "vcard"}
        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1.5">
            <span class={labelCls}>{labels.fieldFirstName}</span>
            <input type="text" bind:value={fields.firstName} class={inputCls} autocomplete="given-name" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class={labelCls}>{labels.fieldLastName}</span>
            <input type="text" bind:value={fields.lastName} class={inputCls} autocomplete="family-name" />
          </label>
        </div>
        <label class="flex flex-col gap-1.5">
          <span class={labelCls}>{labels.fieldVcardPhone}</span>
          <input type="tel" bind:value={fields.vcardPhone} placeholder="+34 600 123 456" class={inputCls} autocomplete="tel" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class={labelCls}>{labels.fieldVcardEmail}</span>
          <input type="email" bind:value={fields.vcardEmail} placeholder="nombre@ejemplo.com" class={inputCls} autocomplete="email" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class={labelCls}>{labels.fieldOrg}</span>
          <input type="text" bind:value={fields.org} class={inputCls} autocomplete="organization" />
        </label>
      {:else if qrType === "email"}
        <label class="flex flex-col gap-1.5">
          <span class={labelCls}>{labels.fieldEmailTo}</span>
          <input type="email" bind:value={fields.emailTo} placeholder="nombre@ejemplo.com" class={inputCls} autocomplete="email" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class={labelCls}>{labels.fieldSubject}</span>
          <input type="text" bind:value={fields.subject} class={inputCls} />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class={labelCls}>{labels.fieldBody}</span>
          <textarea bind:value={fields.body} rows="3" class="{inputCls} h-auto min-h-20 py-2.5"></textarea>
        </label>
      {:else if qrType === "sms"}
        <label class="flex flex-col gap-1.5">
          <span class={labelCls}>{labels.fieldSmsNumber}</span>
          <input type="tel" bind:value={fields.smsNumber} placeholder="+34 600 123 456" class={inputCls} autocomplete="tel" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class={labelCls}>{labels.fieldSmsMessage}</span>
          <textarea bind:value={fields.smsMessage} rows="3" class="{inputCls} h-auto min-h-20 py-2.5"></textarea>
        </label>
      {:else if qrType === "phone"}
        <label class="flex flex-col gap-1.5">
          <span class={labelCls}>{labels.fieldPhoneNumber}</span>
          <input type="tel" bind:value={fields.phoneNumber} placeholder="+34 600 123 456" class={inputCls} autocomplete="tel" />
        </label>
      {:else if qrType === "whatsapp"}
        <label class="flex flex-col gap-1.5">
          <span class={labelCls}>{labels.fieldWaNumber}</span>
          <input type="tel" bind:value={fields.waNumber} placeholder={labels.fieldWaNumberPh} class={inputCls} autocomplete="tel" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class={labelCls}>{labels.fieldWaMessage}</span>
          <textarea bind:value={fields.waMessage} rows="3" class="{inputCls} h-auto min-h-20 py-2.5"></textarea>
        </label>
      {:else if qrType === "geo"}
        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1.5">
            <span class={labelCls}>{labels.fieldLat}</span>
            <input type="text" inputmode="decimal" bind:value={fields.lat} placeholder="19.4326" class={inputCls} />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class={labelCls}>{labels.fieldLng}</span>
            <input type="text" inputmode="decimal" bind:value={fields.lng} placeholder="-99.1332" class={inputCls} />
          </label>
        </div>
      {/if}

      {#if !valid}
        <p class="font-mono text-[11px] text-muted-foreground/80" role="status">{labels.invalid}</p>
      {/if}

      <div class="mt-1 flex flex-wrap gap-2">
        <button
          type="button"
          onclick={() => void download("png")}
          disabled={!ready || !valid || busy !== null}
          class="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 font-mono text-xs font-bold text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {#if busy === "png"}
            <svg class="size-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          {/if}
          {labels.png}
        </button>
        <button
          type="button"
          onclick={() => void download("svg")}
          disabled={!ready || !valid || busy !== null}
          class="inline-flex h-9 items-center gap-2 rounded-lg border border-border/60 px-3 font-mono text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {#if busy === "svg"}
            <svg class="size-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          {/if}
          {labels.svg}
        </button>
        <button
          type="button"
          onclick={() => void copyPayload()}
          disabled={!valid}
          class="inline-flex h-9 items-center rounded-lg border border-border/60 px-3 font-mono text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? labels.copied : labels.copy}
        </button>
      </div>
    </div>
  </div>
</section>
