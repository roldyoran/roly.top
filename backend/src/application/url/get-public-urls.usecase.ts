import type { UrlEntity } from "@/domain/url/url.entity";

export interface AdminUserProvider {
	getAdminUserIds(): Promise<string[]>;
}

export class GetPublicUrlsUseCase {
	constructor(
		private readonly urlRepo: { findAll(): Promise<UrlEntity[]> },
		private readonly adminProvider: AdminUserProvider,
	) {}

	async execute(): Promise<UrlEntity[]> {
		const adminIds = await this.adminProvider.getAdminUserIds();
		if (adminIds.length === 0) return [];
		const allUrls = await this.urlRepo.findAll();
		return allUrls.filter((url) => adminIds.includes(url.userId ?? ""));
	}
}
