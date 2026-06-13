export interface AdminRoleProvider {
	setRole(email: string): Promise<{ userId: string; message: string }>;
}

export class SetAdminRoleUseCase {
	constructor(private readonly adminProvider: AdminRoleProvider) {}

	async execute(email: string) {
		return this.adminProvider.setRole(email);
	}
}
