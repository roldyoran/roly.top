import type { AnalyticsData, CreateClickInput } from "./click.entity";

export interface ClickRepositoryPort {
	create(input: CreateClickInput): Promise<void>;
	getAnalyticsByUrlId(urlId: string): Promise<AnalyticsData>;
}
