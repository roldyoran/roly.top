import type { APIContext } from "astro";

type Locals = APIContext["locals"];

function errorResponse(
	status: number,
	code: string,
	message: string,
): Response {
	return Response.json(
		{
			success: false,
			error: { code, message, statusCode: status },
		},
		{ status },
	);
}

export function requireAuth(locals: Locals): Response | null {
	if (locals.user) return null;
	return errorResponse(401, "UNAUTHORIZED", "Unauthorized");
}

export function requireAdmin(locals: Locals): Response | null {
	if (!locals.user) {
		return errorResponse(401, "UNAUTHORIZED", "Unauthorized");
	}
	if (!locals.isAdmin) {
		return errorResponse(403, "FORBIDDEN", "Forbidden");
	}
	return null;
}