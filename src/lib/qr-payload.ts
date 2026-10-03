/**
 * Builders de payload por tipo de QR (lógica pura, 100% cliente y anónima).
 *
 * Cada tipo genera el string estándar que los lectores entienden
 * (`WIFI:…`, `mailto:…`, `SMSTO:…`, `tel:…`, `geo:…`, vCard 3.0, …).
 * El generador público nunca guarda nada: todo queda en el navegador.
 */

export type QrType =
	| "url"
	| "text"
	| "wifi"
	| "vcard"
	| "email"
	| "sms"
	| "phone"
	| "whatsapp"
	| "geo";

export const QR_TYPES: QrType[] = [
	"url",
	"text",
	"wifi",
	"vcard",
	"email",
	"sms",
	"phone",
	"whatsapp",
	"geo",
];

export interface QrFields {
	url: string;
	text: string;
	/** WiFi */
	ssid: string;
	password: string;
	security: "WPA" | "WEP" | "nopass";
	hidden: boolean;
	/** vCard */
	firstName: string;
	lastName: string;
	vcardPhone: string;
	vcardEmail: string;
	org: string;
	/** Email */
	emailTo: string;
	subject: string;
	body: string;
	/** SMS / teléfono / WhatsApp */
	smsNumber: string;
	smsMessage: string;
	phoneNumber: string;
	waNumber: string;
	waMessage: string;
	/** Geo */
	lat: string;
	lng: string;
}

export const EMPTY_QR_FIELDS: QrFields = {
	url: "",
	text: "",
	ssid: "",
	password: "",
	security: "WPA",
	hidden: false,
	firstName: "",
	lastName: "",
	vcardPhone: "",
	vcardEmail: "",
	org: "",
	emailTo: "",
	subject: "",
	body: "",
	smsNumber: "",
	smsMessage: "",
	phoneNumber: "",
	waNumber: "",
	waMessage: "",
	lat: "",
	lng: "",
};

/** Escapa `; , : \ "` dentro de valores `WIFI:` (el SSID/pass con `;` rompería el parseo). */
function escapeWifi(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/:/g, "\\:");
}

/** Escapa saltos de línea y `;` en campos vCard. */
function escapeVcard(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/;/g, "\\;");
}

function digitsOnly(value: string): string {
	return value.replace(/[^\d+]/g, "");
}

export function buildQrPayload(type: QrType, f: QrFields): string {
	switch (type) {
		case "text":
			return f.text.trim();
		case "url": {
			const v = f.url.trim();
			if (!v) return "";
			return /^https?:\/\//i.test(v) ? v : `https://${v}`;
		}
		case "wifi": {
			const ssid = f.ssid.trim();
			if (!ssid) return "";
			if (f.security === "nopass") {
				return `WIFI:T:nopass;S:${escapeWifi(ssid)};${f.hidden ? "H:true;" : ""};`;
			}
			return `WIFI:T:${f.security};S:${escapeWifi(ssid)};P:${escapeWifi(f.password)};${f.hidden ? "H:true;" : ""};`;
		}
		case "vcard": {
			const fn = `${f.firstName.trim()} ${f.lastName.trim()}`.trim();
			if (!fn && !f.vcardPhone.trim() && !f.vcardEmail.trim()) return "";
			const lines = [
				"BEGIN:VCARD",
				"VERSION:3.0",
				`N:${escapeVcard(f.lastName.trim())};${escapeVcard(f.firstName.trim())};;;`,
				`FN:${escapeVcard(fn)}`,
			];
			if (f.org.trim()) lines.push(`ORG:${escapeVcard(f.org.trim())}`);
			if (f.vcardPhone.trim()) lines.push(`TEL;TYPE=CELL:${escapeVcard(f.vcardPhone.trim())}`);
			if (f.vcardEmail.trim()) lines.push(`EMAIL:${escapeVcard(f.vcardEmail.trim())}`);
			lines.push("END:VCARD");
			return lines.join("\n");
		}
		case "email": {
			const to = f.emailTo.trim();
			if (!to) return "";
			const params = new URLSearchParams();
			if (f.subject.trim()) params.set("subject", f.subject.trim());
			if (f.body.trim()) params.set("body", f.body);
			const qs = params.toString();
			return `mailto:${to}${qs ? `?${qs}` : ""}`;
		}
		case "sms": {
			const n = digitsOnly(f.smsNumber.trim());
			if (!n) return "";
			return f.smsMessage.trim() ? `SMSTO:${n}:${f.smsMessage.trim()}` : `SMSTO:${n}`;
		}
		case "phone": {
			const n = digitsOnly(f.phoneNumber.trim());
			return n ? `tel:${n}` : "";
		}
		case "whatsapp": {
			const n = f.waNumber.replace(/\D/g, "");
			if (!n) return "";
			return f.waMessage.trim()
				? `https://wa.me/${n}?text=${encodeURIComponent(f.waMessage.trim())}`
				: `https://wa.me/${n}`;
		}
		case "geo": {
			const lat = f.lat.trim().replace(",", ".");
			const lng = f.lng.trim().replace(",", ".");
			if (!lat || !lng || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) return "";
			return `geo:${lat},${lng}`;
		}
	}
}

/** `true` cuando el payload del tipo tiene contenido mínimo escaneable. */
export function isQrPayloadValid(type: QrType, f: QrFields): boolean {
	return buildQrPayload(type, f).length > 0;
}

/** Base del nombre de archivo al descargar (`roly-<base>.png/svg`). */
export function qrFileBase(type: QrType): string {
	return `qr-${type}`;
}
