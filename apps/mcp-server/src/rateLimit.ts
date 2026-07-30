/**
 * Rate limit en memoria: ventana deslizante de 60 solicitudes/min por token.
 * La clave es el prefijo del token (primeros 12 caracteres, ej. "jpw_ab12cd34")
 * para no guardar el secreto completo en memoria.
 *
 * Nota: esto es por-proceso; en despliegue multi-instancia es un límite
 * "suave" adicional al rate limit del lado de Convex.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const KEY_PREFIX_LENGTH = 12;

const requestLog = new Map<string, number[]>();

export class RateLimitError extends Error {
	constructor(message = "Límite de solicitudes excedido (60 rpm por token).") {
		super(message);
		this.name = "RateLimitError";
	}
}

function tokenBucketKey(token: string): string {
	return token.slice(0, KEY_PREFIX_LENGTH);
}

function pruneWindow(timestamps: number[], now: number): number[] {
	const windowStart = now - WINDOW_MS;
	return timestamps.filter((timestamp) => timestamp > windowStart);
}

/**
 * Registra una solicitud para el token dado.
 * Lanza `RateLimitError` si se supera 60 solicitudes en el último minuto.
 */
export function checkRateLimit(token: string, now: number = Date.now()): void {
	const key = tokenBucketKey(token);
	const recent = pruneWindow(requestLog.get(key) ?? [], now);

	if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
		requestLog.set(key, recent);
		throw new RateLimitError();
	}

	recent.push(now);
	requestLog.set(key, recent);
}

/**
 * Variante que no lanza: útil si el llamador prefiere manejar el código
 * `rate_limited` sin try/catch.
 */
export function isRateLimited(
	token: string,
	now: number = Date.now(),
): boolean {
	try {
		checkRateLimit(token, now);
		return false;
	} catch (err) {
		if (err instanceof RateLimitError) return true;
		throw err;
	}
}

// Limpieza periódica para no acumular tokens inactivos indefinidamente.
const cleanupTimer = setInterval(() => {
	const now = Date.now();
	for (const [key, timestamps] of requestLog) {
		const recent = pruneWindow(timestamps, now);
		if (recent.length === 0) {
			requestLog.delete(key);
		} else {
			requestLog.set(key, recent);
		}
	}
}, WINDOW_MS);
cleanupTimer.unref?.();
