import { describe, it, expect, beforeEach, mock } from "bun:test";
import { DeleteUrlUseCase } from "@/application/url/delete-url.usecase";
import { UrlNotFoundError } from "@/domain/url/url.errors";
import {
	createMockRepository,
	urlFixture,
	type MockedRepository,
} from "../../../__mocks__/url.repository.mock";

describe("DeleteUrlUseCase", () => {
	let repo: MockedRepository;
	let useCase: DeleteUrlUseCase;

	beforeEach(() => {
		repo = createMockRepository();
		useCase = new DeleteUrlUseCase(repo);
	});

	describe("cuando el shortCode existe", () => {
		it("debe retornar la URL eliminada", async () => {
			repo.deleteByShortCode = () => Promise.resolve(urlFixture);

			const result = await useCase.execute("hono");

			expect(result).toEqual(urlFixture);
		});

		it("debe llamar al repositorio con el shortCode correcto", async () => {
			repo.deleteByShortCode = mock(() => Promise.resolve(urlFixture));

			await useCase.execute("hono");

			expect(repo.deleteByShortCode).toHaveBeenCalledWith("hono");
			expect(repo.deleteByShortCode).toHaveBeenCalledTimes(1);
		});
	});

	describe("cuando el shortCode no existe", () => {
		it("debe lanzar UrlNotFoundError", async () => {
			repo.deleteByShortCode = () => Promise.resolve(null);

			const promise = useCase.execute("noexiste");

			expect(promise).rejects.toThrow(UrlNotFoundError);
		});

		it("el error debe tener code URL_NOT_FOUND", async () => {
			repo.deleteByShortCode = () => Promise.resolve(null);

			try {
				await useCase.execute("noexiste");
			} catch (error) {
				expect(error).toBeInstanceOf(UrlNotFoundError);
				if (error instanceof UrlNotFoundError) {
					expect(error.code).toBe("URL_NOT_FOUND");
					expect(error.message).toContain("noexiste");
				}
			}
		});
	});
});
