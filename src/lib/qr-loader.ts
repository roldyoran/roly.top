/**
 * Carga perezosa del motor QR (`qr-code-styling`, ~500KB).
 *
 * PROBLEMA QUE RESUELVE: el tab "Generador QR" lo importa de forma
 * dinámica y antes cualquier fallo (red, chunk corrupto) se tragaba en
 * silencio dejando un spinner infinito. Este loader valida la forma del
 * módulo y lanza `QrLoadError` para que la UI muestre error + reintento
 * (testeado en `tests/unit/qr-loader.test.ts`).
 */
export class QrLoadError extends Error {
  readonly code = "QR_LOAD_FAILED";

  constructor(message = "Could not load the QR engine") {
    super(message);
    this.name = "QrLoadError";
  }
}

/**
 * Importa el módulo QR y devuelve `{ default }` si es un constructor.
 * Lanza `QrLoadError` si el import falla o el módulo viene malformado.
 */
export async function loadQrCtor<T>(
  importer: () => Promise<{ default?: T } | null | undefined>,
): Promise<{ default: T }> {
  let mod: { default?: T } | null | undefined;
  try {
    mod = await importer();
  } catch {
    throw new QrLoadError();
  }
  if (!mod || typeof mod.default !== "function") {
    throw new QrLoadError();
  }
  return mod as { default: T };
}
