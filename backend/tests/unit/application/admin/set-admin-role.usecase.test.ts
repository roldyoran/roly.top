import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
	SetAdminRoleUseCase,
	type AdminRoleProvider,
} from "@/application/admin/set-admin-role.usecase";

function createMockAdminRoleProvider(): AdminRoleProvider {
	return {
		setRole: mock(() =>
			Promise.resolve({ userId: "user-123", message: "Rol asignado" }),
		),
	};
}

describe("SetAdminRoleUseCase", () => {
	let adminProvider: AdminRoleProvider;
	let useCase: SetAdminRoleUseCase;

	beforeEach(() => {
		adminProvider = createMockAdminRoleProvider();
		useCase = new SetAdminRoleUseCase(adminProvider);
	});

	it("debe delegar la llamada al provider con el email correcto", async () => {
		await useCase.execute("test@example.com");

		expect(adminProvider.setRole).toHaveBeenCalledWith("test@example.com");
	});

	it("debe retornar el resultado del provider", async () => {
		const result = await useCase.execute("admin@example.com");

		expect(result).toEqual({ userId: "user-123", message: "Rol asignado" });
	});

	it("debe propagar el error si el provider falla", async () => {
		adminProvider.setRole = mock(() =>
			Promise.reject(new Error("Usuario no encontrado")),
		);

		await expect(useCase.execute("noexiste@example.com")).rejects.toThrow(
			"Usuario no encontrado",
		);
	});

	it("debe retornar un mensaje personalizado del provider", async () => {
		adminProvider.setRole = mock(() =>
			Promise.resolve({ userId: "user-456", message: "Admin asignado exitosamente" }),
		);

		const result = await useCase.execute("newadmin@example.com");

		expect(result.message).toBe("Admin asignado exitosamente");
		expect(result.userId).toBe("user-456");
	});
});
