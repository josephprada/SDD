import { FieldError } from "@app/components/ui/FieldError";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
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
import { Checkbox, Input, Radio } from "@jp-ds";
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

	const toggleCustomScope = (scope: ApiScope, checked: boolean) => {
		setCustomScopes((prev) => {
			if (checked) {
				return prev.includes(scope) ? prev : [...prev, scope];
			}
			return prev.filter((s) => s !== scope);
		});
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
			<form
				className="tx-form tx-form--modal"
				onSubmit={(e) => {
					e.preventDefault();
					void handleSubmit();
				}}
				noValidate
			>
				<div className="tx-form__scroll brand-scroll api-token-form">
					<Input
						id="api-token-name"
						label="Nombre"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Ej. Cursor portátil"
						maxLength={80}
						disabled={busy}
						required
					/>

					<fieldset className="api-token-form__fieldset" disabled={busy}>
						<legend>Permisos</legend>
						<div
							className="api-token-form__options"
							role="radiogroup"
							aria-label="Nivel de permisos"
						>
							{(Object.keys(SCOPE_PRESETS) as Array<"read" | "read_write">).map(
								(id) => (
									<Radio
										key={id}
										name="scope-preset"
										value={id}
										checked={preset === id}
										disabled={busy}
										label={SCOPE_PRESETS[id].label}
										description={SCOPE_PRESETS[id].description}
										onChange={(checked) => {
											if (checked) setPreset(id);
										}}
									/>
								),
							)}
							<Radio
								name="scope-preset"
								value="custom"
								checked={preset === "custom"}
								disabled={busy}
								label="Personalizado"
								description="Elige scopes uno a uno (incluye borrar si lo marcas)."
								onChange={(checked) => {
									if (checked) setPreset("custom");
								}}
							/>
						</div>
						{preset === "custom" ? (
							<div className="api-token-form__scope-grid">
								{API_SCOPES.map((scope) => (
									<Checkbox
										key={scope}
										className="api-token-form__check"
										label={SCOPE_LABELS_ES[scope]}
										checked={customScopes.includes(scope)}
										disabled={busy}
										onChange={(checked) => toggleCustomScope(scope, checked)}
									/>
								))}
							</div>
						) : null}
					</fieldset>

					<fieldset className="api-token-form__fieldset" disabled={busy}>
						<legend>Caducidad</legend>
						<div
							className="api-token-form__options"
							role="radiogroup"
							aria-label="Caducidad del token"
						>
							{(
								[
									["30d", "30 días"],
									["90d", "90 días (recomendado)"],
									["never", "Sin caducidad"],
								] as const
							).map(([id, label]) => (
								<Radio
									key={id}
									name="expiry"
									value={id}
									checked={expiry === id}
									disabled={busy}
									label={label}
									onChange={(checked) => {
										if (checked) setExpiry(id);
									}}
								/>
							))}
						</div>
						{expiry === "never" ? (
							<p className="tx-form__hint api-token-form__hint">
								Sin caducidad aumenta el riesgo si el token se filtra. Revócalo
								si ya no lo usas.
							</p>
						) : null}
					</fieldset>

					{(localError || error) && (
						<FieldError message={localError || error} />
					)}
				</div>

				<FormModalFooter
					onCancel={handleClose}
					loading={busy}
					submitLabel="Crear token"
					savingLabel="Creando…"
				/>
			</form>
		</Modal>
	);
}
