import { create } from "zustand";

export type ToastItem = {
	id: string;
	title: string;
	body: string;
	url?: string;
};

interface ToastState {
	toasts: ToastItem[];
	show: (toast: Omit<ToastItem, "id">) => void;
	dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
	toasts: [],
	show: (toast) => {
		const id = crypto.randomUUID();
		set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
		window.setTimeout(() => {
			set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
		}, 6000);
	},
	dismiss: (id) =>
		set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
