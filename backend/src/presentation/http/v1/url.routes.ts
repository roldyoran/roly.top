import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { Bindings, Variables } from "@/utils/context";
import { createDb } from "@/db";
import { users } from "@/db/auth-schema";
import { GetPublicUrlsUseCase } from "@/application/url/get-public-urls.usecase";
import { shortCodeSchema, createUrlSchema } from "@/utils/schemas";
import { NotFoundError, UnauthorizedError, UrlLimitReachedError } from "@/domain/app-error";
import { validationHook } from "@/infrastructure/http/error-handler";
import { eq } from "drizzle-orm";

type UrlVariables = Variables & {
	user: { id: string } | null;
	session: unknown | null;
};

const urlRoutes = new Hono<{ Bindings: Bindings; Variables: UrlVariables }>();

// GET /v1/urls/public — lista pública de URLs (solo de usuarios admin)
urlRoutes.get("/public", async (c) => {
	const urlRepo = c.get("urlRepo");

	const adminProvider = {
		async getAdminUserIds(): Promise<string[]> {
			const db = createDb(c.env.DB);
			const adminUsers = await db
				.select({ id: users.id })
				.from(users)
				.where(eq(users.role, "admin"));
			return adminUsers.map((u) => u.id);
		},
	};

	const useCase = new GetPublicUrlsUseCase(urlRepo, adminProvider);
	const urls = await useCase.execute();
	return c.json(urls);
});

// GET /v1/urls — lista URLs del usuario autenticado
urlRoutes.get("/", async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new UnauthorizedError("Debes iniciar sesión para ver tus URLs");
	}

	const urlRepo = c.get("urlRepo");
	const urls = await urlRepo.findByUserId(user.id);

	// Obtener el límite del usuario para incluirlo en la respuesta
	const db = createDb(c.env.DB);
	const [dbUser] = await db
		.select({ urlLimit: users.urlLimit })
		.from(users)
		.where(eq(users.id, user.id))
		.limit(1);

	return c.json({
		urls,
		urlLimit: dbUser?.urlLimit ?? 2,
	});
});

// POST /v1/urls — crea una nueva URL corta asociada al usuario
// Body: { originalUrl: string, shortCode?: string }
urlRoutes.post(
	"/",
	zValidator("json", createUrlSchema, validationHook),
	async (c) => {
		const user = c.get("user");

		if (!user) {
			throw new UnauthorizedError(
				"Debes iniciar sesión para crear URLs",
			);
		}

		const { originalUrl, shortCode } = c.req.valid("json");
		const urlRepo = c.get("urlRepo");

		// Verificar límite de URLs para usuarios no-admin
		const db = createDb(c.env.DB);
		const [dbUser] = await db
			.select({ role: users.role, urlLimit: users.urlLimit })
			.from(users)
			.where(eq(users.id, user.id))
			.limit(1);

		if (dbUser?.role !== "admin") {
			const limit = dbUser?.urlLimit ?? 2;
			const count = await urlRepo.countByUserId(user.id);
			if (count >= limit) {
				throw new UrlLimitReachedError(`Límite de ${limit} URLs alcanzado`);
			}
		}

		// Verificar si la URL ya existe para este usuario
		const existing = await urlRepo.findByOriginalUrl(originalUrl);
		if (existing) {
			return c.json(existing, 200);
		}

		const created = await urlRepo.createForUser(user.id, { originalUrl, shortCode });
		return c.json(created, 201);
	},
);

// GET /v1/urls/:shortCode — obtiene una URL del usuario por su código corto
urlRoutes.get(
	"/:shortCode",
	zValidator("param", shortCodeSchema, validationHook),
	async (c) => {
		const user = c.get("user");
		const { shortCode } = c.req.valid("param");

		if (!user) {
			throw new UnauthorizedError(
				"Debes iniciar sesión para ver URLs",
			);
		}

		const urlRepo = c.get("urlRepo");
		const url = await urlRepo.findByUserShortCode(user.id, shortCode);

		if (!url) {
			throw new NotFoundError("URL no encontrada");
		}
		return c.json(url);
	},
);

export { urlRoutes };
