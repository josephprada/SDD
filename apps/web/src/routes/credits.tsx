import { CreditForm } from "@app/components/credits/CreditForm";
import { CreditList } from "@app/components/credits/CreditList";
import { BrandLogoMark } from "@app/components/brand/BrandLogoMark";
import { Modal } from "@app/components/ui/Modal";
import { CoreIcon } from "@app/lib/core/icons";
import { Button, IconButton } from "@jp-ds";
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
			<div className="page-header animate-stagger-item">
				<div className="dash-header__brand show-desktop">
					<BrandLogoMark size={42} />
					<div>
						<h1 className="page-title">Créditos</h1>
						<p className="page-subtitle">
							Préstamos, cuotas y abonos a capital
						</p>
					</div>
				</div>
				<div className="page-header__mobile show-mobile">
					<BrandLogoMark size={28} />
					<h1 className="page-title">Créditos</h1>
				</div>
				<div className="page-header__controls">
					<div className="page-header__actions show-desktop">
						<Button
							onClick={() => {
								setFormKey((k) => k + 1);
								setModalOpen(true);
							}}
						>
							<CoreIcon name="plus" size={16} />
							Nuevo crédito
						</Button>
					</div>
					<div className="page-header__actions show-mobile">
						<IconButton
							aria-label="Nuevo crédito"
							onClick={() => {
								setFormKey((k) => k + 1);
								setModalOpen(true);
							}}
						>
							<CoreIcon name="plus" size={20} />
						</IconButton>
					</div>
				</div>
			</div>

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
