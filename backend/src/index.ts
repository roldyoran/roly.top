import { Hono } from "hono";
import { corsMiddleware } from "@/utils/cors-middleware";
import { checkEnvMiddleware, type Bindings } from "@/utils/context";
import { createAuth, type Auth } from "@/auth";
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

// Middleware para configurar CORS global
app.use("*", corsMiddleware());

// Inyectar auth en el contexto para todas las rutas
app.use("*", async (c, next) => {
	c.set("auth", getAuth(c.env));
	await next();
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
		const asset = await c.env.ASSETS.fetch(new Request(url.origin + "/index.html"));
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
