import { eq } from "drizzle-orm";
import type { DrizzleDB } from "@/db";
import { users } from "@/db/auth-schema";
import type {
	UserRepositoryPort,
	UserLimitAndRole,
} from "@/domain/user/user.repository.port";
import type { AdminRoleProvider } from "@/application/admin/set-admin-role.usecase";
import { NotFoundError } from "@/domain/app-error";

export class UserRepository implements UserRepositoryPort, AdminRoleProvider {
	constructor(private readonly db: DrizzleDB) {}

	async findLimitAndRoleById(userId: string): Promise<UserLimitAndRole | null> {
		const [user] = await this.db
			.select({ role: users.role, urlLimit: users.urlLimit })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (!user) return null;
		return {
			role: user.role ?? "user",
			urlLimit: user.urlLimit ?? 2,
		};
	}

	async getAdminUserIds(): Promise<string[]> {
		const adminUsers = await this.db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.role, "admin"));
		return adminUsers.map((u) => u.id);
	}

	async setRole(email: string): Promise<{ userId: string; message: string }> {
		const [user] = await this.db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);
		if (!user) {
			throw new NotFoundError(`Usuario con email "${email}" no encontrado`);
		}
		await this.db
			.update(users)
			.set({ role: "admin" })
			.where(eq(users.id, user.id));
		return {
			userId: user.id,
			message: `Usuario "${user.name}" (${user.email}) ahora es admin`,
		};
	}
}
