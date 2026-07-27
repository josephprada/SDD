import { ConfirmDialog } from "@app/components/ui/ConfirmDialog";
import { FieldError } from "@app/components/ui/FieldError";
import { CoreIcon } from "@app/lib/core/icons";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button, IconButton } from "@jp-ds";
import { useMutation, useQuery } from "convex/react";
import { useRef, useState } from "react";

const MAX_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;
const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];

function AttachmentPreview({
	storageId,
	mimeType,
	filename,
}: {
	storageId: Id<"_storage">;
	mimeType: string;
	filename: string;
}) {
	const url = useQuery(api.attachments.getUrl, { storageId });
	if (!url) return <span className="attachment-item__name">{filename}</span>;
	if (mimeType.startsWith("image/")) {
		return (
			<a href={url} target="_blank" rel="noopener noreferrer">
				<img src={url} alt={filename} className="attachment-item__thumb" />
			</a>
		);
	}
	return (
		<a href={url} download={filename} className="attachment-item__pdf">
			📄 {filename}
		</a>
	);
}

type TaxItemAttachmentsProps = {
	taxItemId: Id<"taxItems">;
	readOnly?: boolean;
};

export function TaxItemAttachments({
	taxItemId,
	readOnly,
}: TaxItemAttachmentsProps) {
	const attachments = useQuery(api.attachments.listByTaxItem, { taxItemId });
	const generateUploadUrl = useMutation(api.attachments.generateUploadUrl);
	const createAttachment = useMutation(api.attachments.createForTaxItem);
	const removeAttachment = useMutation(api.attachments.remove);
	const inputRef = useRef<HTMLInputElement>(null);
	const [error, setError] = useState("");
	const [uploading, setUploading] = useState(false);
	const [pendingId, setPendingId] = useState<Id<"attachments"> | null>(null);

	const count = attachments?.length ?? 0;

	const handleFiles = async (files: FileList | null) => {
		if (!files?.length || readOnly) return;
		const file = files[0];
		if (!ALLOWED.includes(file.type)) {
			setError("Solo se permiten JPEG, PNG y PDF");
			return;
		}
		if (file.size > MAX_SIZE) {
			setError("El archivo supera 10 MB");
			return;
		}
		if (count >= MAX_FILES) {
			setError("Máximo 5 adjuntos por rubro");
			return;
		}
		setError("");
		setUploading(true);
		try {
			const uploadUrl = await generateUploadUrl({});
			const result = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});
			const { storageId } = await result.json();
			await createAttachment({
				taxItemId,
				storageId,
				filename: file.name,
				mimeType: file.type as "image/jpeg" | "image/png" | "application/pdf",
				size: file.size,
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error al subir archivo");
		} finally {
			setUploading(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	return (
		<div className="attachment-uploader">
			{attachments && attachments.length > 0 ? (
				<ul className="attachment-list">
					{attachments.map((att) => (
						<li key={att._id} className="attachment-item glass">
							<AttachmentPreview
								storageId={att.storageId}
								mimeType={att.mimeType}
								filename={att.filename}
							/>
							{!readOnly ? (
								<IconButton
									aria-label={`Eliminar ${att.filename}`}
									onClick={() => setPendingId(att._id)}
								>
									<CoreIcon name="trash" size={16} />
								</IconButton>
							) : null}
						</li>
					))}
				</ul>
			) : null}

			{!readOnly ? (
				<>
					<input
						ref={inputRef}
						type="file"
						accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
						className="sr-only"
						id={`tax-upload-${taxItemId}`}
						onChange={(e) => handleFiles(e.target.files)}
					/>
					<Button
						type="button"
						variant="secondary"
						disabled={uploading || count >= MAX_FILES}
						onClick={() => inputRef.current?.click()}
					>
						{uploading ? "Subiendo…" : "Adjuntar archivo"}
					</Button>
				</>
			) : null}
			<FieldError message={error} />

			<ConfirmDialog
				open={pendingId !== null}
				title="Eliminar adjunto"
				description="¿Eliminar este archivo? Esta acción no se puede deshacer."
				confirmLabel="Eliminar"
				variant="danger"
				onConfirm={async () => {
					if (!pendingId) return;
					await removeAttachment({ attachmentId: pendingId });
					setPendingId(null);
				}}
				onCancel={() => setPendingId(null)}
			/>
		</div>
	);
}
