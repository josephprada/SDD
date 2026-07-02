import { FieldError } from "@app/components/ui/FieldError";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@jp-ds";
import { useMutation } from "convex/react";
import { useRef, useState } from "react";

const MAX_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;
const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];

type AttachmentUploaderProps = {
	transactionId: Id<"transactions">;
	currentCount?: number;
};

export function AttachmentUploader({
	transactionId,
	currentCount = 0,
}: AttachmentUploaderProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const generateUploadUrl = useMutation(api.attachments.generateUploadUrl);
	const createAttachment = useMutation(api.attachments.create);
	const [error, setError] = useState("");
	const [uploading, setUploading] = useState(false);

	const handleFiles = async (files: FileList | null) => {
		if (!files?.length) return;
		const file = files[0];

		if (!ALLOWED.includes(file.type)) {
			setError("Solo se permiten JPEG, PNG y PDF");
			return;
		}
		if (file.size > MAX_SIZE) {
			setError("El archivo supera 10 MB");
			return;
		}
		if (currentCount >= MAX_FILES) {
			setError("Máximo 5 adjuntos por movimiento");
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
				transactionId,
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
			<input
				ref={inputRef}
				type="file"
				accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
				className="sr-only"
				id={`upload-${transactionId}`}
				onChange={(e) => handleFiles(e.target.files)}
			/>
			<Button
				type="button"
				variant="secondary"
				disabled={uploading || currentCount >= MAX_FILES}
				onClick={() => inputRef.current?.click()}
			>
				{uploading ? "Subiendo…" : "Adjuntar archivo"}
			</Button>
			<FieldError message={error} />
		</div>
	);
}
