import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { GetDashboardSummaryUseCase } from "@/server/application/dashboard/get-dashboard-summary.usecase";
import { createDb } from "@/server/db";
import { DashboardRepository } from "@/server/infrastructure/persistence/dashboard.repository.impl";
import { UrlRepository } from "@/server/infrastructure/persistence/url.repository.impl";
import { toErrorResponse } from "@/server/infrastructure/http/errors";
import { requireAuth } from "@/server/utils/guards";

const rangeSchema = z.coerce
	.number()
	.refine((val) => val === 7 || val === 30 || val === 90, {
		message: "rangeDays debe ser 7, 30 o 90",
	})
	.default(7);

export const GET = (async ({ url, locals }) => {
	const authError = requireAuth(locals);
	if (authError) return authError;

	try {
		const rangeDays = rangeSchema.parse(url.searchParams.get("rangeDays"));
		const db = createDb(env.DB);
		const repository = new DashboardRepository(db, new UrlRepository(db));

		const summary = await new GetDashboardSummaryUseCase(
			repository,
		).execute({
			userId: locals.user!.id,
			rangeDays,
		});

		return Response.json({
			success: true,
			data: summary,
		});
	} catch (error) {
		return toErrorResponse(error);
	}
}) satisfies APIRoute;