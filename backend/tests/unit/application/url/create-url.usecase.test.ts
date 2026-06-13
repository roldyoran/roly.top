import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
	CreateUrlUseCase,
	ShortCodeAlreadyExistsError,
} from "@/application/url/create-url.usecase";
import {
	createMockRepository,
	urlFixture,
	type MockedRepository,
} from "../../../__mocks__/url.repository.mock";

describe("CreateUrlUseCase", () => {
	let repo: MockedRepository;
	let useCase: CreateUrlUseCase;

	beforeEach(() => {
		repo = createMockRepository();
		useCase = new CreateUrlUseCase(repo);
	});

	describe("cuando la URL original ya existe en la base de datos", () => {
		it("debe devolver la URL existente sin crear una nueva si pertenece al usuario", async () => {
			repo.findByOriginalUrl = mock((_originalUrl, userId) => {
				return Promise.resolve({ ...urlFixture, userId: userId ?? null });
			});

			const result = await useCase.execute({
				originalUrl: urlFixture.originalUrl,
				userId: "user-123",
			});

			expect(result.userId).toBe("user-123");
			expect(repo.create).not.toHaveBeenCalled();
			expect(repo.findByOriginalUrl).toHaveBeenCalledWith(
				urlFixture.originalUrl,
				"user-123",
			);
		});
	});

	describe("cuando el shortCode personalizado ya está en uso", () => {
		it("debe lanzar ShortCodeAlreadyExistsError con código 409", async () => {
			repo.findByOriginalUrl = () => Promise.resolve(null);
			repo.findByShortCode = () => Promise.resolve(urlFixture);

			const promise = useCase.execute({
				originalUrl: "https://nueva-url.com",
				shortCode: "hono",
			});

			expect(promise).rejects.toThrow(ShortCodeAlreadyExistsError);
		});

		it("el error debe tener statusCode 409 y code SHORT_CODE_ALREADY_EXISTS", async () => {
			repo.findByOriginalUrl = () => Promise.resolve(null);
			repo.findByShortCode = () => Promise.resolve(urlFixture);

			try {
				await useCase.execute({
					originalUrl: "https://nueva-url.com",
					shortCode: "hono",
				});
			} catch (error) {
				expect(error).toBeInstanceOf(ShortCodeAlreadyExistsError);
				if (error instanceof ShortCodeAlreadyExistsError) {
					expect(error.code).toBe("SHORT_CODE_ALREADY_EXISTS");
					expect(error.message).toContain("hono");
				}
			}
		});
	});

	describe("cuando la URL es nueva", () => {
		it("debe crear la URL si no existe y no hay shortCode personalizado", async () => {
			const newUrl = { ...urlFixture, shortCode: "abc123" };
			repo.findByOriginalUrl = mock(() => Promise.resolve(null));
			repo.create = mock(() => Promise.resolve(newUrl));

			const result = await useCase.execute({
				originalUrl: "https://nueva-url.com",
			});

			expect(result).toEqual(newUrl);
			expect(repo.create).toHaveBeenCalledWith({
				originalUrl: "https://nueva-url.com",
			});
		});

		it("debe crear la URL con shortCode personalizado si no está en uso", async () => {
			const newUrl = { ...urlFixture, shortCode: "nuevo" };
			repo.findByOriginalUrl = mock(() => Promise.resolve(null));
			repo.findByShortCode = mock(() => Promise.resolve(null));
			repo.create = mock(() => Promise.resolve(newUrl));

			const result = await useCase.execute({
				originalUrl: "https://nueva-url.com",
				shortCode: "nuevo",
			});

			expect(result).toEqual(newUrl);
			expect(repo.create).toHaveBeenCalledWith({
				originalUrl: "https://nueva-url.com",
				shortCode: "nuevo",
			});
		});
	});
});
