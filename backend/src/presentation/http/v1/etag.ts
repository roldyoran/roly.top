// Helper para generar ETag usando Web Crypto (SHA-256)
export async function computeETag(value: unknown): Promise<string> {
	try {
		const s = JSON.stringify(value || "");
		const enc = new TextEncoder().encode(s);
		// Web Crypto API (available in Cloudflare Workers / Bun)
		const hashBuffer = await crypto.subtle.digest("SHA-256", enc);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return `"${hashHex}"`;
	} catch (e) {
		// Fallback: simple checksum
		const s = String(value);
		let h = 0;
		for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
		return `"${(h >>> 0).toString(16)}"`;
	}
}
