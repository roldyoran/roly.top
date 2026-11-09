/**
 * Helpers puros del escáner QR (`PublicQrScanner`).
 *
 * PROBLEMA QUE RESUELVE: decidir si un blob es imagen, elegir el mime de
 * imagen del portapapeles, validar que un resultado sea un enlace http(s)
 * seguro antes de pintarlo como `<a>` y calcular los intentos de
 * escalado (rápido primero, tamaño real después). Todo testeado en
 * `tests/unit/qr-scan.test.ts`; el canvas/`jsQR`/portapapeles quedan en
 * la isla porque necesitan DOM.
 */

/** `true` si el mime es una imagen (`image/*`). */
export function isImageType(mime: string): boolean {
  return mime.startsWith("image/");
}

/** Primer tipo `image/*` de la lista, o `null` si no hay ninguno. */
export function pickImageType(types: readonly string[]): string | null {
  return types.find((t) => isImageType(t)) ?? null;
}

/**
 * Índice del primer archivo de imagen, o -1 si no hay ninguno.
 * Sirve para `<input type="file">` y drag & drop con varios archivos.
 */
export function firstImageIndex(
  files: readonly { type: string }[],
): number {
  return files.findIndex((f) => isImageType(f.type));
}

/**
 * `true` solo para URLs `http(s)` — lo que se pinta como enlace "Abrir".
 * Rechaza `javascript:`, `data:` y texto plano (anti-XSS).
 */
export function isHttpUrl(text: string): boolean {
  return /^https?:\/\/\S+$/i.test(text.trim());
}

export interface ScanSize {
  width: number;
  height: number;
}

/**
 * Intentos de tamaño para decodificar: si la imagen excede `maxSize` en
 * su lado mayor se prueba primero escalada (rápido) y luego a tamaño
 * real; si no, solo tamaño real. Nunca devuelve dimensiones 0.
 */
export function scaledAttempts(
  width: number,
  height: number,
  maxSize: number,
): ScanSize[] {
  const scale = Math.min(1, maxSize / Math.max(width, height));
  const at = (s: number): ScanSize => ({
    width: Math.max(1, Math.round(width * s)),
    height: Math.max(1, Math.round(height * s)),
  });
  return scale < 1 ? [at(scale), at(1)] : [at(1)];
}
