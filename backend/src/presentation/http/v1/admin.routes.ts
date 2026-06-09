import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Bindings, Variables } from "@/utils/context";
import { createDb } from "@/db";
import { users } from "@/db/auth-schema";
import { urlsTable } from "@/db/schema";
import { DeleteUrlUseCase } from "@/application/url/delete-url.usecase";
import { DeleteAllUrlsUseCase } from "@/application/url/delete-all-urls.usecase";
import { SetAdminRoleUseCase } from "@/application/admin/set-admin-role.usecase";
import { ListUsersUseCase } from "@/application/admin/list-users.usecase";
import { GetUserDetailsUseCase } from "@/application/admin/get-user-details.usecase";
import { BanUserUseCase } from "@/application/admin/ban-user.usecase";
import { UnbanUserUseCase } from "@/application/admin/unban-user.usecase";
import { UpdateUserUrlLimitUseCase } from "@/application/admin/update-user-url-limit.usecase";
import { DeleteUserUseCase } from "@/application/admin/delete-user.usecase";
import { GetAdminStatsUseCase } from "@/application/admin/get-admin-stats.usecase";
import { AdminListUrlsUseCase } from "@/application/admin/admin-list-urls.usecase";
import { AdminDeleteUrlUseCase } from "@/application/admin/admin-delete-url.usecase";
import { shortCodeSchema } from "@/utils/schemas";
import { UnauthorizedError, NotFoundError } from "@/domain/app-error";
import { validationHook } from "@/infrastructure/http/error-handler";
import { AdminRepository } from "@/infrastructure/persistence/admin.repository.impl";
import { eq } from "drizzle-orm";

type AdminUser = { id: string; role?: string } | null;
type AdminSessionVariables = {
	user: AdminUser;
	session: unknown | null;
};

const adminRoutes = new Hono<{
	Bindings: Bindings;
	Variables: Variables & AdminSessionVariables;
}>();

// Middleware: requiere sesión Better Auth con role "admin"
adminRoutes.use("/*", async (c, next) => {
	// Excluir /setup/make-admin que usa SERVICE_ADMIN_API_KEY
	if (c.req.path.endsWith("/setup/make-admin")) {
		await next();
		return;
	}

	const user = c.get("user");
	if (!user || user.role !== "admin") {
		throw new UnauthorizedError("Se requiere rol de administrador");
	}
	await next();
});

// Helper: crea AdminRepository desde el env
function getAdminRepo(c: { env: Bindings }) {
	const db = createDb(c.env.DB);
	return new AdminRepository(db);
}

// ── Stats ────────────────────────────────────────────────────────────────────

adminRoutes.get("/stats", async (c) => {
	const adminRepo = getAdminRepo(c);
	const useCase = new GetAdminStatsUseCase(adminRepo);
	const stats = await useCase.execute();
	return c.json(stats);
});

// ── Users ────────────────────────────────────────────────────────────────────

adminRoutes.get("/users", async (c) => {
	const page = Number(c.req.query("page") ?? "1");
	const pageSize = Number(c.req.query("pageSize") ?? "20");
	const search = c.req.query("search") ?? undefined;
	const adminRepo = getAdminRepo(c);
	const useCase = new ListUsersUseCase(adminRepo);
	const result = await useCase.execute({ page, pageSize, search });
	return c.json(result);
});

adminRoutes.get("/users/:userId", async (c) => {
	const userId = c.req.param("userId");
	const adminRepo = getAdminRepo(c);
	const useCase = new GetUserDetailsUseCase(adminRepo);
	const user = await useCase.execute(userId);
	if (!user) {
		throw new NotFoundError("Usuario no encontrado");
	}
	return c.json(user);
});

adminRoutes.post(
	"/users/:userId/ban",
	zValidator(
		"json",
		z.object({
			reason: z.string().optional(),
			expiresAt: z.string().datetime().optional(),
		}),
		validationHook,
	),
	async (c) => {
		const userId = c.req.param("userId");
		const { reason, expiresAt } = c.req.valid("json");
		const adminRepo = getAdminRepo(c);
		const useCase = new BanUserUseCase(adminRepo);
		await useCase.execute(
			userId,
			reason,
			expiresAt ? new Date(expiresAt) : undefined,
		);
		return c.json({ message: "Usuario baneado correctamente" });
	},
);

adminRoutes.post("/users/:userId/unban", async (c) => {
	const userId = c.req.param("userId");
	const adminRepo = getAdminRepo(c);
	const useCase = new UnbanUserUseCase(adminRepo);
	await useCase.execute(userId);
	return c.json({ message: "Usuario desbaneado correctamente" });
});

adminRoutes.patch(
	"/users/:userId/url-limit",
	zValidator("json", z.object({ limit: z.number().int().min(1).max(1000) }), validationHook),
	async (c) => {
		const userId = c.req.param("userId");
		const { limit } = c.req.valid("json");
		const adminRepo = getAdminRepo(c);
		const useCase = new UpdateUserUrlLimitUseCase(adminRepo);
		await useCase.execute(userId, limit);
		return c.json({ message: `Límite de URLs actualizado a ${limit}` });
	},
);

adminRoutes.delete("/users/:userId", async (c) => {
	const userId = c.req.param("userId");
	const adminRepo = getAdminRepo(c);
	const useCase = new DeleteUserUseCase(adminRepo);
	await useCase.execute(userId);
	return c.json({ message: "Usuario eliminado correctamente" });
});

// ── URLs ─────────────────────────────────────────────────────────────────────

adminRoutes.get("/urls", async (c) => {
	const page = Number(c.req.query("page") ?? "1");
	const pageSize = Number(c.req.query("pageSize") ?? "20");
	const search = c.req.query("search") ?? undefined;
	const adminRepo = getAdminRepo(c);
	const useCase = new AdminListUrlsUseCase(adminRepo);
	const result = await useCase.execute({ page, pageSize, search });
	return c.json(result);
});

adminRoutes.delete(
	"/urls/:shortCode",
	zValidator("param", shortCodeSchema, validationHook),
	async (c) => {
		const { shortCode } = c.req.valid("param");
		const adminRepo = getAdminRepo(c);
		const useCase = new AdminDeleteUrlUseCase(adminRepo);
		const deleted = await useCase.execute(shortCode);
		return c.json(deleted);
	},
);

adminRoutes.delete("/urls", async (c) => {
	const db = createDb(c.env.DB);
	const urlRepo = { deleteAll: async () => { await db.delete(urlsTable); } };
	const useCase = new DeleteAllUrlsUseCase(urlRepo as any);
	await useCase.execute();
	return c.json({ message: "Todas las URLs han sido eliminadas" });
});

// ── Setup ────────────────────────────────────────────────────────────────────

// Middleware para setup/make-admin: requiere SERVICE_ADMIN_API_KEY
adminRoutes.use("/setup/make-admin", async (c, next) => {
	const authHeader = c.req.header("Authorization");
	const apiKey = c.env.SERVICE_ADMIN_API_KEY;
	if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
		throw new UnauthorizedError();
	}
	await next();
});

adminRoutes.post(
	"/setup/make-admin",
	zValidator("json", z.object({ email: z.string().email() }), validationHook),
	async (c) => {
		const { email } = c.req.valid("json");
		const adminProvider = {
			async setRole(email: string) {
				const db = createDb(c.env.DB);
				const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
				if (!user) {
					throw new NotFoundError(`Usuario con email "${email}" no encontrado`);
				}
				await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
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
