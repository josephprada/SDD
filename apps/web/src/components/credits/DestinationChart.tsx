import { lazy, Suspense } from "react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";

const DestinationChartInner = lazy(() =>
	import("./DestinationChartInner").then((m) => ({
		default: m.DestinationChartInner,
	})),
);

type Props = {
	destinations: FunctionReturnType<
		typeof api.creditDestinations.list
	>["destinations"];
	principal: number;
};

export function DestinationChart({ destinations, principal }: Props) {
	if (destinations.length === 0) return null;

	return (
		<Suspense fallback={<div className="destination-chart">Cargando gráfico…</div>}>
			<DestinationChartInner destinations={destinations} principal={principal} />
		</Suspense>
	);
}
