import { Hono } from "hono";
import type { Bindings, Variables } from "@/utils/context";
import type { Auth } from "@/auth";
import { createDb } from "@/db";
import { UrlRepository } from "@/infrastructure/persistence/url.repository.impl";
import { UserRepository } from "@/infrastructure/persistence/user.repository.impl";
import { urlRoutes } from "./url.routes";
import { adminRoutes } from "./admin.routes";
import { userRoutes } from "./user.routes";

type SessionVariables = {
	auth: Auth;
	user: Auth["$Infer"]["Session"]["user"] | null;
	session: Auth["$Infer"]["Session"]["session"] | null;
};

// Router agregador de la versión 1 de la API
// Añade aquí nuevas rutas de v1: v1Router.route("/posts", postRoutes), etc.
const v1Router = new Hono<{
	Bindings: Bindings;
	Variables: Variables & SessionVariables;
}>();

// Genera un request ID único para trazabilidad
v1Router.use("*", async (c, next) => {
	const requestId = crypto.randomUUID();
	c.set("requestId", requestId);
	c.header("X-Request-ID", requestId);
	await next();
});

// Middleware de observabilidad: logs estructurados JSON
v1Router.use("*", async (c, next) => {
	const start = Date.now();
	await next();
	const duration = Date.now() - start;
	const status = c.res.status || 200;
	const method = c.req.method;
	const path = c.req.path;
	const etagHeader = c.res.headers.get("ETag") || null;
	const requestId = c.get("requestId");
	console.log(
		JSON.stringify({
			level: "info",
			msg: "request",
			method,
			path,
			status,
			duration,
			...(etagHeader ? { etag: etagHeader } : {}),
			requestId,
		}),
	);
});

// Inyecta urlRepo en el contexto para todas las rutas v1
v1Router.use("*", async (c, next) => {
	const db = createDb(c.env.DB);
	c.set("urlRepo", new UrlRepository(db));
	c.set("userRepo", new UserRepository(db));
	await next();
});

// Middleware de sesión compartido para todas las rutas v1
v1Router.use("*", async (c, next) => {
	const path = c.req.path;
	if (path === "/urls/public/stats" || path === "/urls/public") {
		c.set("user", null);
		c.set("session", null);
		await next();
		return;
	}
	const auth = c.get("auth");
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	c.set("user", session?.user ?? null);
	c.set("session", session?.session ?? null);
	await next();
});

v1Router.route("/urls", urlRoutes);
v1Router.route("/admin", adminRoutes);
v1Router.route("/user", userRoutes);

export { v1Router };
