import { Hono } from "hono";
import { corsMiddleware } from "@/utils/cors-middleware";
import { checkEnvMiddleware, type Bindings } from "@/utils/context";
import { createAuth, type Auth } from "@/auth";
import { createDb } from "@/db";
import { v1Router } from "@/presentation/http/v1";
import { redirectRoutes } from "@/presentation/http/redirect";
import { onError } from "@/infrastructure/http/error-handler";

// Cache de instancias auth por Worker env
const authCache = new WeakMap<object, Auth>();

function getAuth(env: Bindings): Auth {
	let auth = authCache.get(env);
	if (!auth) {
		auth = createAuth(env);
		authCache.set(env, auth);
	}
	return auth;
}

// Crear la instancia principal de la aplicación
const app = new Hono<{ Bindings: Bindings; Variables: { auth: Auth } }>();

// Middleware para verificar la presencia de variables de entorno y emitir warnings
app.use("*", checkEnvMiddleware);

app.use("*", async (c, next) => {
	c.header(
		"Strict-Transport-Security",
		"max-age=31536000; includeSubDomains; preload",
	);
	c.header("X-Content-Type-Options", "nosniff");
	c.header("X-Frame-Options", "DENY");
	c.header("Referrer-Policy", "strict-origin-when-cross-origin");
	c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
	await next();
});

// Middleware para configurar CORS global
app.use("*", corsMiddleware());

// Inyectar auth en el contexto para todas las rutas
app.use("*", async (c, next) => {
	c.set("auth", getAuth(c.env));
	await next();
});

app.get("/health", (c) => c.json({ status: "ok" }));

// Temporary diagnostic endpoint — remove after debugging
app.get("/debug", async (c) => {
	const result: Record<string, unknown> = { timestamp: new Date().toISOString() };
	try {
		const db = createDb(c.env.DB);
		result.db = "ok";
		try {
			const { UrlRepository } = await import("@/infrastructure/persistence/url.repository.impl");
			const repo = new UrlRepository(db);
			const urls = await repo.findAll();
			result.findAll = `ok (${urls.length} urls)`;
		} catch (e) {
			result.urlRepo = `error: ${e instanceof Error ? e.message : String(e)}`;
		}
		try {
			const { UserRepository } = await import("@/infrastructure/persistence/user.repository.impl");
			const userRepo = new UserRepository(db);
			const admins = await userRepo.getAdminUserIds();
			result.userRepo = `ok (${admins.length} admins)`;
		} catch (e) {
			result.userRepo = `error: ${e instanceof Error ? e.message : String(e)}`;
		}
		try {
			const auth = c.get("auth");
			const session = await auth.api.getSession({ headers: c.req.raw.headers });
			result.auth = `ok (session: ${!!session})`;
		} catch (e) {
			result.auth = `error: ${e instanceof Error ? e.message : String(e)}`;
		}
	} catch (e) {
		result.db = `error: ${e instanceof Error ? e.message : String(e)}`;
	}
	return c.json(result);
});

// Better Auth handler: monta todas las rutas de auth en /api/auth/*
app.on(["POST", "GET"], "/api/auth/*", (c) => {
	const auth = c.get("auth");
	return auth.handler(c.req.raw);
});

// Rutas versionadas — añade app.route("/v2", v2Router) cuando sea necesario
app.route("/v1", v1Router);

// Redirección directa: GET /:shortCode → 302 a originalUrl, 302 a / si no existe o formato inválido
app.route("/", redirectRoutes);

// SPA fallback: servir index.html para rutas no-API (Vue Router)
// DEBE ir DESPUÉS de redirect routes para no interceptar /:shortCode
app.get("*", async (c) => {
	const accept = c.req.header("Accept");
	if (accept?.includes("text/html")) {
		const url = new URL(c.req.url);
		const asset = await c.env.ASSETS.fetch(
			new Request(url.origin + "/index.html"),
		);
		return new Response(asset.body, {
			status: 200,
			headers: { "Content-Type": "text/html" },
		});
	}
	return c.notFound();
});

// Manejador global de errores — punto único para modificar el formato de todos los errores
app.onError(onError);

export default app;
