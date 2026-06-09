import type { AdminRepositoryPort } from "@/domain/admin/admin.repository.port";

export class GetAdminStatsUseCase {
	constructor(private readonly adminRepo: AdminRepositoryPort) {}

	async execute() {
		return this.adminRepo.getStats();
	}
}
