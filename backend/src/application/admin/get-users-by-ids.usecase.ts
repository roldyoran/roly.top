import type { AdminRepositoryPort } from "@/domain/admin/admin.repository.port";

export class GetUsersByIdsUseCase {
	constructor(private readonly adminRepo: AdminRepositoryPort) {}

	async execute(userIds: string[]) {
		return this.adminRepo.findUsersByIds(userIds);
	}
}
