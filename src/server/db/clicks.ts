import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { urlsTable } from "./urls";

export const clicksTable = sqliteTable(
	"clicks",
	{
		id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
		urlId: text("url_id")
			.notNull()
			.references(() => urlsTable.id),
		country: text("country"),
		device: text("device"),
		browser: text("browser"),
		referer: text("referer"),
		createdAt: text("created_at")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(table) => [
		index("clicks_url_id_idx").on(table.urlId),
		index("clicks_created_at_idx").on(table.createdAt),
	],
);

export type InsertClick = typeof clicksTable.$inferInsert;
export type SelectClick = typeof clicksTable.$inferSelect;
