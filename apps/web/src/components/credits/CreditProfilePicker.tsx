import {
	CREDIT_PROFILE_GROUPS,
	getProfilesForGroup,
	type CreditProfileGroup,
} from "@app/lib/credits/creditProfileRegistry";
import type { CreditProfile } from "@app/lib/credits/types";
import { CoreIcon } from "@app/lib/core/icons";

type CreditProfilePickerProps = {
	onSelect: (profile: CreditProfile) => void;
};

export function CreditProfilePicker({ onSelect }: CreditProfilePickerProps) {
	return (
		<div className="credit-profile-picker">
			<p className="credit-profile-picker__intro">
				Elige el tipo que más se parece a tu crédito. Podrás completar el resto
				después.
			</p>
			<div className="credit-profile-picker__groups">
				{CREDIT_PROFILE_GROUPS.map((group) => (
					<section key={group.id} className="credit-profile-picker__group">
						<header className="credit-profile-picker__group-header">
							<h3 className="credit-profile-picker__group-title">
								{group.label}
							</h3>
							<p className="credit-profile-picker__group-desc">
								{group.description}
							</p>
						</header>
						<ul className="credit-profile-picker__list">
							{getProfilesForGroup(group.id as CreditProfileGroup).map(
								(item) => (
									<li key={item.profile}>
										<button
											type="button"
											className="credit-profile-picker__card"
											onClick={() => onSelect(item.profile)}
										>
											<span className="credit-profile-picker__card-body">
												<span className="credit-profile-picker__card-title">
													{item.label}
												</span>
												<span className="credit-profile-picker__card-desc">
													{item.description}
												</span>
											</span>
											<span
												className="credit-profile-picker__card-icon"
												aria-hidden
											>
												<CoreIcon name="chevron-right" size={18} />
											</span>
										</button>
									</li>
								),
							)}
						</ul>
					</section>
				))}
			</div>
		</div>
	);
}
