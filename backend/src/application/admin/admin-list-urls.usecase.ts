import type { AdminRepositoryPort } from "@/domain/admin/admin.repository.port";

export class AdminListUrlsUseCase {
  constructor(private readonly adminRepo: AdminRepositoryPort) {}

  async execute(params: { page: number; pageSize: number; search?: string }) {
    return this.adminRepo.findAllUrls(params);
  }
}
