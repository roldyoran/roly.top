import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	// Carpeta de salida para las migraciones SQL generadas
	out: "./drizzle",
	// Archivo con la definición del esquema
	schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
	// SQLite es el dialecto de D1
	dialect: "sqlite",
	// Driver HTTP de Cloudflare D1 (usado por drizzle-kit push/migrate al remoto)
	driver: "d1-http",
	dbCredentials: {
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
		databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
		token: process.env.CLOUDFLARE_D1_TOKEN!,
	},
});
