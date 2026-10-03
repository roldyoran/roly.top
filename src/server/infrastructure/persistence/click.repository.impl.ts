import { count, eq } from "drizzle-orm";
import type { DrizzleDB } from "@/server/db";
import { clicksTable } from "@/server/db/schema";
import type { CreateClickInput } from "@/server/domain/click/click.entity";
import type {
	AnalyticsData,
} from "@/server/domain/click/click.entity";
import type { ClickRepositoryPort } from "@/server/domain/click/click.repository.port";

export class ClickRepository implements ClickRepositoryPort {
	constructor(private readonly db: DrizzleDB) {}

	async create(input: CreateClickInput): Promise<void> {
		const createdAt = new Date().toISOString();
		await this.db.insert(clicksTable).values({
			urlId: input.urlId,
			country: input.country ?? null,
			device: input.device ?? null,
			browser: input.browser ?? null,
			referer: input.referer ?? null,
			createdAt,
		});
	}

	async getAnalyticsByUrlId(urlId: string): Promise<AnalyticsData> {
		const where = eq(clicksTable.urlId, urlId);

		const [totalResult, countryResults, deviceResults, browserResults] =
			await Promise.all([
				this.db
					.select({ value: count() })
					.from(clicksTable)
					.where(where),
				this.db
					.select({
						country: clicksTable.country,
						count: count(),
					})
					.from(clicksTable)
					.where(where)
					.groupBy(clicksTable.country),
				this.db
					.select({
						device: clicksTable.device,
						count: count(),
					})
					.from(clicksTable)
					.where(where)
					.groupBy(clicksTable.device),
				this.db
					.select({
						browser: clicksTable.browser,
						count: count(),
					})
					.from(clicksTable)
					.where(where)
					.groupBy(clicksTable.browser),
			]);

		return {
			totalClicks: totalResult[0]?.value ?? 0,
			clicksByCountry: countryResults.map((r) => ({
				country: r.country ?? "Unknown",
				count: r.count,
			})),
			clicksByDevice: deviceResults.map((r) => ({
				device: r.device ?? "Unknown",
				count: r.count,
			})),
			clicksByBrowser: browserResults.map((r) => ({
				browser: r.browser ?? "Unknown",
				count: r.count,
			})),
		};
	}
}
