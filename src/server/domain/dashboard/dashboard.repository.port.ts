import type {
	DashboardRangeDays,
	DashboardSummary,
} from "./dashboard.entity";

export interface DashboardRepositoryPort {
	getSummary(input: {
		userId: string;
		rangeDays: DashboardRangeDays;
	}): Promise<DashboardSummary>;
}