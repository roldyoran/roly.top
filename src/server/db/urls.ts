import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const urlsTable = sqliteTable(
	"urls",
	{
		id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
		originalUrl: text("original_url").notNull(),
		shortCode: text("short_code").notNull().unique(),
		createdAt: text("created_at")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
		visits: int().notNull().default(0),
		userId: text("user_id"),
		sessionId: text("session_id"),
		isActive: int("is_active", { mode: "boolean" }).notNull().default(true),
		// Visible en el catálogo público (`GET /api/v1/public-links`).
		// Opt-in por enlace: solo el propietario lo activa (default privado).
		isPublic: int("is_public", { mode: "boolean" }).notNull().default(false),
		title: text("title"),
		claimToken: text("claim_token"),
		expiresAt: text("expires_at"),
	},
	(table) => [
		index("urls_short_code_idx").on(table.shortCode),
		index("urls_user_id_idx").on(table.userId),
		index("urls_session_id_idx").on(table.sessionId),
		index("urls_is_public_idx").on(table.isPublic),
	],
);

export type InsertUrl = typeof urlsTable.$inferInsert;
export type SelectUrl = typeof urlsTable.$inferSelect;
