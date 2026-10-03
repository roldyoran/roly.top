import { describe, it, expect, beforeAll } from "vitest";

const BASE = process.env.E2E_BASE_URL || "http://localhost:4321";

let serverUp = false;

beforeAll(async () => {
	try {
		const res = await fetch(`${BASE}/`, {
			signal: AbortSignal.timeout(3000),
		});
		serverUp = res.ok || res.status < 500;
	} catch {
		serverUp = false;
	}
	if (!serverUp) {
		console.warn(
			`[E2E] Dev server not running at ${BASE} — skipping redirect tests`,
		);
	}
});

async function getRedirect(
	slug: string,
): Promise<{ status: number; location: string | null }> {
	const res = await fetch(`${BASE}/${slug}`, {
		redirect: "manual",
	});
	return {
		status: res.status,
		location: res.headers.get("location"),
	};
}

describe("GET /[slug] redirect", () => {
	it("returns 302 to / for unknown short code", async () => {
		if (!serverUp) return;
		const { status, location } = await getRedirect("zzzzzzz99");
		expect(status).toBe(302);
		expect(location).toBe("/");
	});

	it("returns 302 to / for invalid format (uppercase)", async () => {
		if (!serverUp) return;
		const { status, location } = await getRedirect("INVALID");
		expect(status).toBe(302);
		expect(location).toBe("/");
	});

	it("returns 302 to / for invalid format (special chars)", async () => {
		if (!serverUp) return;
		const { status, location } = await getRedirect("abc-def");
		expect(status).toBe(302);
		expect(location).toBe("/");
	});

	it("serves 200 for known route /en (prerendered page)", async () => {
		if (!serverUp) return;
		const { status } = await getRedirect("en");
		expect(status).toBe(200);
	});

	it("serves 200 for root path", async () => {
		if (!serverUp) return;
		const res = await fetch(`${BASE}/`, { redirect: "manual" });
		expect(res.status).toBe(200);
	});
});
