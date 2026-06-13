import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Utilidad para generar IDs únicos
export function generateId(): string {
	return Math.random().toString(36).substr(2, 9);
}

// Utilidad para formatear fechas
export function formatDate(dateStr: string): string {
	if (!dateStr) return "Fecha desconocida";

	try {
		const date = new Date(dateStr);
		return date.toLocaleDateString("es-ES", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch (e) {
		console.error("Error formateando fecha:", e);
		return "Fecha inválida";
	}
}

// Utilidad para validar URLs
export function isValidUrl(string: string): boolean {
	try {
		new URL(string);
		return true;
	} catch (_) {
		return false;
	}
}

// Utilidad para truncar texto
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.substring(0, maxLength)}...`;
}
