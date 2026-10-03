import type { CreateUrlInput, UrlEntity } from "@/server/domain/url/url.entity";
import type { UrlRepositoryPort } from "@/server/domain/url/url.repository.port";
import type { QuotaService } from "@/server/application/shared/quota.service";
import { URL_QUOTA_LIMIT, RESERVED_SHORT_CODES } from "@/server/config/constants";
import { AppError } from "@/server/domain/app-error";

export class CreateUrlUseCase {
	constructor(
		private readonly urlRepository: UrlRepositoryPort,
		private readonly quotaService: QuotaService | null = null,
	) {}

	async execute(input: CreateUrlInput): Promise<UrlEntity> {
		const identity = input.userId
			? { userId: input.userId }
			: input.sessionId
				? { sessionId: input.sessionId }
				: null;

		if (identity) {
			const existing = await this.urlRepository.findByOriginalUrlAndIdentity(
				input.originalUrl,
				identity,
			);
			if (existing) {
				return existing;
			}
		}

		if (identity && this.quotaService) {
			await this.quotaService.enforceQuota(identity, URL_QUOTA_LIMIT);
		}

		if (input.customAlias) {
			const alias = input.customAlias.toLowerCase();

			if (RESERVED_SHORT_CODES.has(alias)) {
				throw new AppError(
					"Este alias no está disponible",
					"SHORT_CODE_ALREADY_EXISTS",
				);
			}

			const taken = await this.urlRepository.findByShortCode(alias);
			if (taken) {
				throw new AppError(
					"Este alias ya está en uso",
					"SHORT_CODE_ALREADY_EXISTS",
				);
			}

			return this.urlRepository.createWithShortCode(input, alias);
		}

		return this.urlRepository.create(input);
	}
}
