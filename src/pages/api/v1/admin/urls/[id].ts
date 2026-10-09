import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { ValidationError } from "@/server/domain/app-error";
import { UpdateUrlUseCase } from "@/server/application/url/update-url.usecase";
import { createDb } from "@/server/db";
import { UrlRepository } from "@/server/infrastructure/persistence/url.repository.impl";
import { toErrorResponse } from "@/server/infrastructure/http/errors";
import { updateUrlSchema } from "@/server/utils/schemas";
import { requireAdmin } from "@/server/utils/guards";

export const PATCH = (async ({ params, request, locals }) => {
	const authError = requireAdmin(locals);
	if (authError) return authError;

	try {
		const id = params.id;
		if (!id) {
			throw new ValidationError("ID de URL requerido");
		}

		let raw: unknown;
		try {
			raw = await request.json();
		} catch {
			throw new ValidationError("El cuerpo de la petición no es JSON válido");
		}

		const body = updateUrlSchema.parse(raw);
		const repository = new UrlRepository(createDb(env.DB));

		// El admin gestiona cualquier URL sin ser su dueño (`isAdmin: true`
		// salta el chequeo de ownership y permite `isPublic`).
		const url = await new UpdateUrlUseCase(repository).execute(
			id,
			body,
			null,
			true,
		);

		return Response.json({
			success: true,
			data: url,
		});
	} catch (error) {
		return toErrorResponse(error);
	}
}) satisfies APIRoute;

export const DELETE = (async ({ params, locals }) => {
	const authError = requireAdmin(locals);
	if (authError) return authError;

	try {
		const id = params.id;
		if (!id) {
			throw new ValidationError("ID de URL requerido");
		}

		const repository = new UrlRepository(createDb(env.DB));
		await repository.delete(id);

		return Response.json({
			success: true,
			message: "URL eliminada correctamente",
		});
	} catch (error) {
		return toErrorResponse(error);
	}
}) satisfies APIRoute;