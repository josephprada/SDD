import { FieldError } from "@app/components/ui/FieldError";
import {
	CATEGORY_ICON_GROUPS,
	CATEGORY_ICONS,
	CategoryIcon,
} from "@app/lib/core/categoryIcon";

const DEFAULT_ICON = CATEGORY_ICONS[0];
import type { CategoryFormValues, CategoryType } from "@app/lib/core/types";
import { CATEGORY_COLORS } from "@app/lib/core/types";
import { Button, Input } from "@jp-ds";
import { useState } from "react";

type CategoryFormProps = {
	initial?: Partial<CategoryFormValues>;
	type: CategoryType;
	loading?: boolean;
	serverError?: string;
	isEdit?: boolean;
	onSubmit: (values: CategoryFormValues) => void;
	onCancel: () => void;
	onArchive?: () => void;
};

export function CategoryForm({
	initial,
	type,
	loading = false,
	serverError,
	isEdit = false,
	onSubmit,
	onCancel,
	onArchive,
}: CategoryFormProps) {
	const [values, setValues] = useState<CategoryFormValues>({
		name: initial?.name ?? "",
		icon: initial?.icon ?? DEFAULT_ICON,
		color: initial?.color ?? CATEGORY_COLORS[0],
		type,
	});
	const [error, setError] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!values.name.trim()) {
			setError("El nombre es obligatorio");
			return;
		}
		setError("");
		onSubmit({ ...values, name: values.name.trim(), type });
	};

	return (
		<form className="modal-form" onSubmit={handleSubmit} noValidate>
			<Input
				label="Nombre"
				value={values.name}
				onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
				required
			/>
			<FieldError message={error || serverError} />

			<span className="jp-input-label">Icono</span>
			<div className="icon-picker brand-scroll" aria-label="Icono">
				{CATEGORY_ICON_GROUPS.map((group) => (
					<div key={group.label} className="icon-picker__group">
						<span className="icon-picker__group-label">{group.label}</span>
						<div className="icon-picker__grid">
							{group.icons.map((iconName) => (
								<button
									key={iconName}
									type="button"
									aria-pressed={values.icon === iconName}
									className={`icon-picker__item${values.icon === iconName ? " icon-picker__item--active" : ""}`}
									onClick={() => setValues((v) => ({ ...v, icon: iconName }))}
								>
									<CategoryIcon
										icon={iconName}
										size={18}
										color={
											values.icon === iconName
												? "var(--color-accent)"
												: "var(--color-text-secondary)"
										}
									/>
								</button>
							))}
						</div>
					</div>
				))}
			</div>

			<span className="jp-input-label">Color</span>
			<div className="color-picker" aria-label="Color">
				{CATEGORY_COLORS.map((color) => (
					<button
						key={color}
						type="button"
						aria-pressed={values.color === color}
						className={`color-picker__item${values.color === color ? " color-picker__item--active" : ""}`}
						style={{ backgroundColor: color }}
						aria-label={color}
						onClick={() => setValues((v) => ({ ...v, color }))}
					/>
				))}
			</div>

			<div className="form-panel__actions">
				{isEdit && onArchive ? (
					<Button type="button" variant="secondary" onClick={onArchive}>
						Archivar
					</Button>
				) : (
					<Button type="button" variant="secondary" onClick={onCancel}>
						Cancelar
					</Button>
				)}
				<Button type="submit" disabled={loading}>
					{loading ? "Guardando…" : "Guardar"}
				</Button>
			</div>
		</form>
	);
}
