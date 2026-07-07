import { FieldError } from "@app/components/ui/FieldError";
import { FieldHelp } from "@app/components/ui/FieldHelp";
import { FormSelect } from "@app/components/ui/FormSelect";
import type { Id } from "@convex/_generated/dataModel";
import { Button, Input } from "@jp-ds";
import { useMemo, useState } from "react";

export type FundExpenseCategorySelection = {
	selectedIds: Id<"categories">[];
	newNames: string[];
};

type FundExpenseCategoryPickerProps = {
	label?: string;
	hint?: string;
	availableCategories: Array<{ _id: Id<"categories">; name: string }>;
	value: FundExpenseCategorySelection;
	onChange: (value: FundExpenseCategorySelection) => void;
	error?: string;
};

export function FundExpenseCategoryPicker({
	label = "Categorías para gastos del fondo",
	hint = "Estas categorías aparecerán al registrar gastos desde el fondo del crédito o en Movimientos.",
	availableCategories,
	value,
	onChange,
	error,
}: FundExpenseCategoryPickerProps) {
	const [pickExistingId, setPickExistingId] = useState("");
	const [newName, setNewName] = useState("");

	const selectedCategories = useMemo(() => {
		const fromExisting = value.selectedIds
			.map((id) => availableCategories.find((c) => c._id === id))
			.filter(Boolean) as Array<{ _id: Id<"categories">; name: string }>;
		const fromNew = value.newNames.map((name, index) => ({
			_id: `new-${index}` as Id<"categories">,
			name: `${name} (nueva)`,
		}));
		return [...fromExisting, ...fromNew];
	}, [availableCategories, value.selectedIds, value.newNames]);

	const addExisting = () => {
		if (!pickExistingId) return;
		const id = pickExistingId as Id<"categories">;
		if (value.selectedIds.includes(id)) return;
		onChange({
			...value,
			selectedIds: [...value.selectedIds, id],
		});
		setPickExistingId("");
	};

	const addNew = () => {
		const trimmed = newName.trim();
		if (!trimmed) return;
		if (
			value.newNames.some(
				(name) => name.toLowerCase() === trimmed.toLowerCase(),
			)
		) {
			return;
		}
		onChange({
			...value,
			newNames: [...value.newNames, trimmed],
		});
		setNewName("");
	};

	const removeExisting = (id: Id<"categories">) => {
		onChange({
			...value,
			selectedIds: value.selectedIds.filter((item) => item !== id),
		});
	};

	const removeNew = (index: number) => {
		onChange({
			...value,
			newNames: value.newNames.filter((_, i) => i !== index),
		});
	};

	return (
		<div className="fund-category-picker credit-form-grid__full">
			<div className="field-label-row">
				<span className="jp-input-label">{label}</span>
				{hint ? <FieldHelp text={hint} /> : null}
			</div>

			{selectedCategories.length > 0 ? (
				<ul className="fund-category-picker__list">
					{value.selectedIds.map((id) => {
						const category = availableCategories.find((c) => c._id === id);
						if (!category) return null;
						return (
							<li key={id} className="fund-category-picker__chip glass">
								<span>{category.name}</span>
								<button
									type="button"
									className="fund-category-picker__remove"
									onClick={() => removeExisting(id)}
									aria-label={`Quitar ${category.name}`}
								>
									×
								</button>
							</li>
						);
					})}
					{value.newNames.map((name, index) => (
						<li
							key={`new-${name}-${index}`}
							className="fund-category-picker__chip glass"
						>
							<span>{name} (nueva)</span>
							<button
								type="button"
								className="fund-category-picker__remove"
								onClick={() => removeNew(index)}
								aria-label={`Quitar ${name}`}
							>
								×
							</button>
						</li>
					))}
				</ul>
			) : (
				<p className="tx-form__hint">Agrega al menos una categoría.</p>
			)}

			<div className="fund-category-picker__row">
				<FormSelect
					id="fund-category-existing"
					label="Agregar categoría existente"
					value={pickExistingId}
					onChange={setPickExistingId}
				>
					{availableCategories
						.filter((c) => !value.selectedIds.includes(c._id))
						.map((c) => (
							<option key={c._id} value={c._id}>
								{c.name}
							</option>
						))}
				</FormSelect>
				<Button
					type="button"
					variant="secondary"
					onClick={addExisting}
					disabled={!pickExistingId}
				>
					Agregar
				</Button>
			</div>

			<div className="fund-category-picker__row">
				<Input
					label="Crear categoría nueva"
					value={newName}
					onChange={(e) => setNewName(e.target.value)}
					placeholder="Ej. Obra, Materiales…"
				/>
				<Button
					type="button"
					variant="secondary"
					onClick={addNew}
					disabled={!newName.trim()}
				>
					Crear
				</Button>
			</div>

			<FieldError message={error} />
		</div>
	);
}
