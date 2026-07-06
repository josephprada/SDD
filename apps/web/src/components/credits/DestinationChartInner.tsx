import { formatCOP } from "@app/lib/format/currency";
import {
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

const COLORS = [
	"var(--color-accent)",
	"#5B8DEF",
	"#F5A623",
	"#E74C3C",
	"#9B59B6",
	"#1ABC9C",
];

type Destination = {
	_id: string;
	name: string;
	amount: number;
};

type Props = {
	destinations: Destination[];
	principal: number;
};

export function DestinationChartInner({ destinations, principal }: Props) {
	const unallocated = Math.max(
		0,
		principal - destinations.reduce((s, d) => s + d.amount, 0),
	);
	const data = [
		...destinations.map((d) => ({ name: d.name, value: d.amount })),
		...(unallocated > 0
			? [{ name: "Sin asignar", value: unallocated }]
			: []),
	];

	return (
		<div className="destination-chart">
			<ResponsiveContainer width="100%" height={220}>
				<PieChart>
					<Pie
						data={data}
						dataKey="value"
						nameKey="name"
						cx="50%"
						cy="50%"
						outerRadius={80}
						label={({ name, percent }) =>
							`${name} ${((percent ?? 0) * 100).toFixed(0)}%`
						}
					>
						{data.map((_, index) => (
							<Cell
								key={index}
								fill={COLORS[index % COLORS.length]}
							/>
						))}
					</Pie>
					<Tooltip
						formatter={(value) =>
							formatCOP(typeof value === "number" ? value : Number(value))
						}
					/>
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}
