import { ConfirmDialog } from "@app/components/ui/ConfirmDialog";
import { CoreIcon } from "@app/lib/core/icons";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { IconButton } from "@jp-ds";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

type AttachmentListProps = {
	transactionId: Id<"transactions">;
};

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

export function AttachmentList({ transactionId }: AttachmentListProps) {
	const attachments = useQuery(api.attachments.listByTransaction, {
		transactionId,
	});
	const removeAttachment = useMutation(api.attachments.remove);
	const [pendingId, setPendingId] = useState<Id<"attachments"> | null>(null);

	if (!attachments?.length) return null;

	const handleRemove = async () => {
		if (!pendingId) return;
		await removeAttachment({ attachmentId: pendingId });
		setPendingId(null);
	};

	return (
		<>
			<ul className="attachment-list">
				{attachments.map((att) => (
					<li key={att._id} className="attachment-item glass">
						<AttachmentPreview
							storageId={att.storageId}
							mimeType={att.mimeType}
							filename={att.filename}
						/>
						<IconButton
							aria-label={`Eliminar ${att.filename}`}
							onClick={() => setPendingId(att._id)}
						>
							<CoreIcon name="trash" size={16} />
						</IconButton>
					</li>
				))}
			</ul>

			<ConfirmDialog
				open={pendingId !== null}
				title="Eliminar adjunto"
				description="¿Eliminar este archivo? Esta acción no se puede deshacer."
				confirmLabel="Eliminar"
				variant="danger"
				onConfirm={handleRemove}
				onCancel={() => setPendingId(null)}
			/>
		</>
	);
}

export function useAttachmentCount(
	transactionId: Id<"transactions"> | undefined,
) {
	const attachments = useQuery(
		api.attachments.listByTransaction,
		transactionId ? { transactionId } : "skip",
	);
	return attachments?.length ?? 0;
}
