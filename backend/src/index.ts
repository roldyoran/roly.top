import { Hono } from "hono";
import { corsMiddleware } from "@/utils/cors-middleware";
import { checkEnvMiddleware, type Bindings } from "@/utils/context";
import { v1Router } from "@/presentation/http/v1";
import { redirectRoutes } from "@/presentation/http/redirect";
import { onError } from "@/infrastructure/http/error-handler";
import { swaggerRoutes } from "@/presentation/http/swagger";
import { openapiRoutes } from "@/presentation/http/openapi";

// Crear la instancia principal de la aplicación
const app = new Hono<{ Bindings: Bindings }>();

// Middleware para verificar la presencia de variables de entorno y emitir warnings
app.use("*", checkEnvMiddleware);

// Middleware para configurar CORS
app.use("*", corsMiddleware());

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
