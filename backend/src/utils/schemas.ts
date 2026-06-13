import { z } from "zod";

// shortCode: máximo 9 caracteres, solo letras minúsculas y números
export const shortCodeSchema = z.object({
	shortCode: z
		.string()
		.min(1, "El shortCode no puede estar vacío")
		.max(9, "El shortCode no puede tener más de 9 caracteres")
		.regex(
			/^[a-z0-9]+$/,
			"El shortCode solo puede contener letras minúsculas y números",
		),
});

const shortCodeField = z
	.string()
	.min(1, "El shortCode no puede estar vacío")
	.max(9, "El shortCode no puede tener más de 9 caracteres")
	.regex(
		/^[a-z0-9]+$/,
		"El shortCode solo puede contener letras minúsculas y números",
	);

// Schema para el body del POST /urls
export const createUrlSchema = z.object({
	originalUrl: z
		.string()
		.url("Debe ser una URL válida")
		.refine((val) => val.startsWith("http://") || val.startsWith("https://"), {
			message: "La URL debe comenzar con http:// o https://",
		}),
	shortCode: shortCodeField.optional(),
});

export type CreateUrlBody = z.infer<typeof createUrlSchema>;
