import { describe, it, expect, beforeEach, mock } from "bun:test";
import { RedirectUrlUseCase } from "@/application/url/redirect-url.usecase";
import {
	createMockRepository,
	urlFixture,
	type MockedRepository,
} from "../../../__mocks__/url.repository.mock";

describe("RedirectUrlUseCase", () => {
	let repo: MockedRepository;
	let useCase: RedirectUrlUseCase;

	beforeEach(() => {
		repo = createMockRepository();
		useCase = new RedirectUrlUseCase(repo);
	});

	it("debe retornar la URL actualizada cuando el shortCode existe", async () => {
		const urlWithVisit = { ...urlFixture, visits: 1 };
		repo.findByShortCodeAndIncrementVisits = mock(() =>
			Promise.resolve(urlWithVisit),
		);

		const result = await useCase.execute("hono");

		expect(result).toEqual(urlWithVisit);
	});

	it("debe retornar null cuando el shortCode no existe", async () => {
		repo.findByShortCodeAndIncrementVisits = mock(() =>
			Promise.resolve(null),
		);

		const result = await useCase.execute("noexiste");

		expect(result).toBeNull();
	});

	it("debe llamar a findByShortCodeAndIncrementVisits con el shortCode correcto", async () => {
		const urlWithVisit = { ...urlFixture, visits: 1 };
		repo.findByShortCodeAndIncrementVisits = mock(() =>
			Promise.resolve(urlWithVisit),
		);

		await useCase.execute("hono");

		expect(repo.findByShortCodeAndIncrementVisits).toHaveBeenCalledWith(
			"hono",
		);
	});
});
