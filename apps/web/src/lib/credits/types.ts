export type CreditStatus = "active" | "paid_off" | "defaulted";
export type SetupStatus = "draft" | "ready" | "active";
export type CreditProfile =
	| "free_purpose"
	| "housing_improvement"
	| "debt_consolidation"
	| "tangible_product"
	| "intangible_service"
	| "p2p_agreement";
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

export const SETUP_STATUS_LABELS: Record<SetupStatus, string> = {
	draft: "Incompleto",
	ready: "Listo para cuotas",
	active: "Configurado",
};

export const CREDIT_PROFILE_LABELS: Record<CreditProfile, string> = {
	free_purpose: "Libre destino",
	housing_improvement: "Mejora de vivienda",
	debt_consolidation: "Recaudo de cartera",
	tangible_product: "Producto / bien tangible",
	intangible_service: "Servicio intangible",
	p2p_agreement: "Préstamo personal",
};

export type CreditTab = "payments" | "abonos" | "destinations" | "settings";

/** Cuenta donde entra el dinero del préstamo */
export const DISBURSEMENT_ACCOUNT_LABEL = "Cuenta de desembolso";
export const DISBURSEMENT_ACCOUNT_HINT =
	"Cuenta donde recibes el monto del crédito. Opcionalmente puedes registrarlo como ingreso.";

export const HAS_DISBURSEMENT_LABEL = "Incluye desembolso en cuenta";
export const HAS_DISBURSEMENT_HINT =
	"Desactiva si el crédito financia un producto o servicio sin que el dinero pase por tu cuenta (moto, electrodoméstico, etc.).";

export const CREDIT_PRINCIPAL_LABEL = "Monto del crédito (COP)";
export const DISBURSED_PRINCIPAL_LABEL = "Monto desembolsado (COP)";
export const CREDIT_START_DATE_LABEL = "Fecha de inicio del crédito (opcional)";
export const DISBURSEMENT_START_DATE_LABEL = "Fecha del desembolso (opcional)";
export const CREDIT_START_DATE_HINT =
	"Si no la conoces, usamos la fecha de hoy para calcular el calendario de cuotas.";

export const PAYMENT_ACCOUNT_LABEL = "Cuenta para pagar cuotas (opcional)";
export const PAYMENT_ACCOUNT_HINT =
	"Cuenta por defecto al registrar pagos de cuota. Puedes elegirla al momento de cada pago si no la defines aquí.";

export const FUND_EXPENSE_CATEGORY_HINT =
	"Categorías para registrar en qué rubro del crédito gastas (obra, materiales, etc.). Aparecen en Movimientos y en la pestaña Destinos.";

export const CREDIT_SETTINGS_SUMMARY_HINT =
	"Puedes editar monto, tasa, plazo y forma de cuotas en cualquier momento. Al guardar, las cuotas pendientes se recalculan; las ya pagadas no cambian.";

export const CREATE_CREDIT_FIXED_EXPENSE_LABEL =
	"Crear gasto fijo mensual para las cuotas";
export const CREATE_CREDIT_FIXED_EXPENSE_HINT =
	"Aparecerá en Presupuestos e Inicio como recordatorio mensual. Usa la categoría de cuota del crédito y el día de pago que indiques arriba.";

export const TARGET_PAYOFF_HINT =
	"Fecha meta en la que te gustaría terminar de pagar el crédito. Es referencia visual, no recalcula las cuotas sola.";

export const DELETE_CREDIT_HINT =
	"Borra el crédito, sus cuotas, abonos y rubros. Los movimientos ya registrados en Movimientos no se eliminan.";

export const ALREADY_IN_PROGRESS_LABEL = "Este crédito ya está en marcha";
export const ALREADY_IN_PROGRESS_HINT =
	"Úsalo si el préstamo ya empezó y quieres registrar solo lo que falta por pagar.";

export const PAID_INSTALLMENTS_LABEL = "Cuotas ya pagadas (opcional)";
export const PAID_INSTALLMENTS_HINT =
	"Si no lo sabes, déjalo vacío: se registrarán todas las cuotas pendientes desde ahora.";

export const OUTSTANDING_BALANCE_LABEL = "Saldo capital pendiente (COP)";
export const OUTSTANDING_BALANCE_HINT =
	"Opcional en cuota fija o capital constante (se estima con la tasa). Obligatorio en modo manual.";

export const TRACK_REMAINING_ONLY_LABEL =
	"Solo gestionar cuotas restantes (desde la cuota actual)";
export const TRACK_REMAINING_ONLY_HINT =
	"Si está activo, no se crean las cuotas anteriores: solo las que faltan por pagar. Si lo desactivas, se generan todas y las ya pagadas quedan marcadas como pagadas.";

export const EXCLUDE_FROM_PERSONAL_FINANCE_LABEL =
	"Aislar cuenta de desembolso de mis finanzas personales";
export const EXCLUDE_FROM_PERSONAL_FINANCE_HINT =
	"Saca del balance total y del neto del mes (ingresos/gastos) solo la cuenta de desembolso y sus movimientos de fondo. Los pagos de cuota sí se registran en movimientos y cuentan en tus gastos.";

/** @deprecated use DISBURSEMENT_ACCOUNT_LABEL */
export const FUND_ACCOUNT_LABEL = DISBURSEMENT_ACCOUNT_LABEL;
/** @deprecated use DISBURSEMENT_ACCOUNT_HINT */
export const FUND_ACCOUNT_HINT = DISBURSEMENT_ACCOUNT_HINT;

export const OPERATING_ACCOUNT_LABEL = PAYMENT_ACCOUNT_LABEL;
export const OPERATING_ACCOUNT_HINT = PAYMENT_ACCOUNT_HINT;
