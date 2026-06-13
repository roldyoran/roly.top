import type { AdminRepositoryPort } from "@/domain/admin/admin.repository.port";

export class DeleteUserUseCase {
	constructor(private readonly adminRepo: AdminRepositoryPort) {}

	async execute(userId: string) {
		await this.adminRepo.deleteUser(userId);
	}
}
