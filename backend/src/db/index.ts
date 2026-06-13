import { drizzle } from "drizzle-orm/d1";
import * as appSchema from "./schema";
import * as authSchema from "./auth-schema";

const combinedSchema = { ...appSchema, ...authSchema };

let cachedDb: any = null;

/**
 * Crea o devuelve la instancia cacheada de Drizzle conectada al binding D1.
 * Uso: const db = createDb(c.env.DB);
 */
export function createDb(d1Binding: D1Database) {
	if (!cachedDb) {
		cachedDb = drizzle(d1Binding, { schema: combinedSchema });
	}
	return cachedDb;
}

export type DrizzleDB = ReturnType<typeof createDb>;
