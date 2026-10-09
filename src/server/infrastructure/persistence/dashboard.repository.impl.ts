import { count, eq, sql } from "drizzle-orm";
import type { DrizzleDB } from "@/server/db";
import { clicksTable, urlsTable } from "@/server/db/schema";
import type { UrlRepositoryPort } from "@/server/domain/url/url.repository.port";
import type {
	DashboardRangeDays,
	DashboardSummary,
} from "@/server/domain/dashboard/dashboard.entity";
import type { DashboardRepositoryPort } from "@/server/domain/dashboard/dashboard.repository.port";

const SUMMARY_PAGE = 1;
const SUMMARY_LIMIT = 100;
const TOP_LINKS_LIMIT = 5;

function toIsoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function rangeStart(rangeDays: DashboardRangeDays): string {
	const start = new Date();
	start.setUTCDate(start.getUTCDate() - (rangeDays - 1));
	start.setUTCHours(0, 0, 0, 0);
	return start.toISOString();
}

function buildDateSeries(rangeDays: DashboardRangeDays): string[] {
	const series: string[] = [];
	const today = new Date();
	today.setUTCHours(0, 0, 0, 0);
	for (let i = rangeDays - 1; i >= 0; i--) {
		const day = new Date(today);
		day.setUTCDate(today.getUTCDate() - i);
		series.push(toIsoDate(day));
	}
	return series;
}

export class DashboardRepository implements DashboardRepositoryPort {
	constructor(
		private readonly db: DrizzleDB,
		private readonly urlRepository: UrlRepositoryPort,
	) {}

	async getSummary(input: {
		userId: string;
		rangeDays: DashboardRangeDays;
	}): Promise<DashboardSummary> {
		const { userId, rangeDays } = input;

		const paginated = await this.urlRepository.findByIdentityWithPagination(
			{ userId },
			SUMMARY_PAGE,
			SUMMARY_LIMIT,
		);

		const since = rangeStart(rangeDays);
		const series = buildDateSeries(rangeDays);

		const [countRow, clicksRow, dayRows, topRows] = await Promise.all([
			this.db
				.select({ totalUrls: count() })
				.from(urlsTable)
				.where(eq(urlsTable.userId, userId)),
			this.db
				.select({
					totalClicks: sql<number>`COALESCE(SUM(${urlsTable.visits}), 0)`,
				})
				.from(urlsTable)
				.where(eq(urlsTable.userId, userId)),
			this.db
				.select({
					date: sql<string>`substr(${clicksTable.createdAt}, 1, 10)`,
					clicks: count(),
				})
				.from(clicksTable)
				.innerJoin(urlsTable, eq(urlsTable.id, clicksTable.urlId))
				.where(
					sql`${urlsTable.userId} = ${userId} AND ${clicksTable.createdAt} >= ${since}`,
				)
				.groupBy(sql`substr(${clicksTable.createdAt}, 1, 10)`)
				.orderBy(sql`substr(${clicksTable.createdAt}, 1, 10)`),
			this.db
				.select({
					id: urlsTable.id,
					shortCode: urlsTable.shortCode,
					clicks: urlsTable.visits,
				})
				.from(urlsTable)
				.where(eq(urlsTable.userId, userId))
				.orderBy(sql`${urlsTable.visits} DESC`)
				.limit(TOP_LINKS_LIMIT),
		]);

		const lookup = new Map<string, number>();
		for (const row of dayRows) {
			lookup.set(String(row.date), Number(row.clicks));
		}

		const clicksByDay = series.map((date) => ({
			date,
			clicks: lookup.get(date) ?? 0,
		}));

		const totalUrls = Number(countRow[0]?.totalUrls ?? 0);
		const totalClicks = Number(clicksRow[0]?.totalClicks ?? 0);
		const total = paginated.pagination.total;
		const limit = paginated.pagination.limit;

		return {
			urls: paginated.data,
			pagination: {
				page: SUMMARY_PAGE,
				limit,
				total,
				totalPages: Math.max(1, Math.ceil(total / limit)),
			},
			totalUrls,
			totalClicks,
			clicksByDay,
			topLinks: topRows.map((r) => ({
				id: r.id,
				shortCode: r.shortCode,
				clicks: Number(r.clicks),
			})),
		};
	}
}