import { describe, it, expect } from "vitest";
import { getClientIp } from "@/server/utils/client-ip";

function makeRequest(headers: Record<string, string>): Request {
	return new Request("https://example.com", { headers });
}

describe("getClientIp", () => {
	it("returns cf-connecting-ip when present", () => {
		const req = makeRequest({ "cf-connecting-ip": "1.2.3.4" });
		expect(getClientIp(req)).toBe("1.2.3.4");
	});

	it("returns x-forwarded-for when cf-connecting-ip is missing", () => {
		const req = makeRequest({ "x-forwarded-for": "5.6.7.8" });
		expect(getClientIp(req)).toBe("5.6.7.8");
	});

	it("returns first IP from x-forwarded-for (multiple IPs)", () => {
		const req = makeRequest({ "x-forwarded-for": "5.6.7.8, 9.10.11.12" });
		expect(getClientIp(req)).toBe("5.6.7.8");
	});

	it("trims whitespace from x-forwarded-for", () => {
		const req = makeRequest({ "x-forwarded-for": "  5.6.7.8 , 9.10.11.12" });
		expect(getClientIp(req)).toBe("5.6.7.8");
	});

	it("prefers cf-connecting-ip over x-forwarded-for", () => {
		const req = makeRequest({
			"cf-connecting-ip": "1.1.1.1",
			"x-forwarded-for": "2.2.2.2",
		});
		expect(getClientIp(req)).toBe("1.1.1.1");
	});

	it("returns 127.0.0.1 as fallback when no headers present", () => {
		const req = makeRequest({});
		expect(getClientIp(req)).toBe("127.0.0.1");
	});

	it("returns 127.0.0.1 when headers are empty", () => {
		const req = new Request("https://example.com");
		expect(getClientIp(req)).toBe("127.0.0.1");
	});
});
