import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { ValidationError } from "@/server/domain/app-error";
import { UpdateUrlUseCase } from "@/server/application/url/update-url.usecase";
import { DeleteUrlUseCase } from "@/server/application/url/delete-url.usecase";
import { getAnonymousId } from "@/server/utils/anonymous";
import { createDb } from "@/server/db";
import { UrlRepository } from "@/server/infrastructure/persistence/url.repository.impl";
import { toErrorResponse } from "@/server/infrastructure/http/errors";
import { updateUrlSchema } from "@/server/utils/schemas";

export const PATCH = (async ({ params, request, locals }) => {
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

		const session = locals.session;
		const cookieHeader = request.headers.get("cookie");
		const anonymousId = getAnonymousId(cookieHeader);

		let identity: { userId: string } | { sessionId: string } | null = null;
		if (session?.userId) {
			identity = { userId: session.userId };
		} else if (anonymousId) {
			identity = { sessionId: anonymousId };
		}

		const url = await new UpdateUrlUseCase(repository).execute(
			id,
			body,
			identity,
			locals.isAdmin ?? false,
		);

		return Response.json({
			success: true,
			data: url,
		});
	} catch (error) {
		return toErrorResponse(error);
	}
}) satisfies APIRoute;

export const DELETE = (async ({ params, request, locals }) => {
	try {
		const id = params.id;
		if (!id) {
			throw new ValidationError("ID de URL requerido");
		}

		const repository = new UrlRepository(createDb(env.DB));

		const session = locals.session;
		const cookieHeader = request.headers.get("cookie");
		const anonymousId = getAnonymousId(cookieHeader);

		let identity: { userId: string } | { sessionId: string } | null = null;
		if (session?.userId) {
			identity = { userId: session.userId };
		} else if (anonymousId) {
			identity = { sessionId: anonymousId };
		}

		await new DeleteUrlUseCase(repository).execute(id, identity);

		return Response.json({
			success: true,
			message: "URL eliminada correctamente",
		});
	} catch (error) {
		return toErrorResponse(error);
	}
}) satisfies APIRoute;
