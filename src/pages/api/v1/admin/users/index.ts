import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { count, desc } from "drizzle-orm";
import { createDb } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { toErrorResponse } from "@/server/infrastructure/http/errors";
import { listUsersQuerySchema } from "@/server/utils/schemas";
import { requireAdmin } from "@/server/utils/guards";

export const GET = (async ({ request, locals }) => {
	const authError = requireAdmin(locals);
	if (authError) return authError;

	try {
		const url = new URL(request.url);
		const query = Object.fromEntries(url.searchParams);
		const { page, limit } = listUsersQuerySchema.parse(query);

		const db = createDb(env.DB);
		const offset = (page - 1) * limit;

		const [rows, [{ total } = { total: 0 }]] = await Promise.all([
			db
				.select({
					id: user.id,
					name: user.name,
					email: user.email,
					createdAt: user.createdAt,
					image: user.image,
				})
				.from(user)
				.orderBy(desc(user.createdAt))
				.limit(limit)
				.offset(offset),
			db.select({ total: count() }).from(user),
		]);

		return Response.json({
			success: true,
			data: rows,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.max(1, Math.ceil(total / limit)),
			},
		});
	} catch (error) {
		return toErrorResponse(error);
	}
}) satisfies APIRoute;