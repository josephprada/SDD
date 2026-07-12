import { FieldError } from "@app/components/ui/FieldError";
import { api } from "@convex/_generated/api";
import { useAuth } from "@app/lib/auth/useAuth";
import { Avatar, Button, Input } from "@jp-ds";
import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export function ProfileEditor() {
	const { session } = useAuth();
	const inputRef = useRef<HTMLInputElement>(null);
	const [name, setName] = useState(session?.name ?? "");
	const [error, setError] = useState("");
	const [avatarError, setAvatarError] = useState("");
	const [uploading, setUploading] = useState(false);
	const [savingName, setSavingName] = useState(false);

	const updateDisplayName = useMutation(api.users.updateDisplayName);
	const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
	const setAvatar = useMutation(api.users.setAvatar);
	const removeAvatar = useMutation(api.users.removeAvatar);

	useEffect(() => {
		if (session?.name) {
			setName(session.name);
		}
	}, [session?.name]);

	if (!session) return null;

	const handleSaveName = async () => {
		setError("");
		setSavingName(true);
		try {
			await updateDisplayName({ displayName: name });
		} catch (e) {
			setError(
				e instanceof Error ? e.message : "No se pudo guardar el nombre",
			);
		} finally {
			setSavingName(false);
		}
	};

	const handleAvatarFile = async (files: FileList | null) => {
		const file = files?.[0];
		if (!file) return;

		if (!ALLOWED_TYPES.includes(file.type)) {
			setAvatarError("Solo se permiten JPEG y PNG");
			return;
		}
		if (file.size > MAX_AVATAR_SIZE) {
			setAvatarError("La imagen supera 2 MB");
			return;
		}

		setAvatarError("");
		setUploading(true);
		try {
			const uploadUrl = await generateUploadUrl({});
			const result = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});
			const { storageId } = await result.json();
			await setAvatar({ storageId });
		} catch (e) {
			setAvatarError(
				e instanceof Error ? e.message : "Error al subir la imagen",
			);
		} finally {
			setUploading(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	const handleRemoveAvatar = async () => {
		setAvatarError("");
		try {
			await removeAvatar({});
		} catch (e) {
			setAvatarError(
				e instanceof Error ? e.message : "No se pudo quitar la foto",
			);
		}
	};

	return (
		<section className="settings-card glass" aria-label="Perfil">
			<div className="profile-editor">
				<div className="profile-editor__avatar-wrap">
					<Avatar
						src={session.picture}
						alt=""
						name={session.name}
					/>
					<button
						type="button"
						className="profile-editor__avatar-btn"
						aria-label="Cambiar foto de perfil"
						onClick={() => inputRef.current?.click()}
					/>
				</div>

				<div className="profile-editor__name-row">
					<Input
						label="Nombre visible"
						value={name}
						onChange={(e) => setName(e.target.value)}
						maxLength={80}
					/>
					<p className="profile-editor__email">{session.email}</p>
					<p className="profile-editor__hint">Email vinculado a Google (solo lectura)</p>
					<div className="profile-editor__actions">
						<Button
							variant="primary"
							onClick={handleSaveName}
							disabled={savingName || !name.trim()}
						>
							{savingName ? "Guardando…" : "Guardar nombre"}
						</Button>
						<Button
							variant="secondary"
							onClick={() => inputRef.current?.click()}
							disabled={uploading}
						>
							{uploading ? "Subiendo…" : "Cambiar foto"}
						</Button>
						{session.hasCustomAvatar ? (
							<Button variant="secondary" onClick={handleRemoveAvatar}>
								Usar foto de Google
							</Button>
						) : null}
					</div>
					<FieldError message={error} />
					<FieldError message={avatarError} />
				</div>
			</div>

			<input
				ref={inputRef}
				type="file"
				accept=".jpg,.jpeg,.png,image/jpeg,image/png"
				className="sr-only"
				onChange={(e) => void handleAvatarFile(e.target.files)}
			/>
		</section>
	);
}
