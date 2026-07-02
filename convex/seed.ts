export const DEFAULT_CATEGORIES = [
	{ name: "Comida", icon: "utensils", color: "#FF6B6B", type: "expense" as const },
	{
		name: "Transporte",
		icon: "car",
		color: "#4ECDC4",
		type: "expense" as const,
	},
	{
		name: "Entretenimiento",
		icon: "film",
		color: "#9B59B6",
		type: "expense" as const,
	},
	{ name: "Compras", icon: "shopping-cart", color: "#F39C12", type: "expense" as const },
	{ name: "Salud", icon: "pill", color: "#E74C3C", type: "expense" as const },
	{ name: "Hogar", icon: "house", color: "#3498DB", type: "expense" as const },
	{ name: "Servicios", icon: "file-text", color: "#95A5A6", type: "expense" as const },
	{
		name: "Otros Gastos",
		icon: "package",
		color: "#7F8C8D",
		type: "expense" as const,
	},
	{ name: "Salario", icon: "badge-dollar-sign", color: "#27AE60", type: "income" as const },
	{ name: "Freelance", icon: "laptop", color: "#2ECC71", type: "income" as const },
	{
		name: "Inversiones",
		icon: "trending-up",
		color: "#16A085",
		type: "income" as const,
	},
	{
		name: "Otros Ingresos",
		icon: "banknote",
		color: "#1ABC9C",
		type: "income" as const,
	},
	{
		name: "Transferencia",
		icon: "arrow-right-left",
		color: "#34495E",
		type: "transfer" as const,
		isSystem: true,
	},
];

export function categorySeedFields(
	category: (typeof DEFAULT_CATEGORIES)[number],
	createdAt: number,
) {
	const isSystem = "isSystem" in category && category.isSystem === true;
	return {
		name: category.name,
		icon: category.icon,
		color: category.color,
		type: category.type,
		archived: false,
		isSystem,
		createdAt,
		updatedAt: createdAt,
	};
}
