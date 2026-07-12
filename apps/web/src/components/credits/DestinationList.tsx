import { formatCOP } from "@app/lib/format/currency";
import { formatShortDate } from "@app/lib/format/date";
import { CoreIcon } from "@app/lib/core/icons";
import { IconButton } from "@jp-ds";
import type { FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";

type DestinationData = FunctionReturnType<typeof api.creditDestinations.list>;
type DestinationItem = DestinationData["destinations"][number];

type DestinationListProps = {
	data: DestinationData;
	onEdit: (destination: DestinationItem) => void;
	onDelete: (id: string) => void;
	onMovementClick?: (transactionId: string) => void;
};

export function DestinationList({
	data,
	onEdit,
	onDelete,
	onMovementClick,
}: DestinationListProps) {
	const { destinations, totalAllocated, unallocated, overAllocated } = data;

	return (
		<div>
			{overAllocated ? (
				<p className="credit-warn" role="alert">
					La suma de rubros ({formatCOP(totalAllocated)}) supera el monto
					desembolsado.
				</p>
			) : null}
			<div className="credit-summary">
				<div className="credit-summary__item">
					<span className="credit-summary__label">Asignado</span>
					<strong>{formatCOP(totalAllocated)}</strong>
				</div>
				<div className="credit-summary__item">
					<span className="credit-summary__label">Sin asignar</span>
					<strong>{formatCOP(unallocated)}</strong>
				</div>
			</div>
			{destinations.length === 0 ? (
				<p className="budget-empty">Sin rubros definidos.</p>
			) : (
				<ul className="credit-list">
					{destinations.map((d) => {
						const spentTotal = d.spentTotal ?? 0;
						const progress =
							d.amount > 0
								? Math.min(100, Math.round((spentTotal / d.amount) * 100))
								: 0;
						const overSpent = spentTotal > d.amount;
						const movements = d.movements ?? [];

						return (
							<li key={d._id} className="credit-card destination-card glass">
								<div className="destination-card__header">
									<button
										type="button"
										className="credit-card__main"
										onClick={() => onEdit(d)}
									>
										<div className="credit-card__row">
											<strong>{d.name}</strong>
											<span>{formatCOP(d.amount)}</span>
										</div>
										<span
											className={`credit-card__lender${overSpent ? " credit-card__lender--warn" : ""}`}
										>
											Gastado {formatCOP(spentTotal)}
											{spentTotal > 0 ? ` (${progress}% del rubro)` : ""}
										</span>
										{d.notes ? (
											<span className="destination-card__notes">{d.notes}</span>
										) : null}
										{spentTotal > 0 ? (
											<div
												className="destination-progress"
												role="progressbar"
												aria-valuenow={Math.min(progress, 100)}
												aria-valuemin={0}
												aria-valuemax={100}
												aria-label={`Gastado ${formatCOP(spentTotal)} de ${formatCOP(d.amount)}`}
											>
												<div
													className={`destination-progress__bar${overSpent ? " destination-progress__bar--over" : ""}`}
													style={{
														width: `${Math.min(progress, 100)}%`,
													}}
												/>
											</div>
										) : null}
									</button>
									<div
										className="credit-card__actions"
										onClick={(event) => event.stopPropagation()}
										onKeyDown={(event) => event.stopPropagation()}
									>
										<IconButton
											aria-label={`Eliminar ${d.name}`}
											onClick={() => onDelete(d._id)}
										>
											<CoreIcon name="trash" size={16} />
										</IconButton>
									</div>
								</div>
								{movements.length > 0 ? (
									<ul className="destination-movements">
										{movements.map((movement) => (
											<li key={movement._id}>
												<button
													type="button"
													className="destination-movement"
													onClick={() =>
														onMovementClick?.(movement._id)
													}
												>
													<div className="destination-movement__row">
														<span className="destination-movement__desc">
															{movement.categoryName}
															{movement.notes?.trim()
																? ` - ${movement.notes.trim()}`
																: null}
														</span>
														<strong className="destination-movement__amount">
															{formatCOP(movement.amount)}
														</strong>
													</div>
													<span className="destination-movement__meta">
														{formatShortDate(movement.date)} ·{" "}
														{movement.accountName}
													</span>
												</button>
											</li>
										))}
									</ul>
								) : null}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
