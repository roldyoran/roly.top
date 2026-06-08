import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Tabla de URLs cortas
export const urlsTable = sqliteTable("urls", {
	id: int().primaryKey({ autoIncrement: true }),
	// URL original (larga)
	originalUrl: text("original_url").notNull(),
	// Código corto único (ej: "abc123")
	shortCode: text("short_code").notNull().unique(),
	// Fecha de creación (ISO string)
	createdAt: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	// Contador de visitas
	visits: int().notNull().default(0),
	// ID del usuario propietario (Better Auth user.id). Null = URL pública/heredada
	userId: text("user_id"),
});

export type InsertUrl = typeof urlsTable.$inferInsert;
export type SelectUrl = typeof urlsTable.$inferSelect;
