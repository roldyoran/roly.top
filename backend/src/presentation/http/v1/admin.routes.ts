import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Bindings, Variables } from "@/utils/context";
import { createDb } from "@/db";
import { users } from "@/db/auth-schema";
import { DeleteUrlUseCase } from "@/application/url/delete-url.usecase";
import { DeleteAllUrlsUseCase } from "@/application/url/delete-all-urls.usecase";
import { SetAdminRoleUseCase } from "@/application/admin/set-admin-role.usecase";
import { shortCodeSchema } from "@/utils/schemas";
import { UnauthorizedError, NotFoundError } from "@/domain/app-error";
import { validationHook } from "@/infrastructure/http/error-handler";
import { eq } from "drizzle-orm";

const adminRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware de autenticación: requiere header Authorization: Bearer <SERVICE_ADMIN_API_KEY>
adminRoutes.use("/*", async (c, next) => {
	const authHeader = c.req.header("Authorization");
	const apiKey = c.env.SERVICE_ADMIN_API_KEY;

	if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
		throw new UnauthorizedError();
	}

	await next();
});

// DELETE /v1/admin/urls/:shortCode — elimina una URL por su código corto
adminRoutes.delete(
	"/urls/:shortCode",
	zValidator("param", shortCodeSchema, validationHook),
	async (c) => {
		const { shortCode } = c.req.valid("param");
		const urlRepo = c.get("urlRepo");
		const useCase = new DeleteUrlUseCase(urlRepo);
		const deleted = await useCase.execute(shortCode);
		return c.json(deleted);
	},
);

// DELETE /v1/admin/urls — elimina todas las URLs
adminRoutes.delete("/urls", async (c) => {
	const urlRepo = c.get("urlRepo");
	const useCase = new DeleteAllUrlsUseCase(urlRepo);
	await useCase.execute();
	return c.json({ message: "Todas las URLs han sido eliminadas" });
});

// POST /v1/admin/setup/make-admin — hace admin a un usuario por email (solo para setup inicial)
adminRoutes.post(
	"/setup/make-admin",
	zValidator(
		"json",
		z.object({ email: z.string().email() }),
		validationHook,
	),
	async (c) => {
		const { email } = c.req.valid("json");

		const adminProvider = {
			async setRole(email: string) {
				const db = createDb(c.env.DB);

				const [user] = await db
					.select()
					.from(users)
					.where(eq(users.email, email))
					.limit(1);

				if (!user) {
					throw new NotFoundError(
						`Usuario con email "${email}" no encontrado`,
					);
				}

				await db
					.update(users)
					.set({ role: "admin" })
					.where(eq(users.id, user.id));

				return {
					userId: user.id,
					message: `Usuario "${user.name}" (${user.email}) ahora es admin`,
				};
			},
		};

		const useCase = new SetAdminRoleUseCase(adminProvider);
		const result = await useCase.execute(email);
		return c.json(result);
	},
);

export { adminRoutes };
