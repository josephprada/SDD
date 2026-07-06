export type CreditStatus = "active" | "paid_off" | "defaulted";
export type RateType = "EA" | "NAMV" | "MV";
export type ScheduleMode = "cuota_fija" | "capital_constant" | "manual";
export type AbonoRecalcEffect = "shorten_term" | "lower_installment";

/** Etiqueta corta para resúmenes */
export const RATE_TYPE_LABELS: Record<RateType, string> = {
	EA: "E.A.",
	NAMV: "N.A.M.V.",
	MV: "M.V.",
};

/** Opciones del selector con texto claro para el usuario */
export const RATE_TYPE_OPTIONS: Array<{
	value: RateType;
	label: string;
	hint: string;
}> = [
	{
		value: "MV",
		label: "Mensual vencida (M.V.)",
		hint: "La tasa que ingresas es el % de interés de un mes. Ej.: 1,08 % mensual.",
	},
	{
		value: "EA",
		label: "Efectiva anual (E.A.)",
		hint: "La tasa que ingresas es el % anual efectivo. Ej.: 13,5 % al año.",
	},
	{
		value: "NAMV",
		label: "Nominal anual mes vencido (N.A.M.V.)",
		hint: "Tasa nominal anual; el interés se calcula por meses vencidos.",
	},
];

export const SCHEDULE_MODE_LABELS: Record<ScheduleMode, string> = {
	cuota_fija: "Cuota fija",
	capital_constant: "Capital constante",
	manual: "Manual",
};

export const SCHEDULE_MODE_OPTIONS: Array<{
	value: ScheduleMode;
	label: string;
	hint: string;
}> = [
	{
		value: "cuota_fija",
		label: "Cuota fija",
		hint: "Pagas el mismo total cada mes (capital + interés), como la mayoría de créditos de consumo.",
	},
	{
		value: "capital_constant",
		label: "Capital constante",
		hint: "El abono a capital es igual cada mes; la cuota total baja con el tiempo.",
	},
	{
		value: "manual",
		label: "Manual",
		hint: "Se generan todas las cuotas con fechas; tú ingresas el valor de cada una según tu extracto bancario.",
	},
];

export const RECALC_EFFECT_LABELS: Record<AbonoRecalcEffect, string> = {
	shorten_term: "Acortar plazo (menos cuotas)",
	lower_installment: "Bajar el valor de la cuota",
};

export const RECALC_EFFECT_OPTIONS: Array<{
	value: AbonoRecalcEffect;
	label: string;
	hint: string;
}> = [
	{
		value: "shorten_term",
		label: "Acortar plazo — menos meses, misma cuota",
		hint: "Al abonar extra, se eliminan cuotas finales y mantienes el valor de la cuota.",
	},
	{
		value: "lower_installment",
		label: "Bajar cuota — mismo plazo, cuota más baja",
		hint: "Al abonar extra, se recalcula el valor de las cuotas pendientes manteniendo el plazo.",
	},
];

export const CREDIT_STATUS_LABELS: Record<CreditStatus, string> = {
	active: "Activo",
	paid_off: "Pagado",
	defaulted: "En mora",
};

export type CreditTab =
	| "payments"
	| "abonos"
	| "destinations"
	| "settings";

/** Cuenta donde entra el dinero del préstamo */
export const DISBURSEMENT_ACCOUNT_LABEL = "Cuenta de desembolso";
export const DISBURSEMENT_ACCOUNT_HINT =
	"Cuenta donde recibes el monto del crédito. Opcionalmente puedes registrarlo como ingreso.";

export const PAYMENT_ACCOUNT_LABEL = "Cuenta para pagar cuotas";
export const PAYMENT_ACCOUNT_HINT =
	"Cuenta desde la que pagas las cuotas mensuales. Se usará por defecto al registrar pagos.";

export const FUND_EXPENSE_CATEGORY_HINT =
	"Categorías para registrar en qué rubro del crédito gastas (obra, materiales, etc.). Aparecen en Movimientos y en la pestaña Destinos.";

export const CREDIT_SETTINGS_SUMMARY_HINT =
	"Monto, tasa y cuotas se definen al crear el crédito. Aquí puedes actualizar nombre, cuentas vinculadas y preferencias de abonos.";

export const TARGET_PAYOFF_HINT =
	"Fecha meta en la que te gustaría terminar de pagar el crédito. Es referencia visual, no recalcula las cuotas sola.";

export const DELETE_CREDIT_HINT =
	"Borra el crédito, sus cuotas, abonos y rubros. Los movimientos ya registrados en Movimientos no se eliminan.";

/** @deprecated use DISBURSEMENT_ACCOUNT_LABEL */
export const FUND_ACCOUNT_LABEL = DISBURSEMENT_ACCOUNT_LABEL;
/** @deprecated use DISBURSEMENT_ACCOUNT_HINT */
export const FUND_ACCOUNT_HINT = DISBURSEMENT_ACCOUNT_HINT;

export const OPERATING_ACCOUNT_LABEL = PAYMENT_ACCOUNT_LABEL;
export const OPERATING_ACCOUNT_HINT = PAYMENT_ACCOUNT_HINT;
