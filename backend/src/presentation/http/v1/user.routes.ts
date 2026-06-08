import { Hono } from "hono";
import type { Auth } from "@/auth";
import type { Bindings } from "@/utils/context";
import { createDb } from "@/db";
import { UrlRepository } from "@/infrastructure/persistence/url.repository.impl";
import { UnauthorizedError } from "@/domain/app-error";

type Variables = {
	auth: Auth;
	user: Auth["$Infer"]["Session"]["user"] | null;
	session: Auth["$Infer"]["Session"]["session"] | null;
};

// Router de usuario: rutas que requieren sesión autenticada
export const userRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware de sesión: inyecta user y session en el contexto
userRoutes.use("*", async (c, next) => {
	const auth = c.get("auth");
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		c.set("user", null);
		c.set("session", null);
	} else {
		c.set("user", session.user);
		c.set("session", session.session);
	}

	await next();
});

// GET /v1/user/session — Obtener sesión actual
userRoutes.get("/session", (c) => {
	const user = c.get("user");
	const session = c.get("session");

	if (!user || !session) {
		return c.json({ authenticated: false }, 200);
	}

	return c.json({
		authenticated: true,
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image,
		},
	});
});

// GET /v1/user/urls — Obtener URLs del usuario autenticado
userRoutes.get("/urls", async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new UnauthorizedError("Debes iniciar sesión para ver tus URLs");
	}

	const db = createDb(c.env.DB);
	const repository = new UrlRepository(db);
	const urls = await repository.findByUserId(user.id);

	return c.json({ urls });
});

// DELETE /v1/user/urls/:shortCode — Eliminar URL propia
userRoutes.delete("/urls/:shortCode", async (c) => {
	const user = c.get("user");
	const shortCode = c.req.param("shortCode");

	if (!user) {
		throw new UnauthorizedError(
			"Debes iniciar sesión para eliminar URLs",
		);
	}

	const db = createDb(c.env.DB);
	const repository = new UrlRepository(db);
	const deleted = await repository.deleteByUserShortCode(user.id, shortCode);

	if (!deleted) {
		return c.json(
			{
				success: false,
				error: {
					code: "NOT_FOUND",
					message: `URL con shortCode "${shortCode}" no encontrada o no pertenece al usuario`,
					statusCode: 404,
				},
			},
			404,
		);
	}

	return c.json({ success: true, url: deleted });
});
