/** Rutas existentes o previstas del sitio que un shortCode nunca debe ocupar. */
export const RESERVED_SHORT_CODES: ReadonlySet<string> = new Set([
	"api",
	"en",
	"es",
	"terms",
	"terminos",
	"privacy",
	"privacidad",
	"login",
	"dashboard",
	"admin",
	"url-expirada",
]);

/** Cuota de URLs gratuitas por usuario/sesión. */
export const URL_QUOTA_LIMIT = 10;

/** Longitud de los shortCodes generados. */
export const SHORT_CODE_LENGTH = 9;
