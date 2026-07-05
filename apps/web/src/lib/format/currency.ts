const copFormatter = new Intl.NumberFormat("es-CO", {
	style: "currency",
	currency: "COP",
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

const copInputFormatter = new Intl.NumberFormat("es-CO", {
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

export function formatCOP(amount: number): string {
	return copFormatter.format(amount);
}

/** Strip non-digits from user input. */
export function sanitizeDigitsInput(value: string): string {
	return value.replace(/\D/g, "");
}

export function parseCOPInput(value: string): number | null {
	const digits = sanitizeDigitsInput(value);
	if (digits.length === 0) return null;
	const parsed = Number.parseInt(digits, 10);
	return Number.isNaN(parsed) ? null : parsed;
}

export function formatCOPInput(amount: number): string {
	return copInputFormatter.format(amount);
}

/** Sanitize raw input and apply thousand separators (es-CO). */
export function formatCOPInputFromRaw(raw: string): string {
	const parsed = parseCOPInput(raw);
	return parsed !== null ? formatCOPInput(parsed) : "";
}

/** Integer-only input: digits without thousand separators. */
export function formatDigitsInputFromRaw(
	raw: string,
	maxLength?: number,
): string {
	const digits = sanitizeDigitsInput(raw);
	return maxLength !== undefined ? digits.slice(0, maxLength) : digits;
}
