import type { AdminRepositoryPort } from "@/domain/admin/admin.repository.port";

export class UpdateUserUrlLimitUseCase {
	constructor(private readonly adminRepo: AdminRepositoryPort) {}

	async execute(userId: string, limit: number) {
		await this.adminRepo.updateUserUrlLimit(userId, limit);
	}
}
