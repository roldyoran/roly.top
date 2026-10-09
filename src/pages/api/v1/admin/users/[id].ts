import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { ValidationError } from "@/server/domain/app-error";
import { createDb } from "@/server/db";
import { session, user } from "@/server/db/auth-schema";
import { urlsTable } from "@/server/db/urls";
import { toErrorResponse } from "@/server/infrastructure/http/errors";
import { requireAdmin } from "@/server/utils/guards";

export const DELETE = (async ({ params, locals }) => {
	const authError = requireAdmin(locals);
	if (authError) return authError;

	try {
		const id = params.id;
		if (!id) {
			throw new ValidationError("ID de usuario requerido");
		}

		const db = createDb(env.DB);

		await db.transaction(async (tx) => {
			await tx.delete(session).where(eq(session.userId, id));
			await tx.delete(urlsTable).where(eq(urlsTable.userId, id));
			await tx.delete(user).where(eq(user.id, id));
		});

		return Response.json({
			success: true,
			message: "Usuario eliminado correctamente",
		});
	} catch (error) {
		return toErrorResponse(error);
	}
}) satisfies APIRoute;