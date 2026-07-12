import type {
	CreditProfile,
	RateType,
	ScheduleMode,
} from "@app/lib/credits/types";

export type CreditProfileGroup = "cash" | "financed" | "informal";

export type CreditProfileConfig = {
	profile: CreditProfile;
	group: CreditProfileGroup;
	label: string;
	description: string;
	suggestDisbursement: boolean;
	suggestRubros: boolean;
	defaultScheduleMode: ScheduleMode;
	showLinkedAsset: boolean;
	showInformalAgreement: boolean;
};

export const CREDIT_PROFILE_GROUPS: Array<{
	id: CreditProfileGroup;
	label: string;
	description: string;
}> = [
	{
		id: "cash",
		label: "Dinero en mi cuenta",
		description: "Libre destino, vivienda, recaudo de cartera",
	},
	{
		id: "financed",
		label: "Compra financiada",
		description: "Producto tangible o servicio intangible",
	},
	{
		id: "informal",
		label: "Acuerdo con otra persona",
		description: "Préstamo familiar o informal",
	},
];

export const CREDIT_PROFILE_REGISTRY: CreditProfileConfig[] = [
	{
		profile: "free_purpose",
		group: "cash",
		label: "Libre destino",
		description: "Consumo, libranza o uso general del desembolso",
		suggestDisbursement: true,
		suggestRubros: false,
		defaultScheduleMode: "cuota_fija",
		showLinkedAsset: false,
		showInformalAgreement: false,
	},
	{
		profile: "housing_improvement",
		group: "cash",
		label: "Mejora de vivienda",
		description: "VIS, remodelación, obra o locativas",
		suggestDisbursement: true,
		suggestRubros: true,
		defaultScheduleMode: "manual",
		showLinkedAsset: false,
		showInformalAgreement: false,
	},
	{
		profile: "debt_consolidation",
		group: "cash",
		label: "Recaudo de cartera",
		description: "Compra o consolidación de deudas",
		suggestDisbursement: true,
		suggestRubros: true,
		defaultScheduleMode: "cuota_fija",
		showLinkedAsset: false,
		showInformalAgreement: false,
	},
	{
		profile: "tangible_product",
		group: "financed",
		label: "Producto / bien tangible",
		description: "Vehículo, electrodoméstico, muebles, etc.",
		suggestDisbursement: false,
		suggestRubros: false,
		defaultScheduleMode: "cuota_fija",
		showLinkedAsset: true,
		showInformalAgreement: false,
	},
	{
		profile: "intangible_service",
		group: "financed",
		label: "Servicio intangible",
		description: "Curso, software, membresía, salud, etc.",
		suggestDisbursement: false,
		suggestRubros: false,
		defaultScheduleMode: "cuota_fija",
		showLinkedAsset: true,
		showInformalAgreement: false,
	},
	{
		profile: "p2p_agreement",
		group: "informal",
		label: "Préstamo personal",
		description: "Familiar, amigo, socio u otra persona",
		suggestDisbursement: false,
		suggestRubros: false,
		defaultScheduleMode: "manual",
		showLinkedAsset: false,
		showInformalAgreement: true,
	},
];

export function getCreditProfileConfig(
	profile: CreditProfile,
): CreditProfileConfig {
	return (
		CREDIT_PROFILE_REGISTRY.find((item) => item.profile === profile) ??
		CREDIT_PROFILE_REGISTRY[0]
	);
}

export function getProfilesForGroup(
	group: CreditProfileGroup,
): CreditProfileConfig[] {
	return CREDIT_PROFILE_REGISTRY.filter((item) => item.group === group);
}

/** Product/service credits use linkedAsset as the destination — no Destinos tab. */
export function usesDestinationsTab(profile: CreditProfile): boolean {
	return profile !== "tangible_product" && profile !== "intangible_service";
}

export function getIncompatibleProfileDataLabels(
	credit: {
		linkedAsset?: unknown;
		informalAgreement?: unknown;
		fundExpenseCategoryCount?: number;
	},
	newProfile: CreditProfile,
): string[] {
	const config = getCreditProfileConfig(newProfile);
	const items: string[] = [];
	if (credit.linkedAsset && !config.showLinkedAsset) {
		items.push("producto o bien vinculado");
	}
	if (credit.informalAgreement && !config.showInformalAgreement) {
		items.push("datos del acuerdo informal");
	}
	if ((credit.fundExpenseCategoryCount ?? 0) > 0 && !config.suggestRubros) {
		items.push("rubros de gasto del fondo");
	}
	return items;
}

export const DEFAULT_RATE_TYPE: RateType = "MV";
