const copFormatter = new Intl.NumberFormat("es-CO", {
	style: "currency",
	currency: "COP",
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

export function formatCOP(amount: number): string {
	return copFormatter.format(amount);
}

export function parseCOPInput(value: string): number | null {
	const digits = value.replace(/\D/g, "");
	if (digits.length === 0) return null;
	const parsed = Number.parseInt(digits, 10);
	return Number.isNaN(parsed) ? null : parsed;
}

export function formatCOPInput(amount: number): string {
	return amount.toLocaleString("es-CO");
}
