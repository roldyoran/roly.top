import { Hono } from "hono";
import { cors } from "hono/cors";
import { corsMiddleware } from "@/utils/cors-middleware";
import { checkEnvMiddleware, type Bindings } from "@/utils/context";
import { createAuth, type Auth } from "@/auth";
import { v1Router } from "@/presentation/http/v1";
import { redirectRoutes } from "@/presentation/http/redirect";
import { onError } from "@/infrastructure/http/error-handler";
import { swaggerRoutes } from "@/presentation/http/swagger";
import { openapiRoutes } from "@/presentation/http/openapi";

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

// CORS para rutas de Better Auth (requiere credentials: true)
app.use(
	"/api/auth/*",
	cors({
		origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

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

// Rutas de Swagger UI
// app.route("/", swaggerRoutes);
// app.route("/", openapiRoutes);

// Redirección directa: GET /:shortCode → 302 a originalUrl, 302 a / si no existe o formato inválido
app.route("/", redirectRoutes);

// Manejador global de errores — punto único para modificar el formato de todos los errores
app.onError(onError);

export default app;
