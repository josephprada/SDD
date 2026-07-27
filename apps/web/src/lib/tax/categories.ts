import type { TaxSection } from "./types";

export const TAX_SECTIONS: TaxSection[] = [
	"assets",
	"liabilities",
	"income",
	"deductions",
	"exempt",
];

export const TAX_SECTION_LABELS: Record<TaxSection, string> = {
	assets: "Patrimonio",
	liabilities: "Deudas",
	income: "Ingresos",
	deductions: "Deducciones",
	exempt: "Rentas exentas",
};

export const TAX_CATEGORIES: Record<TaxSection, readonly string[]> = {
	assets: [
		"inmuebles",
		"vehiculos",
		"inversiones",
		"cuentas_bancarias",
		"otros_activos",
	],
	liabilities: ["creditos_prestamos", "tarjetas_credito", "otras_deudas"],
	income: [
		"salarios",
		"cesantias",
		"intereses",
		"dividendos",
		"honorarios",
		"otros",
	],
	deductions: [
		"salud",
		"educacion",
		"vivienda",
		"dependientes",
		"intereses_vivienda",
		"otras_deducciones",
	],
	exempt: ["indemnizaciones", "otros_exentos"],
};

export const TAX_CATEGORY_LABELS: Record<string, string> = {
	inmuebles: "Inmuebles",
	vehiculos: "Vehículos",
	inversiones: "Inversiones",
	cuentas_bancarias: "Cuentas bancarias",
	otros_activos: "Otros activos",
	creditos_prestamos: "Créditos y préstamos",
	tarjetas_credito: "Tarjetas de crédito",
	otras_deudas: "Otras deudas",
	salarios: "Salarios",
	cesantias: "Cesantías",
	intereses: "Intereses",
	dividendos: "Dividendos",
	honorarios: "Honorarios",
	otros: "Otros ingresos",
	salud: "Salud",
	educacion: "Educación",
	vivienda: "Vivienda",
	dependientes: "Dependientes",
	intereses_vivienda: "Intereses de vivienda",
	otras_deducciones: "Otras deducciones",
	indemnizaciones: "Indemnizaciones",
	otros_exentos: "Otros exentos",
};
