import { describe, it, expect, beforeAll } from "vitest";

const BASE = process.env.E2E_BASE_URL || "http://localhost:4321";

let serverUp = false;

beforeAll(async () => {
	try {
		const res = await fetch(`${BASE}/api/v1/urls`, {
			signal: AbortSignal.timeout(3000),
		});
		serverUp = res.ok || res.status < 500;
	} catch {
		serverUp = false;
	}
	if (!serverUp) {
		console.warn(
			`[E2E] Dev server not running at ${BASE} — skipping API tests`,
		);
	}
});

// Mini cookie-jar por IP: simula un navegador real (misma IP = misma
// sesión anónima). Sin esto cada request sería una identidad distinta y
// el dedup/cuota/claim por `anonymous_id` no se podría verificar.
const jars = new Map<string, Map<string, string>>();

function getJar(key: string): Map<string, string> {
	let jar = jars.get(key);
	if (!jar) {
		jar = new Map();
		jars.set(key, jar);
	}
	return jar;
}

function storeCookies(key: string, res: Response): void {
	const jar = getJar(key);
	for (const setCookie of res.headers.getSetCookie()) {
		const [pair] = setCookie.split(";");
		const eq = pair?.indexOf("=") ?? -1;
		if (!pair || eq < 0) continue;
		const name = pair.slice(0, eq).trim();
		const value = pair.slice(eq + 1).trim();
		if (!name) continue;
		if (value) jar.set(name, value);
		else jar.delete(name);
	}
}

