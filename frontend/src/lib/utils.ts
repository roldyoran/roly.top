import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type ComputedRef, computed } from "vue";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Drop-in replacement for `reactiveOmit` from `@vueuse/core`.
 * Omits specified keys from a reactive object.
 */
export function reactiveOmit<
	T extends Record<string, unknown>,
	K extends string,
>(obj: T, ...keys: K[]): ComputedRef<Omit<T, K>> {
	return computed(() => {
		const result = { ...obj } as Record<string, unknown>;
		for (const key of keys) delete result[key];
		return result as Omit<T, K>;
	});
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
