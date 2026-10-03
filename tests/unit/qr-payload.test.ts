import { describe, expect, it } from "vitest";
import { buildQrPayload, isQrPayloadValid, qrFileBase, EMPTY_QR_FIELDS } from "@/lib/qr-payload";

const base = { ...EMPTY_QR_FIELDS };

describe("buildQrPayload", () => {
	it("url: añade https:// si falta esquema", () => {
		expect(buildQrPayload("url", { ...base, url: "roly.top/abc" })).toBe("https://roly.top/abc");
		expect(buildQrPayload("url", { ...base, url: "https://roly.top/abc" })).toBe(
			"https://roly.top/abc",
		);
		expect(buildQrPayload("url", { ...base, url: "  " })).toBe("");
	});

	it("text: respeta el contenido libre", () => {
		expect(buildQrPayload("text", { ...base, text: "  hola mundo " })).toBe("hola mundo");
	});

	it("wifi: formato estándar con escape y red oculta", () => {
		expect(
			buildQrPayload("wifi", { ...base, ssid: "Casa", password: "1234", security: "WPA" }),
		).toBe("WIFI:T:WPA;S:Casa;P:1234;;");
		expect(
			buildQrPayload("wifi", {
				...base,
				ssid: "Casa",
				password: "1234",
				security: "WPA",
				hidden: true,
			}),
		).toBe("WIFI:T:WPA;S:Casa;P:1234;H:true;;");
		expect(buildQrPayload("wifi", { ...base, ssid: "Abierta", security: "nopass" })).toBe(
			"WIFI:T:nopass;S:Abierta;;",
		);
		expect(
			buildQrPayload("wifi", { ...base, ssid: "Mi;Red", password: "a:b", security: "WPA" }),
		).toBe("WIFI:T:WPA;S:Mi\\;Red;P:a\\:b;;");
		expect(buildQrPayload("wifi", { ...base, ssid: "" })).toBe("");
	});

	it("vcard: genera vCard 3.0 mínima", () => {
		const out = buildQrPayload("vcard", {
			...base,
			firstName: "Ada",
			lastName: "Lovelace",
			vcardPhone: "+34 600 123",
			vcardEmail: "ada@x.com",
		});
		expect(out).toContain("BEGIN:VCARD");
		expect(out).toContain("N:Lovelace;Ada;;;");
		expect(out).toContain("FN:Ada Lovelace");
		expect(out).toContain("TEL;TYPE=CELL:+34 600 123");
		expect(out).toContain("EMAIL:ada@x.com");
		expect(out).toContain("END:VCARD");
		expect(buildQrPayload("vcard", base)).toBe("");
	});

	it("email: mailto con subject/body opcionales", () => {
		expect(buildQrPayload("email", { ...base, emailTo: "a@b.com" })).toBe("mailto:a@b.com");
		expect(
			buildQrPayload("email", { ...base, emailTo: "a@b.com", subject: "Hola", body: "qué tal" }),
		).toContain("mailto:a@b.com?subject=Hola&body=");
		expect(buildQrPayload("email", base)).toBe("");
	});

	it("sms/phone/whatsapp", () => {
		expect(buildQrPayload("sms", { ...base, smsNumber: "+34 600", smsMessage: "hola" })).toBe(
			"SMSTO:+34600:hola",
		);
		expect(buildQrPayload("phone", { ...base, phoneNumber: "+34 600 100" })).toBe("tel:+34600100");
		expect(buildQrPayload("phone", base)).toBe("");
		expect(buildQrPayload("whatsapp", { ...base, waNumber: "+34 600 1", waMessage: "hola!" })).toBe(
			"https://wa.me/346001?text=hola!",
		);
		expect(buildQrPayload("whatsapp", { ...base, waNumber: "abc" })).toBe("");
	});

	it("geo: valida coordenadas numéricas", () => {
		expect(buildQrPayload("geo", { ...base, lat: "19.43", lng: "-99.13" })).toBe(
			"geo:19.43,-99.13",
		);
		expect(buildQrPayload("geo", { ...base, lat: "abc", lng: "1" })).toBe("");
		expect(buildQrPayload("geo", base)).toBe("");
	});

	it("isQrPayloadValid y qrFileBase", () => {
		expect(isQrPayloadValid("url", base)).toBe(false);
		expect(isQrPayloadValid("url", { ...base, url: "https://a.com" })).toBe(true);
		expect(qrFileBase("wifi")).toBe("qr-wifi");
	});
});
