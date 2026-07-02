import type { TransactionFiltersState } from "@app/lib/core/types";
import type { Id } from "@convex/_generated/dataModel";
import type { Doc } from "@convex/_generated/dataModel";
import { Input } from "@jp-ds";

type TransactionFiltersProps = {
	filters: TransactionFiltersState;
	accounts: Doc<"accounts">[];
	categories: Doc<"categories">[];
	onChange: (filters: TransactionFiltersState) => void;
};

export function TransactionFilters({
	filters,
	accounts,
	categories,
	onChange,
}: TransactionFiltersProps) {
	const set = (patch: Partial<TransactionFiltersState>) =>
		onChange({ ...filters, ...patch });

	return (
		<div className="tx-filters glass">
			<Input
				label="Buscar"
				placeholder="Nota, cuenta o categoría"
				value={filters.search}
				onChange={(e) => set({ search: e.target.value })}
			/>

			<div className="tx-filters__row">
				<div className="tx-filters__field">
					<label className="jp-input-label" htmlFor="filter-account">
						Cuenta
					</label>
					<select
						id="filter-account"
						className="jp-input"
						value={filters.accountId}
						onChange={(e) =>
							set({ accountId: e.target.value as Id<"accounts"> | "" })
						}
					>
						<option value="">Todas</option>
						{accounts
							.filter((a) => !a.archived)
							.map((a) => (
								<option key={a._id} value={a._id}>
									{a.name}
								</option>
							))}
					</select>
				</div>

				<div className="tx-filters__field">
					<label className="jp-input-label" htmlFor="filter-category">
						Categoría
					</label>
					<select
						id="filter-category"
						className="jp-input"
						value={filters.categoryId}
						onChange={(e) =>
							set({ categoryId: e.target.value as Id<"categories"> | "" })
						}
					>
						<option value="">Todas</option>
						{categories
							.filter((c) => !c.archived)
							.map((c) => (
								<option key={c._id} value={c._id}>
									{c.icon} {c.name}
								</option>
							))}
					</select>
				</div>
			</div>

			<div className="tx-filters__chips">
				{filters.search ? (
					<button
						type="button"
						className="filter-chip"
						onClick={() => set({ search: "" })}
					>
						Buscar: {filters.search} ×
					</button>
				) : null}
				{filters.accountId ? (
					<button
						type="button"
						className="filter-chip"
						onClick={() => set({ accountId: "" })}
					>
						Cuenta activa ×
					</button>
				) : null}
				{filters.categoryId ? (
					<button
						type="button"
						className="filter-chip"
						onClick={() => set({ categoryId: "" })}
					>
						Categoría activa ×
					</button>
				) : null}
			</div>
		</div>
	);
}
