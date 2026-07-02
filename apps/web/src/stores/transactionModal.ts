import type { TransactionType } from "@app/lib/core/types";
import type { Id } from "@convex/_generated/dataModel";
import { create } from "zustand";

export type TransactionModalMode = "closed" | "create" | "edit" | "transfer";

type TransactionModalState = {
	mode: TransactionModalMode;
	createType: TransactionType;
	editingId: Id<"transactions"> | null;
	openCreate: (type?: TransactionType) => void;
	openTransfer: () => void;
	openEdit: (id: Id<"transactions">) => void;
	close: () => void;
};

export const useTransactionModalStore = create<TransactionModalState>((set) => ({
	mode: "closed",
	createType: "expense",
	editingId: null,

	openCreate: (type = "expense") => {
		set({ mode: "create", createType: type, editingId: null });
	},

	openTransfer: () => {
		set({ mode: "transfer", createType: "transfer", editingId: null });
	},

	openEdit: (id) => {
		set({ mode: "edit", editingId: id, createType: "expense" });
	},

	close: () => {
		set({ mode: "closed", editingId: null, createType: "expense" });
	},
}));
