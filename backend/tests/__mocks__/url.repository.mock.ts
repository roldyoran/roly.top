import { mock, type Mock } from "bun:test";
import type { UrlRepositoryPort } from "@/domain/url/url.repository.port";
import type { UrlEntity, CreateUrlInput } from "@/domain/url/url.entity";

/**
 * Tipo con cada método del repositorio correctamente tipado como Mock<T>.
 * Esto preserva la firma de cada función para inferencia de tipos en toHaveBeenCalledWith.
 * Referencia: https://bun.com/docs/test (sección Mocks)
 */
export type MockedRepository = {
	findAll: Mock<() => Promise<UrlEntity[]>>;
	findByShortCode: Mock<(shortCode: string) => Promise<UrlEntity | null>>;
	findByOriginalUrl: Mock<
		(originalUrl: string, userId?: string | null) => Promise<UrlEntity | null>
	>;
	findByUserId: Mock<(userId: string) => Promise<UrlEntity[]>>;
	findByUserIds: Mock<(userIds: string[]) => Promise<UrlEntity[]>>;
	findByUserShortCode: Mock<
		(userId: string, shortCode: string) => Promise<UrlEntity | null>
	>;
	create: Mock<(input: CreateUrlInput) => Promise<UrlEntity>>;
	createForUser: Mock<
		(userId: string, input: CreateUrlInput) => Promise<UrlEntity>
	>;
	deleteByShortCode: Mock<(shortCode: string) => Promise<UrlEntity | null>>;
	deleteByUserShortCode: Mock<
		(userId: string, shortCode: string) => Promise<UrlEntity | null>
	>;
	deleteAll: Mock<() => Promise<void>>;
	incrementVisits: Mock<(shortCode: string) => Promise<UrlEntity | null>>;
	findByShortCodeAndIncrementVisits: Mock<
		(shortCode: string) => Promise<UrlEntity | null>
	>;
	assignAllToUser: Mock<(userId: string) => Promise<void>>;
} & UrlRepositoryPort;

/**
 * Crea un mock completo de UrlRepositoryPort con funciones espiables.
 * Cada método puede ser sobreescrito en cada test con .mockResolvedValue / .mockImplementation.
 */
export function createMockRepository(): MockedRepository {
	return {
		findAll: mock(() => Promise.resolve([] as UrlEntity[])),
		findByShortCode: mock((_shortCode: string) =>
			Promise.resolve(null as UrlEntity | null),
		),
		findByOriginalUrl: mock((_originalUrl: string, _userId?: string | null) =>
			Promise.resolve(null as UrlEntity | null),
		),
		findByUserId: mock((_userId: string) =>
			Promise.resolve([] as UrlEntity[]),
		),
		findByUserIds: mock((_userIds: string[]) =>
			Promise.resolve([] as UrlEntity[]),
		),
		findByUserShortCode: mock((_userId: string, _shortCode: string) =>
			Promise.resolve(null as UrlEntity | null),
		),
		create: mock((_input: CreateUrlInput) =>
			Promise.resolve({} as UrlEntity),
		),
		createForUser: mock((_userId: string, _input: CreateUrlInput) =>
			Promise.resolve({} as UrlEntity),
		),
		deleteByShortCode: mock((_shortCode: string) =>
			Promise.resolve(null as UrlEntity | null),
		),
		deleteByUserShortCode: mock((_userId: string, _shortCode: string) =>
			Promise.resolve(null as UrlEntity | null),
		),
		deleteAll: mock(() => Promise.resolve()),
		incrementVisits: mock((_shortCode: string) =>
			Promise.resolve(null as UrlEntity | null),
		),
		findByShortCodeAndIncrementVisits: mock((_shortCode: string) =>
			Promise.resolve(null as UrlEntity | null),
		),
		assignAllToUser: mock((_userId: string) => Promise.resolve()),
	} as MockedRepository;
}

/** Fixture reutilizable para tests */
export const urlFixture: UrlEntity = {
	id: 1,
	originalUrl: "https://hono.dev",
	shortCode: "hono",
	createdAt: "2026-03-03T00:00:00.000Z",
	visits: 0,
	userId: null,
};
