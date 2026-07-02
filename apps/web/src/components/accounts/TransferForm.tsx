import { CategoryChoice } from "@app/components/ui/CategoryChoice";
import { FieldError } from "@app/components/ui/FieldError";
import { parseCOPInput } from "@app/lib/format/currency";
import { fromDateInputValue, toDateInputValue } from "@app/lib/format/date";
import type { Id } from "@convex/_generated/dataModel";
import type { Doc } from "@convex/_generated/dataModel";
import { Button, Input } from "@jp-ds";
import { useState } from "react";

type TransferFormProps = {
	accounts: Doc<"accounts">[];
	categories: Doc<"categories">[];
	loading?: boolean;
	onSubmit: (values: {
		amount: number;
		date: number;
		accountId: Id<"accounts">;
		toAccountId: Id<"accounts">;
		categoryId: Id<"categories">;
		notes?: string;
	}) => void;
	onCancel: () => void;
};

export function TransferForm({
	accounts,
	categories,
	loading = false,
	onSubmit,
	onCancel,
}: TransferFormProps) {
	const activeAccounts = accounts.filter((a) => !a.archived);
	const [fromId, setFromId] = useState<Id<"accounts"> | "">(
		activeAccounts[0]?._id ?? "",
	);
	const [toId, setToId] = useState<Id<"accounts"> | "">(
		activeAccounts[1]?._id ?? "",
	);
	const [amount, setAmount] = useState("");
	const [date, setDate] = useState(toDateInputValue(Date.now()));
	const [categoryId, setCategoryId] = useState<Id<"categories"> | "">(
		categories[0]?._id ?? "",
	);
	const [notes, setNotes] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const parsed = parseCOPInput(amount);
		if (!parsed || parsed <= 0) {
			setError("Ingresa un monto válido");
			return;
		}
		if (!fromId || !toId) {
			setError("Selecciona cuentas origen y destino");
			return;
		}
		if (fromId === toId) {
			setError("Origen y destino deben ser diferentes");
			return;
		}
		if (!categoryId) {
			setError("Selecciona una categoría");
			return;
		}
		setError("");
		onSubmit({
			amount: parsed,
			date: fromDateInputValue(date),
			accountId: fromId,
			toAccountId: toId,
			categoryId,
			notes: notes.trim() || undefined,
		});
	};

	return (
		<form className="form-panel glass" onSubmit={handleSubmit} noValidate>
			<h2 className="form-panel__title">Transferir</h2>

			<label className="jp-input-label" htmlFor="from-account">
				Cuenta origen
			</label>
			<select
				id="from-account"
				className="jp-input"
				value={fromId}
				onChange={(e) => setFromId(e.target.value as Id<"accounts">)}
			>
				{activeAccounts.map((a) => (
					<option key={a._id} value={a._id}>
						{a.name}
					</option>
				))}
			</select>

			<label className="jp-input-label" htmlFor="to-account">
				Cuenta destino
			</label>
			<select
				id="to-account"
				className="jp-input"
				value={toId}
				onChange={(e) => setToId(e.target.value as Id<"accounts">)}
			>
				{activeAccounts.map((a) => (
					<option key={a._id} value={a._id}>
						{a.name}
					</option>
				))}
			</select>

			<Input
				label="Monto"
				inputMode="numeric"
				value={amount}
				onChange={(e) => setAmount(e.target.value)}
				required
			/>

			<Input
				label="Fecha"
				type="date"
				value={date}
				onChange={(e) => setDate(e.target.value)}
				required
			/>

			<fieldset className="category-fieldset">
				<legend className="jp-input-label">Categoría</legend>
				<CategoryChoice
					categories={categories}
					value={categoryId}
					onChange={setCategoryId}
				/>
			</fieldset>

			<Input
				label="Nota (opcional)"
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
			/>

			<FieldError message={error} />

			<div className="form-panel__actions">
				<Button type="button" variant="secondary" onClick={onCancel}>
					Cancelar
				</Button>
				<Button type="submit" disabled={loading}>
					{loading ? "Guardando…" : "Transferir"}
				</Button>
			</div>
		</form>
	);
}
