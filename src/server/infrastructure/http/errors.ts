import { ZodError } from "zod";
import { AppError } from "@/server/domain/app-error";

const STATUS_CODE_MAP: Record<string, number> = {
	VALIDATION_ERROR: 400,
	URL_NOT_FOUND: 404,
	NOT_FOUND: 404,
	SHORT_CODE_ALREADY_EXISTS: 409,
	FORBIDDEN: 403,
	QUOTA_REACHED: 429,
	INTERNAL_SERVER_ERROR: 500,
};

export type ApiErrorResponse = {
	success: false;
	error: {
		code: string;
		message: string;
		statusCode: number;
	};
};

export function toErrorResponse(error: unknown): Response {
	if (error instanceof ZodError) {
		const message = error.issues.map((issue) => issue.message).join("; ");
		return apiError("VALIDATION_ERROR", message || "Datos inválidos", 400);
	}

	if (error instanceof AppError) {
		const statusCode = STATUS_CODE_MAP[error.code] ?? 500;
		console.warn(
			`[API ERROR] code=${error.code} status=${statusCode} message=${error.message}`,
		);
		return apiError(error.code, error.message, statusCode);
	}

	console.error("[UNHANDLED ERROR]", error);
	return apiError(
		"INTERNAL_SERVER_ERROR",
		"Error interno del servidor",
		500,
	);
}

function apiError(code: string, message: string, statusCode: number): Response {
	const body: ApiErrorResponse = {
		success: false,
		error: { code, message, statusCode },
	};
	return Response.json(body, { status: statusCode });
}
