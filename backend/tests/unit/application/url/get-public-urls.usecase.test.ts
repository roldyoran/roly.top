import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
	GetPublicUrlsUseCase,
	type AdminUserProvider,
} from "@/application/url/get-public-urls.usecase";
import {
	createMockRepository,
	urlFixture,
	type MockedRepository,
} from "../../../__mocks__/url.repository.mock";
import type { UrlEntity } from "@/domain/url/url.entity";

function createMockAdminProvider(ids: string[] = []): AdminUserProvider {
	return {
		getAdminUserIds: mock(() => Promise.resolve(ids)),
	};
}

describe("GetPublicUrlsUseCase", () => {
	let repo: MockedRepository;
	let adminProvider: AdminUserProvider;
	let useCase: GetPublicUrlsUseCase;

	beforeEach(() => {
		repo = createMockRepository();
		adminProvider = createMockAdminProvider();
		useCase = new GetPublicUrlsUseCase(repo, adminProvider);
	});

	describe("cuando no hay admins", () => {
		it("debe retornar un array vacío sin consultar el repositorio", async () => {
			adminProvider = createMockAdminProvider([]);
			useCase = new GetPublicUrlsUseCase(repo, adminProvider);

			const result = await useCase.execute();

			expect(result).toEqual([]);
			expect(repo.findAll).not.toHaveBeenCalled();
		});
	});

	describe("cuando hay admins", () => {
		it("debe retornar solo las URLs que pertenecen a los admins", async () => {
			const adminUrls: UrlEntity[] = [
				{ ...urlFixture, userId: "admin-1" },
				{ ...urlFixture, id: 2, shortCode: "bun", userId: "admin-2" },
			];
			const nonAdminUrls: UrlEntity[] = [
				{ ...urlFixture, id: 3, shortCode: "user1", userId: "user-99" },
			];
			repo.findAll = mock(() =>
				Promise.resolve([...adminUrls, ...nonAdminUrls]),
			);
			adminProvider = createMockAdminProvider(["admin-1", "admin-2"]);
			useCase = new GetPublicUrlsUseCase(repo, adminProvider);

			const result = await useCase.execute();

			expect(result).toEqual(adminUrls);
			expect(result).toHaveLength(2);
		});

		it("debe retornar un array vacío si ninguna URL pertenece a un admin", async () => {
			repo.findAll = mock(() =>
				Promise.resolve([
					{ ...urlFixture, userId: "user-99" },
					{ ...urlFixture, id: 2, shortCode: "x", userId: "user-100" },
				]),
			);
			adminProvider = createMockAdminProvider(["admin-1"]);
			useCase = new GetPublicUrlsUseCase(repo, adminProvider);

			const result = await useCase.execute();

			expect(result).toEqual([]);
		});

		it("debe incluir URLs con userId null si el admin tiene un ID vacío coincidente", async () => {
			repo.findAll = mock(() =>
				Promise.resolve([{ ...urlFixture, userId: null }]),
			);
			adminProvider = createMockAdminProvider([""]);
			useCase = new GetPublicUrlsUseCase(repo, adminProvider);

			const result = await useCase.execute();

			expect(result).toEqual([{ ...urlFixture, userId: null }]);
		});

		it("debe delegar la llamada findAll al repositorio", async () => {
			adminProvider = createMockAdminProvider(["admin-1"]);
			useCase = new GetPublicUrlsUseCase(repo, adminProvider);

			await useCase.execute();

			expect(repo.findAll).toHaveBeenCalledTimes(1);
		});
	});
});
