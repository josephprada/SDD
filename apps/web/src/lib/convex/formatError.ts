import { ConvexError } from "convex/values";

const DEFAULT_MESSAGE = "Ocurrió un error. Intenta de nuevo.";

function stripConvexWrapper(message: string): string {
	const uncaught = message.match(
		/Uncaught (?:Convex )?Error: ([\s\S]+?)(?:\s+at\s|\s+Called by client|$)/,
	);
	if (uncaught?.[1]) {
		return uncaught[1].trim();
	}

	return message
		.replace(/^\[CONVEX [^\]]+\]\s*/g, "")
		.replace(/\[Request ID: [^\]]+\]\s*/g, "")
		.replace(/^Server Error\s*/i, "")
		.replace(/^Uncaught (?:Convex )?Error:\s*/i, "")
		.replace(/\s+Called by client$/i, "")
		.replace(/\s+at\s[\s\S]+$/m, "")
		.trim();
}

function isTechnicalMessage(message: string): boolean {
	return (
		message.includes("[CONVEX ") ||
		message.includes("../convex/") ||
		message.includes("Request ID:") ||
		/^at\s+\S+/m.test(message)
	);
}

function friendlyTaxCode(message: string): string | null {
	if (message.includes("TAX_YEAR_EXISTS")) {
		return "Ya existe una declaración para ese año";
	}
	if (message.includes("TAX_YEAR_INVALID")) {
		return "Año gravable no válido";
	}
	if (message.includes("TAX_FILED_READONLY")) {
		return "La declaración presentada es de solo lectura; reábrela para editar";
	}
	if (message.includes("TAX_SOURCE_DUPLICATE")) {
		return "Esa sugerencia ya fue aceptada en esta declaración";
	}
	if (message.includes("TAX_CATEGORY_INVALID")) {
		return "Categoría no válida para la sección";
	}
	if (message.includes("TAX_NOT_FILED")) {
		return "Solo se pueden reabrir declaraciones presentadas";
	}
	if (message.includes("TAX_INVALID_TRANSITION")) {
		return "Transición de estado no permitida";
	}
	if (message.includes("ATTACHMENT_TOO_LARGE")) {
		return "El archivo supera el tamaño máximo";
	}
	return null;
}

export function formatConvexError(
	error: unknown,
	fallback: string = DEFAULT_MESSAGE,
): string {
	if (error instanceof ConvexError) {
		const { data } = error;
		if (typeof data === "string" && data.trim()) {
			return friendlyTaxCode(data) ?? data.trim();
		}
		if (
			data &&
			typeof data === "object" &&
			"message" in data &&
			typeof data.message === "string" &&
			data.message.trim()
		) {
			return friendlyTaxCode(data.message) ?? data.message.trim();
		}
	}

	if (error instanceof Error) {
		const cleaned = stripConvexWrapper(error.message);
		const mapped = friendlyTaxCode(cleaned);
		if (mapped) return mapped;
		if (cleaned && !isTechnicalMessage(cleaned)) {
			return cleaned;
		}
	}

	return fallback;
}
