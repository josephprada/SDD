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

export function formatConvexError(
	error: unknown,
	fallback: string = DEFAULT_MESSAGE,
): string {
	if (error instanceof ConvexError) {
		const { data } = error;
		if (typeof data === "string" && data.trim()) {
			return data.trim();
		}
		if (
			data &&
			typeof data === "object" &&
			"message" in data &&
			typeof data.message === "string" &&
			data.message.trim()
		) {
			return data.message.trim();
		}
	}

	if (error instanceof Error) {
		const cleaned = stripConvexWrapper(error.message);
		if (cleaned && !isTechnicalMessage(cleaned)) {
			return cleaned;
		}
	}

	return fallback;
}
