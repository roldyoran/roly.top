import type { AdminRepositoryPort } from "@/domain/admin/admin.repository.port";

export class BanUserUseCase {
	constructor(private readonly adminRepo: AdminRepositoryPort) {}

	async execute(userId: string, reason?: string, expiresAt?: Date) {
		await this.adminRepo.banUser(userId, reason, expiresAt);
	}
}
