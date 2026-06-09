import type { AdminRepositoryPort } from "@/domain/admin/admin.repository.port";

export class GetUserDetailsUseCase {
  constructor(private readonly adminRepo: AdminRepositoryPort) {}

  async execute(userId: string) {
    return this.adminRepo.findUserById(userId);
  }
}
