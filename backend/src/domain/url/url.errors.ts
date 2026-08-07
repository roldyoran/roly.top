import { AppError } from "@/domain/app-error";

/**
 * Error lanzado cuando se intenta crear una URL con un shortCode que ya existe.
 */
export class ShortCodeAlreadyExistsError extends AppError {
	constructor(shortCode: string) {
		super(
			`El shortCode "${shortCode}" ya está en uso`,
			"SHORT_CODE_ALREADY_EXISTS",
		);
	}
}

/**
 * Error lanzado cuando no se encuentra una URL por su shortCode.
 */
export class UrlNotFoundError extends AppError {
	constructor(shortCode: string) {
		super(`No existe una URL con el shortCode "${shortCode}"`, "URL_NOT_FOUND");
	}
}

/**
 * Error lanzado cuando se intenta reclamar una URL que ha expirado.
 */
export class UrlExpiredError extends AppError {
	constructor() {
		super("Esta URL ha expirado", "URL_EXPIRED");
	}
}

/**
 * Error lanzado cuando se intenta reclamar una URL que ya fue reclamada por otro usuario.
 */
export class UrlAlreadyClaimedError extends AppError {
	constructor() {
		super("Esta URL ya fue reclamada por otro usuario", "URL_ALREADY_CLAIMED");
	}
}
