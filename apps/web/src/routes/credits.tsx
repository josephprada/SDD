import { CreditForm } from "@app/components/credits/CreditForm";
import { CreditList } from "@app/components/credits/CreditList";
import { Modal } from "@app/components/ui/Modal";
import { CoreIcon } from "@app/lib/core/icons";
import { Button } from "@jp-ds";
import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

export function CreditsRoute() {
	const credits = useQuery(api.credits.list, {});
	const accounts = useQuery(api.accounts.list, { includeArchived: false });
	const expenseCategories = useQuery(api.categories.list, {
		type: "expense",
		includeArchived: false,
	});
	const createCredit = useMutation(api.credits.create);

	const [modalOpen, setModalOpen] = useState(false);
	const [formKey, setFormKey] = useState(0);
	const [error, setError] = useState("");

	if (credits === undefined || accounts === undefined || expenseCategories === undefined) {
		return null;
	}

	const linkableExpenseCategories = expenseCategories
		.filter((c) => !c.linkedCreditId)
		.map((c) => ({ _id: c._id, name: c.name }));

	return (
		<div className="credits-page animate-stagger">
			<header className="credits-header animate-stagger-item">
				<div>
					<h1 className="page-title">Créditos</h1>
					<p className="page-subtitle">
						Préstamos, cuotas y abonos a capital
					</p>
				</div>
				<Button
					onClick={() => {
						setFormKey((k) => k + 1);
						setModalOpen(true);
					}}
				>
					<CoreIcon name="plus" size={16} />
					Nuevo crédito
				</Button>
			</header>

			<CreditList items={credits} />

			<Modal
				open={modalOpen}
				onClose={() => {
					setModalOpen(false);
					setError("");
				}}
				title="Nuevo crédito"
			>
				<CreditForm
					key={formKey}
					accounts={accounts.map((a) => ({ _id: a._id, name: a.name }))}
					expenseCategories={linkableExpenseCategories}
					error={error}
					onCancel={() => setModalOpen(false)}
					onSubmit={async (values) => {
						setError("");
						try {
							await createCredit(values);
							setModalOpen(false);
						} catch (e) {
							setError(
								e instanceof Error ? e.message : "Error al crear crédito",
							);
						}
					}}
				/>
			</Modal>
		</div>
	);
}
