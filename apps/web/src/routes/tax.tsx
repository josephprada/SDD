import { BrandLogoMark } from "@app/components/brand/BrandLogoMark";
import { TaxDocumentCreateForm } from "@app/components/tax/TaxDocumentCreateForm";
import { TaxDocumentList } from "@app/components/tax/TaxDocumentList";
import { Modal } from "@app/components/ui/Modal";
import { formatConvexError } from "@app/lib/convex/formatError";
import { CoreIcon } from "@app/lib/core/icons";
import { api } from "@convex/_generated/api";
import { Button, IconButton } from "@jp-ds";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { useNavigate } from "react-router";

export function TaxRoute() {
	const documents = useQuery(api.taxDocuments.list, {});
	const createDocument = useMutation(api.taxDocuments.create);
	const navigate = useNavigate();
	const [modalOpen, setModalOpen] = useState(false);
	const [error, setError] = useState("");

	if (documents === undefined) {
		return null;
	}

	return (
		<div className="tax-page animate-stagger">
			<div className="page-header animate-stagger-item">
				<div className="dash-header__brand show-desktop">
					<BrandLogoMark size={42} />
					<div>
						<h1 className="page-title">Declaración de renta</h1>
						<p className="page-subtitle">
							Por año gravable
						</p>
					</div>
				</div>
				<div className="page-header__mobile show-mobile">
					<BrandLogoMark size={28} />
					<h1 className="page-title">Declaración de renta</h1>
				</div>
				<div className="page-header__controls">
					<div className="page-header__actions show-desktop">
						<Button
							onClick={() => {
								setError("");
								setModalOpen(true);
							}}
						>
							<CoreIcon name="plus" size={16} />
							Nueva declaración
						</Button>
					</div>
					<div className="page-header__actions show-mobile">
						<IconButton
							aria-label="Nueva declaración"
							onClick={() => {
								setError("");
								setModalOpen(true);
							}}
						>
							<CoreIcon name="plus" size={20} />
						</IconButton>
					</div>
				</div>
			</div>

			<p className="tax-disclaimer animate-stagger-item">
				Organizador de apoyo; no es liquidación oficial DIAN ni presentación
				Muisca.
			</p>

			<TaxDocumentList items={documents} />

			<Modal
				open={modalOpen}
				onClose={() => {
					setModalOpen(false);
					setError("");
				}}
				title="Nueva declaración"
			>
				<TaxDocumentCreateForm
					error={error}
					onCancel={() => setModalOpen(false)}
					onSubmit={async (taxYear) => {
						setError("");
						try {
							const id = await createDocument({ taxYear });
							setModalOpen(false);
							navigate(`/tax/${id}`);
						} catch (e) {
							setError(formatConvexError(e, "No se pudo crear la declaración"));
						}
					}}
				/>
			</Modal>
		</div>
	);
}
