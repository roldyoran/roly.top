import { AppError } from "@/server/domain/app-error";

export class QuotaReachedError extends AppError {
	constructor(limit: number) {
		super(
			`Has alcanzado el límite de ${limit} URLs gratuitas`,
			"QUOTA_REACHED",
		);
	}
}

export class UrlNotFoundError extends AppError {
	constructor() {
		super("URL no encontrada", "URL_NOT_FOUND");
	}
}

export class ForbiddenError extends AppError {
	constructor() {
		super("No tienes permiso para realizar esta acción", "FORBIDDEN");
	}
}
