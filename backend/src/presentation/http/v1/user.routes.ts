import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { Bindings, Variables } from "@/utils/context";
import { UnauthorizedError, NotFoundError } from "@/domain/app-error";
import { shortCodeSchema } from "@/utils/schemas";
import { validationHook } from "@/infrastructure/http/error-handler";

type UserVariables = Variables & {
	user: {
		id: string;
		name: string;
		email: string;
		image: string | null;
	} | null;
	session: unknown | null;
};

// Router de usuario: rutas que requieren sesión autenticada
export const userRoutes = new Hono<{
	Bindings: Bindings;
	Variables: UserVariables;
}>();

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

	const urlRepo = c.get("urlRepo");
	const urls = await urlRepo.findByUserId(user.id);

	return c.json({ urls });
});

// DELETE /v1/user/urls/:shortCode — Eliminar URL propia
userRoutes.delete(
	"/urls/:shortCode",
	zValidator("param", shortCodeSchema, validationHook),
	async (c) => {
		const user = c.get("user");
		const { shortCode } = c.req.valid("param");

		if (!user) {
			throw new UnauthorizedError("Debes iniciar sesión para eliminar URLs");
		}

		const urlRepo = c.get("urlRepo");
		const deleted = await urlRepo.deleteByUserShortCode(user.id, shortCode);

		if (!deleted) {
			throw new NotFoundError(
				`URL con shortCode "${shortCode}" no encontrada o no pertenece al usuario`,
			);
		}

		return c.json({ success: true, url: deleted });
	},
);
