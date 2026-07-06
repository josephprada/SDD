import { ContributionForm } from "@app/components/savings/ContributionForm";
import { SavingsGoalForm } from "@app/components/savings/SavingsGoalForm";
import { SavingsGoalList } from "@app/components/savings/SavingsGoalList";
import { Modal } from "@app/components/ui/Modal";
import { CoreIcon } from "@app/lib/core/icons";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@jp-ds";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Link } from "react-router";

export function SavingsRoute() {
	const goals = useQuery(api.savingsGoals.list, {});
	const credits = useQuery(api.credits.list, {});
	const createGoal = useMutation(api.savingsGoals.create);
	const createContribution = useMutation(api.savingsContributions.create);

	const [goalModal, setGoalModal] = useState(false);
	const [contribModal, setContribModal] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [suggestAbono, setSuggestAbono] = useState(false);
	const [linkedCreditId, setLinkedCreditId] = useState<string | undefined>();

	if (goals === undefined || credits === undefined) return null;

	return (
		<div className="savings-page animate-stagger">
			<header className="credits-header animate-stagger-item">
				<div>
					<h1 className="page-title">Metas de ahorro</h1>
					<p className="page-subtitle">
						Ahorro separado del fondo de crédito
					</p>
				</div>
				<Button onClick={() => setGoalModal(true)}>
					<CoreIcon name="plus" size={16} />
					Nueva meta
				</Button>
			</header>

			<SavingsGoalList
				items={goals}
				onEdit={() => setGoalModal(true)}
				onContribute={(id) => {
					setContribModal(id);
					setSuggestAbono(false);
				}}
			/>

			<Modal
				open={goalModal}
				onClose={() => {
					setGoalModal(false);
					setError("");
				}}
				title="Nueva meta de ahorro"
			>
				<SavingsGoalForm
					credits={credits.map((c) => ({ _id: c._id, name: c.name }))}
					error={error}
					loading={loading}
					onCancel={() => setGoalModal(false)}
					onSubmit={async (values) => {
						setLoading(true);
						setError("");
						try {
							await createGoal(values);
							setGoalModal(false);
						} catch (e) {
							setError(
								e instanceof Error ? e.message : "Error al crear meta",
							);
						} finally {
							setLoading(false);
						}
					}}
				/>
			</Modal>

			<Modal
				open={contribModal !== null}
				onClose={() => setContribModal(null)}
				title="Registrar aporte"
			>
				{contribModal ? (
					<>
						<ContributionForm
							error={error}
							loading={loading}
							suggestAbono={suggestAbono}
							linkedCreditId={linkedCreditId}
							onCancel={() => setContribModal(null)}
							onSubmit={async (values) => {
								setLoading(true);
								setError("");
								try {
									const result = await createContribution({
										goalId: contribModal as Id<"savingsGoals">,
										...values,
									});
									if (result.suggestAbono && result.linkedCreditId) {
										setSuggestAbono(true);
										setLinkedCreditId(result.linkedCreditId);
									} else {
										setContribModal(null);
									}
								} catch (e) {
									setError(
										e instanceof Error
											? e.message
											: "Error al registrar aporte",
									);
								} finally {
									setLoading(false);
								}
							}}
						/>
						{suggestAbono && linkedCreditId ? (
							<p className="credit-form-grid__full">
								<Link to={`/credits/${linkedCreditId}?tab=abonos`}>
									Ir a abono del crédito vinculado →
								</Link>
							</p>
						) : null}
					</>
				) : null}
			</Modal>
		</div>
	);
}
