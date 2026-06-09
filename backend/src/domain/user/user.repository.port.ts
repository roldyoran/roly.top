export interface UserLimitAndRole {
	role: string;
	urlLimit: number;
}

export interface UserRepositoryPort {
	findLimitAndRoleById(userId: string): Promise<UserLimitAndRole | null>;
	getAdminUserIds(): Promise<string[]>;
	setRole(email: string): Promise<{ userId: string; message: string }>;
}
