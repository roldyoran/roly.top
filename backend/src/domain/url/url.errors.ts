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
		super(
			`No existe una URL con el shortCode "${shortCode}"`,
			"URL_NOT_FOUND",
		);
	}
}
