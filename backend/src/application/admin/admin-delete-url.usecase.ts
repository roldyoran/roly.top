import type { AdminRepositoryPort } from "@/domain/admin/admin.repository.port";
import { NotFoundError } from "@/domain/app-error";

export class AdminDeleteUrlUseCase {
  constructor(private readonly adminRepo: AdminRepositoryPort) {}

  async execute(shortCode: string) {
    const deleted = await this.adminRepo.deleteUrlByShortCode(shortCode);
    if (!deleted) {
      throw new NotFoundError(`URL con shortCode "${shortCode}" no encontrada`);
    }
    return deleted;
  }
}
