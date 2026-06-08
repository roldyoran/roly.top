import { Hono } from "hono";
import type { Bindings } from "@/utils/context";
import type { Auth } from "@/auth";
import { urlRoutes } from "./url.routes";
import { adminRoutes } from "./admin.routes";
import { userRoutes } from "./user.routes";

type Variables = {
	auth: Auth;
	user: Auth["$Infer"]["Session"]["user"] | null;
	session: Auth["$Infer"]["Session"]["session"] | null;
};

// Router agregador de la versión 1 de la API
// Añade aquí nuevas rutas de v1: v1Router.route("/posts", postRoutes), etc.
const v1Router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

v1Router.route("/urls", urlRoutes);
v1Router.route("/admin", adminRoutes);
v1Router.route("/user", userRoutes);

export { v1Router };
