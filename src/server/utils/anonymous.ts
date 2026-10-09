const ANONYMOUS_COOKIE = "anonymous_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export function getAnonymousId(cookies: string | null): string | null {
	if (!cookies) return null;
	const match = cookies.match(new RegExp(`${ANONYMOUS_COOKIE}=([^;]+)`));
	return match?.[1] ?? null;
}

export function createAnonymousId(): string {
	return crypto.randomUUID();
}

export function setAnonymousCookie(
	headers: Headers,
	anonymousId: string,
): void {
	const cookie = `${ANONYMOUS_COOKIE}=${anonymousId}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
	headers.append("Set-Cookie", cookie);
}

export function clearAnonymousCookie(headers: Headers): void {
	const cookie = `${ANONYMOUS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
	headers.append("Set-Cookie", cookie);
}
