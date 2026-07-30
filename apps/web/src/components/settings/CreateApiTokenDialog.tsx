import { FieldError } from "@app/components/ui/FieldError";
import { Modal } from "@app/components/ui/Modal";
import {
	API_SCOPES,
	type ApiScope,
	type ExpiryPresetId,
	SCOPE_LABELS_ES,
	SCOPE_PRESETS,
	type ScopePresetId,
	expiryFromPreset,
} from "@app/lib/mcp/types";
import { Button, Input } from "@jp-ds";
import { useMemo, useState } from "react";

type CreateApiTokenDialogProps = {
	open: boolean;
	busy?: boolean;
	error?: string;
	onClose: () => void;
	onSubmit: (input: {
		name: string;
		scopes: ApiScope[];
		expiresAt?: number;
	}) => Promise<void>;
};

export function CreateApiTokenDialog({
	open,
	busy,
	error,
	onClose,
	onSubmit,
}: CreateApiTokenDialogProps) {
	const [name, setName] = useState("");
	const [preset, setPreset] = useState<ScopePresetId>("read");
	const [expiry, setExpiry] = useState<ExpiryPresetId>("90d");
	const [customScopes, setCustomScopes] = useState<ApiScope[]>([]);
	const [localError, setLocalError] = useState("");

	const scopes = useMemo(() => {
		if (preset === "custom") return customScopes;
		return SCOPE_PRESETS[preset].scopes;
	}, [preset, customScopes]);

	const reset = () => {
		setName("");
		setPreset("read");
		setExpiry("90d");
		setCustomScopes([]);
		setLocalError("");
	};

	const handleClose = () => {
		if (busy) return;
		reset();
		onClose();
	};

	const toggleCustomScope = (scope: ApiScope) => {
		setCustomScopes((prev) =>
			prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
		);
	};

	const handleSubmit = async () => {
		setLocalError("");
		const trimmed = name.trim();
		if (!trimmed) {
			setLocalError("El nombre es obligatorio");
			return;
		}
		if (scopes.length === 0) {
			setLocalError("Selecciona al menos un permiso");
			return;
		}
		try {
			await onSubmit({
				name: trimmed,
				scopes,
				expiresAt: expiryFromPreset(expiry),
			});
			reset();
		} catch {
			/* parent surfaces error */
		}
	};

	return (
		<Modal open={open} title="Nuevo token de acceso" onClose={handleClose}>
			<div className="api-token-form">
				<label className="api-token-form__field" htmlFor="api-token-name">
					<span>Nombre</span>
					<Input
						id="api-token-name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Ej. Cursor portátil"
						maxLength={80}
						disabled={busy}
					/>
				</label>

				<fieldset className="api-token-form__fieldset" disabled={busy}>
					<legend>Permisos</legend>
					{(Object.keys(SCOPE_PRESETS) as Array<"read" | "read_write">).map(
						(id) => (
							<label key={id} className="api-token-form__radio">
								<input
									type="radio"
									name="scope-preset"
									checked={preset === id}
									onChange={() => setPreset(id)}
								/>
								<span>
									<strong>{SCOPE_PRESETS[id].label}</strong>
									<small>{SCOPE_PRESETS[id].description}</small>
								</span>
							</label>
						),
					)}
					<label className="api-token-form__radio">
						<input
							type="radio"
							name="scope-preset"
							checked={preset === "custom"}
							onChange={() => setPreset("custom")}
						/>
						<span>
							<strong>Personalizado</strong>
							<small>
								Elige scopes uno a uno (incluye borrar si lo marcas).
							</small>
						</span>
					</label>
					{preset === "custom" ? (
						<div className="api-token-form__scope-grid">
							{API_SCOPES.map((scope) => (
								<label key={scope} className="api-token-form__check">
									<input
										type="checkbox"
										checked={customScopes.includes(scope)}
										onChange={() => toggleCustomScope(scope)}
									/>
									<span>{SCOPE_LABELS_ES[scope]}</span>
								</label>
							))}
						</div>
					) : null}
				</fieldset>

				<fieldset className="api-token-form__fieldset" disabled={busy}>
					<legend>Caducidad</legend>
					{(
						[
							["30d", "30 días"],
							["90d", "90 días (recomendado)"],
							["never", "Sin caducidad"],
						] as const
					).map(([id, label]) => (
						<label key={id} className="api-token-form__radio">
							<input
								type="radio"
								name="expiry"
								checked={expiry === id}
								onChange={() => setExpiry(id)}
							/>
							<span>{label}</span>
						</label>
					))}
					{expiry === "never" ? (
						<p className="api-token-form__hint">
							Sin caducidad aumenta el riesgo si el token se filtra. Revócalo si
							ya no lo usas.
						</p>
					) : null}
				</fieldset>

				{(localError || error) && <FieldError message={localError || error} />}

				<div className="api-token-form__actions">
					<Button variant="secondary" onClick={handleClose} disabled={busy}>
						Cancelar
					</Button>
					<Button onClick={() => void handleSubmit()} disabled={busy}>
						{busy ? "Creando…" : "Crear token"}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
