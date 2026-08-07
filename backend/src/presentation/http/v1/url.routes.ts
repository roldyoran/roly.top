import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Bindings, Variables } from "@/utils/context";
import { GetPublicUrlsUseCase } from "@/application/url/get-public-urls.usecase";
import { shortCodeSchema, createUrlSchema } from "@/utils/schemas";
import { NotFoundError, UnauthorizedError } from "@/domain/app-error";
import { validationHook } from "@/infrastructure/http/error-handler";
import { CreateUrlUseCase } from "@/application/url/create-url.usecase";
import { CreateAnonymousUrlUseCase } from "@/application/url/create-anonymous-url.usecase";
import { ClaimUrlUseCase } from "@/application/url/claim-url.usecase";
import { UrlLimitService } from "@/application/shared/url-limit.service";

type UrlVariables = Variables & {
	user: { id: string } | null;
	session: unknown | null;
};

const urlRoutes = new Hono<{ Bindings: Bindings; Variables: UrlVariables }>();

// GET /v1/urls/public/stats — estadísticas públicas (sin auth)
import { computeETag } from "./etag";

urlRoutes.get("/public/stats", async (c) => {
	const urlRepo = c.get("urlRepo");
	const userRepo = c.get("userRepo");

	const useCase = new GetPublicUrlsUseCase(urlRepo, userRepo);
	const urls = await useCase.execute();

	const stats = {
		publicUrls: urls.length,
		totalRedirects: urls.reduce((sum, u) => sum + (u.visits ?? 0), 0),
	};

	const etag = await computeETag(stats);
	const ifNone = c.req.header("if-none-match") || c.req.header("If-None-Match");
	if (ifNone && ifNone === etag) {
		c.header("ETag", etag);
		return c.body(null, 304);
	}
	c.header("ETag", etag);
	return c.json(stats);
});

// GET /v1/urls/public — lista pública de URLs (solo de usuarios admin)
urlRoutes.get("/public", async (c) => {
	const urlRepo = c.get("urlRepo");
	const userRepo = c.get("userRepo");

	const useCase = new GetPublicUrlsUseCase(urlRepo, userRepo);
	const urls = await useCase.execute();

	// Compute ETag and respond 304 if If-None-Match matches
	const etag = await computeETag(urls);
	const ifNone = c.req.header("if-none-match") || c.req.header("If-None-Match");
	if (ifNone && ifNone === etag) {
		c.header("ETag", etag);
		return c.body(null, 304);
	}
	c.header("ETag", etag);
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

	// Obtener el límite del usuario via servicio de dominio
	const userRepo = c.get("userRepo");
	const urlLimitService = new UrlLimitService(userRepo);
	const urlLimit = await urlLimitService.getLimitForUser(user.id);

	const payload = { urls, urlLimit };

	// ETag handling
	const etag = await computeETag(payload);
	const ifNone = c.req.header("if-none-match") || c.req.header("If-None-Match");
	if (ifNone && ifNone === etag) {
		c.header("ETag", etag);
		return c.body(null, 304);
	}
	c.header("ETag", etag);
	return c.json(payload);
});

// POST /v1/urls — crea una nueva URL corta
// Body: { originalUrl: string, shortCode?: string }
// Si no hay sesión, crea URL anónima temporal (7 días)
urlRoutes.post(
	"/",
	zValidator("json", createUrlSchema, validationHook),
	async (c) => {
		const user = c.get("user");
		const { originalUrl, shortCode } = c.req.valid("json");
		const urlRepo = c.get("urlRepo");

		// Creación anónima (sin auth)
		if (!user) {
			const useCase = new CreateAnonymousUrlUseCase(urlRepo);
			const created = await useCase.execute({ originalUrl });
			return c.json(created, 201);
		}

		// Creación autenticada (flujo existente)
		const userRepo = c.get("userRepo");

		// Verificar límite de URLs via servicio de dominio
		const urlLimitService = new UrlLimitService(userRepo);
		const urlCount = await urlRepo.countByUserId(user.id);
		await urlLimitService.enforceLimit(user.id, urlCount);

		const useCase = new CreateUrlUseCase(urlRepo);
		const created = await useCase.execute({
			originalUrl,
			shortCode,
			userId: user.id,
		});
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
			throw new UnauthorizedError("Debes iniciar sesión para ver URLs");
		}

		const urlRepo = c.get("urlRepo");
		const url = await urlRepo.findByUserShortCode(user.id, shortCode);

		if (!url) {
			throw new NotFoundError("URL no encontrada");
		}
		return c.json(url);
	},
);

// DELETE /v1/urls/:shortCode — elimina una URL del usuario autenticado
urlRoutes.delete(
	"/:shortCode",
	zValidator("param", shortCodeSchema, validationHook),
	async (c) => {
		const user = c.get("user");

		if (!user) {
			throw new UnauthorizedError("Debes iniciar sesión para eliminar URLs");
		}

		const { shortCode } = c.req.valid("param");
		const urlRepo = c.get("urlRepo");
		const deleted = await urlRepo.deleteByUserShortCode(user.id, shortCode);

		if (!deleted) {
			throw new NotFoundError(
				"No se encontró una URL con ese código o no pertenece a tu cuenta",
			);
		}
		return c.json(deleted);
	},
);

// POST /v1/urls/claim — reclama una URL anónima para el usuario autenticado
// Body: { claimToken: string (UUID) }
urlRoutes.post(
	"/claim",
	zValidator(
		"json",
		z.object({ claimToken: z.string().uuid() }),
		validationHook,
	),
	async (c) => {
		const user = c.get("user");
		if (!user) {
			throw new UnauthorizedError("Debes iniciar sesión para reclamar URLs");
		}

		const { claimToken } = c.req.valid("json");
		const urlRepo = c.get("urlRepo");
		const useCase = new ClaimUrlUseCase(urlRepo);
		const url = await useCase.execute({ claimToken, userId: user.id });
		return c.json(url);
	},
);

export { urlRoutes };
