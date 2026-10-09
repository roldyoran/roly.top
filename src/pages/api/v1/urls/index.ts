import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { ValidationError } from "@/server/domain/app-error";
import { CreateUrlUseCase } from "@/server/application/url/create-url.usecase";
import { ListUrlsUseCase } from "@/server/application/url/list-urls.usecase";
import { QuotaService } from "@/server/application/shared/quota.service";
import {
	getAnonymousId,
	createAnonymousId,
	setAnonymousCookie,
} from "@/server/utils/anonymous";
import { createDb } from "@/server/db";
import { UrlRepository } from "@/server/infrastructure/persistence/url.repository.impl";
import { toErrorResponse } from "@/server/infrastructure/http/errors";
import { getClientIp } from "@/server/utils/client-ip";
import {
	checkRateLimit,
	rateLimitExceededResponse,
} from "@/server/utils/rate-limit";
import {
	createUrlSchema,
	listUrlsQuerySchema,
} from "@/server/utils/schemas";

export const GET = (async ({ request, locals }) => {
	try {
		const url = new URL(request.url);
		const query = Object.fromEntries(url.searchParams);
		const { page, limit } = listUrlsQuerySchema.parse(query);

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

		const result = await new ListUrlsUseCase(repository).execute(
			identity,
			page,
			limit,
		);

		return Response.json({
			success: true,
			data: result.data,
			pagination: result.pagination,
		});
	} catch (error) {
		return toErrorResponse(error);
	}
}) satisfies APIRoute;

// Anti-abuso: frenar la creación masiva de URLs por IP antes de tocar la
// base de datos. 30 creaciones/minuto sobra para uso humano legítimo (la
// cuota total es de 10 URLs) pero corta scripts y reintentos en bucle.
// Ver `src/server/utils/rate-limit.ts` para limitaciones en Workers.
const CREATE_URL_RATE_LIMIT = 30;
const CREATE_URL_RATE_WINDOW_MS = 60_000;

export const POST = (async ({ request, locals }) => {
	const verdict = checkRateLimit(
		`create-url:${getClientIp(request)}`,
		CREATE_URL_RATE_LIMIT,
		CREATE_URL_RATE_WINDOW_MS,
	);
	if (!verdict.allowed) {
		return rateLimitExceededResponse(verdict.retryAfterMs);
	}

	try {
		let raw: unknown;
		try {
			raw = await request.json();
		} catch {
			throw new ValidationError("El cuerpo de la petición no es JSON válido");
		}

		const body = createUrlSchema.parse(raw);

		const repository = new UrlRepository(createDb(env.DB));
		const quotaService = new QuotaService(repository);

		const cookieHeader = request.headers.get("cookie");
		let anonymousId = getAnonymousId(cookieHeader);

		// Si hay sesión, la URL nace directamente del usuario: así aparece
		// en su dashboard sin depender del claim posterior por cookie.
		// (Antes se guardaba siempre como anónima y quedaba huérfana.)
		const userId = locals.session?.userId ?? null;

		// Generar el id anónimo ANTES de insertar: la fila nace reclamable.
		// (Antes se guardaba `sessionId: NULL` y la cookie fresca no
		// matcheaba nada → huérfana permanente, imposible de reclamar.)
		let freshAnonymous = false;
		if (!userId && !anonymousId) {
			anonymousId = createAnonymousId();
			freshAnonymous = true;
		}

		const url = await new CreateUrlUseCase(repository, quotaService).execute({
			originalUrl: body.originalUrl,
			userId,
			sessionId: userId ? null : anonymousId,
			customAlias: body.customAlias,
		});

		const responseHeaders = new Headers();
		if (freshAnonymous && anonymousId) {
			setAnonymousCookie(responseHeaders, anonymousId);
		}

		return new Response(
			JSON.stringify({
				success: true,
				data: {
					shortCode: url.shortCode,
					originalUrl: url.originalUrl,
					createdAt: url.createdAt,
				},
			}),
			{
				status: 201,
				headers: responseHeaders,
			},
		);
	} catch (error) {
		return toErrorResponse(error);
	}
}) satisfies APIRoute;
