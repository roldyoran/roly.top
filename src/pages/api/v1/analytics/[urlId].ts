import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { GetAnalyticsUseCase } from "@/server/application/analytics/get-analytics.usecase";
import { createDb } from "@/server/db";
import { UrlRepository } from "@/server/infrastructure/persistence/url.repository.impl";
import { ClickRepository } from "@/server/infrastructure/persistence/click.repository.impl";
import { getAnonymousId } from "@/server/utils/anonymous";
import { toErrorResponse } from "@/server/infrastructure/http/errors";
import { ValidationError } from "@/server/domain/app-error";

export const GET = (async ({ params, request, locals }) => {
	try {
		const urlId = params.urlId;
		if (!urlId) {
			throw new ValidationError("urlId es requerido");
		}

		const db = createDb(env.DB);
		const urlRepository = new UrlRepository(db);
		const clickRepository = new ClickRepository(db);

		const session = locals.session;
		const cookieHeader = request.headers.get("cookie");
		const anonymousId = getAnonymousId(cookieHeader);

		let identity: { userId: string } | { sessionId: string } | null = null;
		if (session?.userId) {
			identity = { userId: session.userId };
		} else if (anonymousId) {
			identity = { sessionId: anonymousId };
		}

		const analytics = await new GetAnalyticsUseCase(
			clickRepository,
			urlRepository,
		).execute(urlId, identity);

		return Response.json({
			success: true,
			data: analytics,
		});
	} catch (error) {
		return toErrorResponse(error);
	}
}) satisfies APIRoute;
