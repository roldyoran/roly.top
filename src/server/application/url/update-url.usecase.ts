import type {
	UpdateUrlInput,
	UrlEntity,
} from "@/server/domain/url/url.entity";
import type { UrlRepositoryPort } from "@/server/domain/url/url.repository.port";
import { ForbiddenError, UrlNotFoundError } from "@/server/domain/url/url.errors";

export class UpdateUrlUseCase {
	constructor(private readonly urlRepository: UrlRepositoryPort) {}

	async execute(
		id: string,
		input: UpdateUrlInput,
		identity: { userId: string } | { sessionId: string } | null,
		isAdmin = false,
	): Promise<UrlEntity> {
		const url = await this.urlRepository.findById(id);
		if (!url) {
			throw new UrlNotFoundError();
		}

		// `isPublic` es privilegio de administrador: las URLs son privadas
		// por defecto y solo un admin puede exponerlas en el catálogo público.
		if (input.isPublic !== undefined && !isAdmin) {
			throw new ForbiddenError();
		}

		// El admin puede gestionar cualquier URL sin ser su dueño.
		if (!isAdmin && !this.isOwner(url, identity)) {
			throw new ForbiddenError();
		}

		return this.urlRepository.update(id, input);
	}

	private isOwner(
		url: UrlEntity,
		identity: { userId: string } | { sessionId: string } | null,
	): boolean {
		if (!identity) return false;
		if ("userId" in identity && url.userId === identity.userId) return true;
		if ("sessionId" in identity && url.sessionId === identity.sessionId)
			return true;
		return false;
	}
}
