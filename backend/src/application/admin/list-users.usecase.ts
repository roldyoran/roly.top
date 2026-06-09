import type { AdminRepositoryPort } from "@/domain/admin/admin.repository.port";

export class ListUsersUseCase {
  constructor(private readonly adminRepo: AdminRepositoryPort) {}

  async execute(params: { page: number; pageSize: number; search?: string }) {
    return this.adminRepo.findAllUsers(params);
  }
}
