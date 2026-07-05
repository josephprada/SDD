import {
	AttachmentList,
	useAttachmentCount,
} from "@app/components/attachments/AttachmentList";
import { AttachmentUploader } from "@app/components/attachments/AttachmentUploader";
import { BudgetThresholdAlert } from "@app/components/budgets/BudgetThresholdAlert";
import { CategoryChoice } from "@app/components/ui/CategoryChoice";
import { FieldError } from "@app/components/ui/FieldError";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
import type { TransactionType } from "@app/lib/core/types";
import {
	formatCOPInput,
	formatCOPInputFromRaw,
	parseCOPInput,
} from "@app/lib/format/currency";
import { fromDateInputValue, toDateInputValue } from "@app/lib/format/date";
import { periodKeyFromDate } from "@app/lib/period";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { Input } from "@jp-ds";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";

type TransactionFormProps = {
	accounts: Doc<"accounts">[];
	categories: Doc<"categories">[];
	initial?: Partial<{
		type: TransactionType;
		amount: string;
		date: string;
		accountId: Id<"accounts">;
		toAccountId: Id<"accounts">;
		categoryId: Id<"categories">;
		notes: string;
	}>;
	transactionId?: Id<"transactions">;
	loading?: boolean;
	onSubmit: (values: {
		type: TransactionType;
		amount: number;
		date: number;
		accountId: Id<"accounts">;
		toAccountId?: Id<"accounts">;
		categoryId: Id<"categories">;
		notes?: string;
	}) => void;
	onCancel: () => void;
	onDelete?: () => void;
};

const typeOptions: { value: TransactionType; label: string }[] = [
	{ value: "expense", label: "Gasto" },
	{ value: "income", label: "Ingreso" },
	{ value: "transfer", label: "Transferencia" },
];

const amountLabels: Record<TransactionType, string> = {
	expense: "Monto del gasto",
	income: "Monto del ingreso",
	transfer: "Monto a transferir",
};

