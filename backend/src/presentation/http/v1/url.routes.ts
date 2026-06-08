import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { Bindings } from "@/utils/context";
import type { Auth } from "@/auth";
import { createDb } from "@/db";
import { urlsTable } from "@/db/schema";
import { users } from "@/db/auth-schema";
import { UrlRepository } from "@/infrastructure/persistence/url.repository.impl";
import { GetAllUrlsUseCase } from "@/application/url/get-all-urls.usecase";
import { GetUrlByShortCodeUseCase } from "@/application/url/get-url-by-shortcode.usecase";
import { CreateUrlUseCase } from "@/application/url/create-url.usecase";
import { shortCodeSchema, createUrlSchema } from "@/utils/schemas";
import { NotFoundError, UnauthorizedError } from "@/domain/app-error";
import { validationHook } from "@/infrastructure/http/error-handler";
import { eq, inArray } from "drizzle-orm";

type Variables = {
	auth: Auth;
	user: Auth["$Infer"]["Session"]["user"] | null;
	session: Auth["$Infer"]["Session"]["session"] | null;
};

const urlRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware de sesión: inyecta user y session en el contexto
urlRoutes.use("*", async (c, next) => {
	const auth = c.get("auth");
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	c.set("user", session?.user ?? null);
	c.set("session", session?.session ?? null);
	await next();
});

// GET /v1/urls/public — lista pública de URLs (solo de usuarios admin)
urlRoutes.get("/public", async (c) => {
	const db = createDb(c.env.DB);

	// Obtener IDs de usuarios con role "admin"
	const adminUsers = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.role, "admin"));

	const adminIds = adminUsers.map((u) => u.id);

	if (adminIds.length === 0) {
		return c.json([]);
	}

	// Obtener URLs solo de usuarios admin
	const urls = await db
		.select()
		.from(urlsTable)
		.where(inArray(urlsTable.userId, adminIds));

	return c.json(urls);
});

// GET /v1/urls — lista URLs del usuario autenticado
urlRoutes.get("/", async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new UnauthorizedError("Debes iniciar sesión para ver tus URLs");
	}

	const db = createDb(c.env.DB);
	const repo = new UrlRepository(db);
	const urls = await repo.findByUserId(user.id);
	return c.json(urls);
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
		const db = createDb(c.env.DB);
		const repo = new UrlRepository(db);

		// Verificar si la URL ya existe para este usuario
		const existing = await repo.findByOriginalUrl(originalUrl);
		if (existing) {
			return c.json(existing, 200);
		}

		const created = await repo.createForUser(user.id, { originalUrl, shortCode });
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

		const db = createDb(c.env.DB);
		const repo = new UrlRepository(db);
		const url = await repo.findByUserShortCode(user.id, shortCode);

		if (!url) {
			throw new NotFoundError("URL no encontrada");
		}
		return c.json(url);
	},
);

export { urlRoutes };
