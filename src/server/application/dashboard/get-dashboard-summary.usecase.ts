import { ValidationError } from "@/server/domain/app-error";
import type {
	DashboardRangeDays,
	DashboardSummary,
} from "@/server/domain/dashboard/dashboard.entity";
import type { DashboardRepositoryPort } from "@/server/domain/dashboard/dashboard.repository.port";

const ALLOWED_RANGES: DashboardRangeDays[] = [7, 30, 90];

export class GetDashboardSummaryUseCase {
	constructor(private readonly dashboardRepository: DashboardRepositoryPort) {}

	async execute(input: {
		userId: string;
		rangeDays: number | undefined;
	}): Promise<DashboardSummary> {
		const rangeDays = (input.rangeDays ?? 7) as DashboardRangeDays;
		if (!ALLOWED_RANGES.includes(rangeDays)) {
			throw new ValidationError(
				"rangeDays debe ser uno de: 7, 30, 90",
			);
		}
		return this.dashboardRepository.getSummary({
			userId: input.userId,
			rangeDays,
		});
	}
}