export function TransactionForm({
	accounts,
	categories,
	initial,
	transactionId,
	loading = false,
	onSubmit,
	onCancel,
	onDelete,
}: TransactionFormProps) {
	const activeAccounts = accounts.filter((a) => !a.archived);
	const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
	const [amount, setAmount] = useState(() => {
		const n = initial?.amount ? parseCOPInput(initial.amount) : null;
		return n !== null ? formatCOPInput(n) : "";
	});
	const [date, setDate] = useState(
		initial?.date ?? toDateInputValue(Date.now()),
	);
	const [accountId, setAccountId] = useState<Id<"accounts"> | "">(
		initial?.accountId ?? activeAccounts[0]?._id ?? "",
	);
	const [toAccountId, setToAccountId] = useState<Id<"accounts"> | "">(
		initial?.toAccountId ?? "",
	);
	const [categoryId, setCategoryId] = useState<Id<"categories"> | "">(
		initial?.categoryId ?? "",
	);
	const [notes, setNotes] = useState(initial?.notes ?? "");
	const [error, setError] = useState("");
	const amountInputRef = useRef<HTMLInputElement>(null);
	const attachmentCount = useAttachmentCount(transactionId);

	const filteredCategories = categories.filter(
		(c) => !c.archived && c.type === type,
	);

	const draftAmount = parseCOPInput(amount) ?? 0;
	const periodKey = useMemo(
		() => periodKeyFromDate(new Date(fromDateInputValue(date))),
		[date],
	);

	const budgetPreview = useQuery(
		api.budgets.previewForTransaction,
		type === "expense" && categoryId
			? {
					categoryId,
					periodKey,
					draftAmount: draftAmount > 0 ? draftAmount : undefined,
					excludeTransactionId: transactionId,
				}
			: "skip",
	);

	useEffect(() => {
		const valid = filteredCategories.some((c) => c._id === categoryId);
		if (!valid) {
			setCategoryId(filteredCategories[0]?._id ?? "");
		}
	}, [type, filteredCategories, categoryId]);

	useEffect(() => {
		const input = amountInputRef.current;
		if (!input) return;

		const frame = requestAnimationFrame(() => {
			input.focus({ preventScroll: true });
			if (input.value) {
				input.select();
			}
		});

		return () => cancelAnimationFrame(frame);
	}, []);

	const handleAmountChange = (raw: string) => {
		setAmount(formatCOPInputFromRaw(raw));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const parsed = parseCOPInput(amount);
		if (!parsed || parsed <= 0) {
			setError("Ingresa un monto válido");
			return;
		}
		if (!accountId) {
			setError(
				type === "transfer"
					? "Selecciona la cuenta origen"
					: "Selecciona una cuenta",
			);
			return;
		}
		if (type === "transfer") {
			if (!toAccountId) {
				setError("Selecciona la cuenta destino");
				return;
			}
			if (toAccountId === accountId) {
				setError("Origen y destino deben ser diferentes");
				return;
			}
		}
		if (!categoryId) {
			setError("Selecciona una categoría");
			return;
		}
		setError("");
		onSubmit({
			type,
			amount: parsed,
			date: fromDateInputValue(date),
			accountId,
			toAccountId:
				type === "transfer" ? (toAccountId as Id<"accounts">) : undefined,
			categoryId,
			notes: notes.trim() || undefined,
		});
	};

	return (
		<form className="tx-form tx-form--modal" onSubmit={handleSubmit} noValidate>
			<div className="tx-form__scroll brand-scroll">
				<div className="tx-form__amount">
				<span className="tx-form__amount-label">{amountLabels[type]}</span>
				<div className={`tx-form__amount-input tx-form__amount-input--${type}`}>
					<span className="tx-form__currency">$</span>
					<input
						ref={amountInputRef}
						type="text"
						inputMode="numeric"
						autoComplete="off"
						placeholder="0"
						value={amount}
						onChange={(e) => handleAmountChange(e.target.value)}
						onPaste={(e) => {
							e.preventDefault();
							handleAmountChange(e.clipboardData.getData("text"));
						}}
						aria-label={amountLabels[type]}
					/>
				</div>
			</div>

			<div className="segmented" role="tablist" aria-label="Tipo de movimiento">
				{typeOptions.map((opt) => (
					<button
						key={opt.value}
						type="button"
						role="tab"
						aria-selected={type === opt.value}
						className={`segmented__item${type === opt.value ? " segmented__item--active" : ""}`}
						onClick={() => setType(opt.value)}
					>
						{opt.label}
					</button>
				))}
			</div>

			<fieldset className="category-fieldset">
				<legend className="jp-input-label">Categoría</legend>
				<CategoryChoice
					categories={filteredCategories}
					value={categoryId}
					onChange={setCategoryId}
				/>
			</fieldset>

			{budgetPreview ? (
				<BudgetThresholdAlert preview={budgetPreview} draftAmount={draftAmount} />
			) : null}

			<label className="jp-input-label" htmlFor="tx-account">
				{type === "transfer" ? "Cuenta origen" : "Cuenta"}
			</label>
			<select
				id="tx-account"
				className="jp-input"
				value={accountId}
				onChange={(e) => setAccountId(e.target.value as Id<"accounts">)}
			>
				{activeAccounts.map((a) => (
					<option key={a._id} value={a._id}>
						{a.name}
					</option>
				))}
			</select>

			{type === "transfer" ? (
				<>
					<label className="jp-input-label" htmlFor="tx-to-account">
						Cuenta destino
					</label>
					<select
						id="tx-to-account"
						className="jp-input"
						value={toAccountId}
						onChange={(e) => setToAccountId(e.target.value as Id<"accounts">)}
					>
						<option value="">Selecciona…</option>
						{activeAccounts
							.filter((a) => a._id !== accountId)
							.map((a) => (
								<option key={a._id} value={a._id}>
									{a.name}
								</option>
							))}
					</select>
				</>
			) : null}

			<Input
				label="Fecha"
				type="date"
				value={date}
				onChange={(e) => setDate(e.target.value)}
				required
			/>

			<Input
				label="Nota (opcional)"
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
			/>

			{transactionId ? (
				<div className="attachments-section">
					<span className="jp-input-label">Adjuntos</span>
					<AttachmentList transactionId={transactionId} />
					<AttachmentUploader
						transactionId={transactionId}
						currentCount={attachmentCount}
					/>
				</div>
			) : null}

				<FieldError message={error} />
			</div>

			<FormModalFooter
				onCancel={onCancel}
				onDelete={onDelete}
				loading={loading}
				submitLabel="Guardar movimiento"
			/>
		</form>
	);
}
