/**
 * Preset de marca roly.top para `qr-code-styling` (única fuente de verdad).
 *
 * Antes este objeto vivía duplicado en `QrPanel.svelte` (dashboard, 280px)
 * y `PublicQrDialog.svelte` (index, 240px). Centralizarlo evita derivas
 * visuales cuando se añaden nuevos generadores (tab QR público).
 *
 * Puro y SSR-safe: no importa la librería (solo el tipo), así que se puede
 * usar en servidor/tests sin tocar `canvas`/DOM.
 */
import type QRCodeStyling from "qr-code-styling";

export const QR_BRAND = {
	dotsColor: "#1a2e05",
	background: "#ffffff",
	logo: "/icon.svg",
} as const;

type QrConstructorOptions = ConstructorParameters<typeof QRCodeStyling>[0];

interface BrandedQrOpts {
	size?: number;
	/** Mostrar logo central `/icon.svg`. Default `true` (EC H lo soporta). */
	withLogo?: boolean;
}

/** Opciones con el estilo de marca: extra-redondeado, fondo blanco sólido, EC nivel H. */
export function buildBrandedQrOptions(text: string, opts: BrandedQrOpts = {}): QrConstructorOptions {
	const { size = 280, withLogo = true } = opts;
	return {
		width: size,
		height: size,
		type: "svg",
		data: text,
		...(withLogo ? { image: QR_BRAND.logo } : {}),
		qrOptions: { errorCorrectionLevel: "H" },
		dotsOptions: { color: QR_BRAND.dotsColor, type: "extra-rounded" },
		backgroundOptions: { color: QR_BRAND.background },
		cornersSquareOptions: { color: QR_BRAND.dotsColor, type: "extra-rounded" },
		cornersDotOptions: { color: QR_BRAND.dotsColor, type: "dot" },
		imageOptions: {
			crossOrigin: "anonymous",
			margin: 6,
			imageSize: 0.25,
			hideBackgroundDots: true,
		},
	};
}
