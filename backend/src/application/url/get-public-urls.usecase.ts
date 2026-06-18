import type { UrlEntity } from "@/domain/url/url.entity";

export interface AdminUserProvider {
	getAdminUserIds(): Promise<string[]>;
}

export class GetPublicUrlsUseCase {
	constructor(
		private readonly urlRepo: {
			findByUserIds(userIds: string[]): Promise<UrlEntity[]>;
		},
		private readonly adminProvider: AdminUserProvider,
	) {}

	async execute(): Promise<UrlEntity[]> {
		const adminIds = await this.adminProvider.getAdminUserIds();
		if (adminIds.length === 0) return [];
		return this.urlRepo.findByUserIds(adminIds);
	}
}
