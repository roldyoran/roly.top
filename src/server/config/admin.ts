export function getAdminEmails(raw?: string): string[] {
	const value =
		raw ??
		(globalThis as { process?: { env?: Record<string, string | undefined> } })
			.process?.env?.ADMIN_EMAILS ??
		"";
	if (!value) return [];
	return value
		.split(",")
		.map((email) => email.trim().toLowerCase())
		.filter(Boolean);
}

export function isAdmin(
	user: { email: string } | null | undefined,
	adminEmailsRaw?: string,
): boolean {
	if (!user) return false;
	const admins = getAdminEmails(adminEmailsRaw);
	if (admins.length === 0) return false;
	return admins.includes(user.email.toLowerCase());
}