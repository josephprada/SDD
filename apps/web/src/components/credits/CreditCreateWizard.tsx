import { CreditForm, type CreditFormValues } from "@app/components/credits/CreditForm";
import { CreditProfilePicker } from "@app/components/credits/CreditProfilePicker";
import { getCreditProfileConfig } from "@app/lib/credits/creditProfileRegistry";
import { CREDIT_PROFILE_LABELS, type CreditProfile } from "@app/lib/credits/types";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@jp-ds";
import { useState } from "react";

type CreditCreateWizardProps = {
	accounts: Array<{ _id: Id<"accounts">; name: string }>;
	expenseCategories: Array<{ _id: Id<"categories">; name: string }>;
	onSubmit: (values: CreditFormValues) => Promise<void>;
	onCancel: () => void;
	loading?: boolean;
	error?: string;
};

export function CreditCreateWizard({
	accounts,
	expenseCategories,
	onSubmit,
	onCancel,
	loading,
	error,
}: CreditCreateWizardProps) {
	const [step, setStep] = useState<1 | 2>(1);
	const [profile, setProfile] = useState<CreditProfile | null>(null);

	const handleProfileSelect = (next: CreditProfile) => {
		setProfile(next);
		setStep(2);
	};

	if (step === 2 && profile) {
		return (
			<CreditForm
				key={profile}
				creditProfile={profile}
				profileConfig={getCreditProfileConfig(profile)}
				profileLabel={CREDIT_PROFILE_LABELS[profile]}
				onChangeProfile={() => setStep(1)}
				accounts={accounts}
				expenseCategories={expenseCategories}
				onSubmit={onSubmit}
				onCancel={onCancel}
				loading={loading}
				error={error}
			/>
		);
	}

	return (
		<div className="credit-create-wizard tx-form tx-form--modal">
			<div className="tx-form__scroll brand-scroll">
				<CreditProfilePicker onSelect={handleProfileSelect} />
			</div>
			<div className="form-panel__actions modal__footer">
				<Button type="button" variant="secondary" onClick={onCancel}>
					Cancelar
				</Button>
			</div>
		</div>
	);
}