function cookieHeader(key: string): string {
	return [...getJar(key)].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function postJson(
	body: Record<string, unknown>,
	ip?: string,
): Promise<{ status: number; json: any; setCookie: string[] }> {
	const key = ip ?? "default";
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (ip) headers["cf-connecting-ip"] = ip;
	const cookies = cookieHeader(key);
	if (cookies) headers.Cookie = cookies;
	const res = await fetch(`${BASE}/api/v1/urls`, {
		method: "POST",
		headers,
		body: JSON.stringify(body),
	});
	storeCookies(key, res);
	const json = await res.json().catch(() => null);
	return { status: res.status, json, setCookie: res.headers.getSetCookie() };
}

async function getList(ip?: string): Promise<{ status: number; json: any }> {
	const key = ip ?? "default";
	const headers: Record<string, string> = {};
	const cookies = cookieHeader(key);
	if (cookies) headers.Cookie = cookies;
	const res = await fetch(`${BASE}/api/v1/urls`, { headers });
	const json = await res.json().catch(() => null);
	return { status: res.status, json };
}

describe("POST /api/v1/urls", () => {
	it("returns 200 + list on GET", async () => {
		if (!serverUp) return;
		const { status, json } = await getList();
		expect(status).toBe(200);
		expect(json.success).toBe(true);
		expect(Array.isArray(json.data)).toBe(true);
	});

	it("creates a URL and returns 201 with shortCode", async () => {
		if (!serverUp) return;
		const { status, json } = await postJson(
			{ originalUrl: "https://e2e-test.example.com" },
			"10.99.0.1",
		);
		expect(status).toBe(201);
		expect(json.success).toBe(true);
		expect(json.data.shortCode).toBeDefined();
		expect(json.data.originalUrl).toBe("https://e2e-test.example.com");
	});

	it("sets the anonymous_id cookie on first creation (claimable row)", async () => {
		if (!serverUp) return;
		const { status, setCookie } = await postJson(
			{ originalUrl: "https://e2e-cookie.example.com" },
			"10.99.0.10",
		);
		expect(status).toBe(201);
		expect(setCookie.some((c) => c.startsWith("anonymous_id="))).toBe(true);
	});

	it("lists the created URL when sending back the anonymous cookie", async () => {
		if (!serverUp) return;
		const ip = "10.99.0.11";
		const created = await postJson(
			{ originalUrl: "https://e2e-list-mine.example.com" },
			ip,
		);
		expect(created.status).toBe(201);
		const { status, json } = await getList(ip);
		expect(status).toBe(200);
		expect(
			(json.data as Array<{ shortCode: string }>).some(
				(u) => u.shortCode === created.json.data.shortCode,
			),
		).toBe(true);
	});

	it("returns 400 for invalid URL", async () => {
		if (!serverUp) return;
		const { status, json } = await postJson(
			{ originalUrl: "ftp://invalid" },
			"10.99.0.2",
		);
		expect(status).toBe(400);
		expect(json.success).toBe(false);
	});

	it("returns 400 for missing body", async () => {
		if (!serverUp) return;
		const res = await fetch(`${BASE}/api/v1/urls`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "not-json",
		});
		expect(res.status).toBe(400);
	});

	it("deduplicates same URL + same IP", async () => {
		if (!serverUp) return;
		const ip = "10.99.0.3";
		const r1 = await postJson(
			{ originalUrl: "https://dedupe-test.example.com" },
			ip,
		);
		const r2 = await postJson(
			{ originalUrl: "https://dedupe-test.example.com" },
			ip,
		);
		expect(r1.status).toBe(201);
		expect(r2.status).toBe(201);
		expect(r2.json.data.shortCode).toBe(r1.json.data.shortCode);
	});

	it("returns 429 when IP quota exceeded (11th URL)", async () => {
		if (!serverUp) return;
		const ip = "10.99.0.4";
		for (let i = 1; i <= 10; i++) {
			await postJson(
				{ originalUrl: `https://limit-${i}.example.com` },
				ip,
			);
		}
		const { status } = await postJson(
			{ originalUrl: "https://limit-11.example.com" },
			ip,
		);
		expect(status).toBe(429);
	});

	it("allows different IP after quota reached", async () => {
		if (!serverUp) return;
		const { status } = await postJson(
			{ originalUrl: "https://other-ip.example.com" },
			"10.99.0.99",
		);
		expect(status).toBe(201);
	});

	it("creates URL with custom alias", async () => {
		if (!serverUp) return;
		const { status, json } = await postJson(
			{
				originalUrl: "https://custom-alias.example.com",
				customAlias: "e2ecustom",
			},
			"10.99.0.5",
		);
		expect(status).toBe(201);
		expect(json.data.shortCode).toBe("e2ecustom");
	});

	it("returns 409 for duplicate custom alias", async () => {
		if (!serverUp) return;
		const r1 = await postJson(
			{
				originalUrl: "https://dup-alias.example.com",
				customAlias: "e2edup",
			},
			"10.99.0.6",
		);
		expect(r1.status).toBe(201);
		const r2 = await postJson(
			{
				originalUrl: "https://other.example.com",
				customAlias: "e2edup",
			},
			"10.99.0.7",
		);
		expect(r2.status).toBe(409);
	});

	it("returns 409 for reserved alias", async () => {
		if (!serverUp) return;
		const { status } = await postJson(
			{
				originalUrl: "https://reserved.example.com",
				customAlias: "api",
			},
			"10.99.0.8",
		);
		expect(status).toBe(409);
	});

	it("returns 400 for invalid alias format", async () => {
		if (!serverUp) return;
		const { status } = await postJson(
			{
				originalUrl: "https://bad-alias.example.com",
				customAlias: "ABC!",
			},
			"10.99.0.9",
		);
		expect(status).toBe(400);
	});
});

describe("GET /api/v1/public-links", () => {
	it("returns 200 with public catalog shape and edge cache", async () => {
		if (!serverUp) return;
		const res = await fetch(`${BASE}/api/v1/public-links?page=1&limit=10`);
		expect(res.status).toBe(200);
		const json: any = await res.json().catch(() => null);
		expect(json.success).toBe(true);
		expect(Array.isArray(json.data)).toBe(true);
		expect(json.pagination?.total).toBeDefined();
		// Sin PII: ningún item expone dueño o sesión.
		for (const item of json.data) {
			expect(item.shortCode).toBeDefined();
			expect(item.originalUrl).toBeDefined();
			expect(item).not.toHaveProperty("userId");
			expect(item).not.toHaveProperty("sessionId");
		}
		// Caché de borde para la carga diferida del index.
		expect(res.headers.get("cache-control")).toContain("public");
	});

	it("caps limit at 20", async () => {
		if (!serverUp) return;
		const res = await fetch(`${BASE}/api/v1/public-links?limit=99`);
		expect(res.status).toBe(200);
		const json: any = await res.json().catch(() => null);
		expect(json.data.length).toBeLessThanOrEqual(20);
	});
});
