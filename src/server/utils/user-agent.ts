export function parseDevice(userAgent: string | null): string {
	if (!userAgent) return "Unknown";

	const ua = userAgent.toLowerCase();

	// Check tablet BEFORE mobile since some Android tablets include "Mobile"
	if (/ipad|tablet|playbook|silk/i.test(ua)) {
		return "Tablet";
	}
	if (/mobile|android|iphone|ipod|opera mini|iemobile|wpdesktop|windows phone/i.test(ua)) {
		return "Mobile";
	}
	return "Desktop";
}

export function parseBrowser(userAgent: string | null): string {
	if (!userAgent) return "Unknown";

	const ua = userAgent.toLowerCase();

	if (/edg/i.test(ua)) return "Edge";
	if (/chrome/i.test(ua) && !/opr/i.test(ua)) return "Chrome";
	if (/firefox/i.test(ua)) return "Firefox";
	if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
	if (/opr|opera/i.test(ua)) return "Opera";
	if (/msie|trident/i.test(ua)) return "IE";

	return "Other";
}
