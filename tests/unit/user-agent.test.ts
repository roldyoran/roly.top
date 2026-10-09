import { describe, it, expect } from "vitest";
import { parseDevice, parseBrowser } from "@/server/utils/user-agent";

describe("parseDevice", () => {
	it("returns Mobile for mobile user agents", () => {
		expect(parseDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)")).toBe("Mobile");
		expect(parseDevice("Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36")).toBe("Mobile");
		expect(parseDevice("Mozilla/5.0 (Windows Phone 10.0; ARM; Touch)")).toBe("Mobile");
	});

	it("returns Tablet for tablet user agents", () => {
		expect(parseDevice("Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)")).toBe("Tablet");
		expect(parseDevice("Mozilla/5.0 (Linux; Android 13; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Tablet")).toBe("Tablet");
	});

	it("returns Desktop for desktop user agents", () => {
		expect(parseDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")).toBe("Desktop");
		expect(parseDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/537.36")).toBe("Desktop");
		expect(parseDevice("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36")).toBe("Desktop");
	});

	it("returns Unknown for null or empty", () => {
		expect(parseDevice(null)).toBe("Unknown");
		expect(parseDevice("")).toBe("Unknown");
	});
});

describe("parseBrowser", () => {
	it("returns Chrome for Chrome user agents", () => {
		expect(parseBrowser("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36")).toBe("Chrome");
	});

	it("returns Firefox for Firefox user agents", () => {
		expect(parseBrowser("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:108.0) Gecko/20100101 Firefox/108.0")).toBe("Firefox");
	});

	it("returns Safari for Safari user agents", () => {
		expect(parseBrowser("Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15")).toBe("Safari");
	});

	it("returns Edge for Edge user agents", () => {
		expect(parseBrowser("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54")).toBe("Edge");
	});

	it("returns Opera for Opera user agents", () => {
		expect(parseBrowser("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 OPR/94.0.4718.56")).toBe("Opera");
	});

	it("returns Unknown for null or empty", () => {
		expect(parseBrowser(null)).toBe("Unknown");
		expect(parseBrowser("")).toBe("Unknown");
	});
});
