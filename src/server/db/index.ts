import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

const cache = new WeakMap<D1Database, DrizzleD1Database<typeof schema>>();

export function createDb(d1Binding: D1Database): DrizzleD1Database<typeof schema> {
	let db = cache.get(d1Binding);
	if (!db) {
		db = drizzle(d1Binding, { schema });
		cache.set(d1Binding, db);
	}
	return db;
}

export type DrizzleDB = DrizzleD1Database<typeof schema>;
