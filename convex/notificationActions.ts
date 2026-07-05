"use node";

import { v } from "convex/values";
import { PDFDocument, StandardFonts } from "pdf-lib";
import webpush from "web-push";
import { internalAction } from "./_generated/server";

export const sendEmailWithReport = internalAction({
	args: {
		to: v.string(),
		subject: v.string(),
		html: v.string(),
		label: v.string(),
		summary: v.object({
			totalIncome: v.number(),
			totalExpense: v.number(),
			net: v.number(),
			byCategory: v.array(
				v.object({
					name: v.string(),
					amount: v.number(),
				}),
			),
		}),
	},
	handler: async (_ctx, args) => {
		const pdf = await PDFDocument.create();
		const page = pdf.addPage([595, 842]);
		const font = await pdf.embedFont(StandardFonts.Helvetica);
		const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
		let y = 800;
		page.drawText(`JP-WALLET — ${args.label}`, { x: 50, y, size: 16, font: bold });
		y -= 30;
		page.drawText(`Ingresos: $${args.summary.totalIncome.toLocaleString("es-CO")}`, {
			x: 50,
			y,
			size: 12,
			font,
		});
		y -= 18;
		page.drawText(`Gastos: $${args.summary.totalExpense.toLocaleString("es-CO")}`, {
			x: 50,
			y,
			size: 12,
			font,
		});
		y -= 18;
		page.drawText(`Neto: $${args.summary.net.toLocaleString("es-CO")}`, {
			x: 50,
			y,
			size: 12,
			font: bold,
		});
		y -= 30;
		for (const cat of args.summary.byCategory.slice(0, 20)) {
			page.drawText(`${cat.name}: $${cat.amount.toLocaleString("es-CO")}`, {
				x: 50,
				y,
				size: 11,
				font,
			});
			y -= 16;
			if (y < 60) break;
		}
		const bytes = await pdf.save();
		const pdfBase64 = Buffer.from(bytes).toString("base64");

		const apiKey = process.env.RESEND_API_KEY;
		const from = process.env.EMAIL_FROM ?? "JP-WALLET <onboarding@resend.dev>";
		if (!apiKey) {
			console.warn("RESEND_API_KEY not set; skipping email");
			return { skipped: true };
		}

		const res = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from,
				to: [args.to],
				subject: args.subject,
				html: args.html,
				attachments: [
					{
						filename: "reporte-jp-wallet.pdf",
						content: pdfBase64,
					},
				],
			}),
		});

		if (!res.ok) {
			throw new Error(`Resend error: ${await res.text()}`);
		}
		return { ok: true };
	},
});

export const sendEmail = internalAction({
	args: {
		to: v.string(),
		subject: v.string(),
		html: v.string(),
		pdfBase64: v.optional(v.string()),
		pdfFilename: v.optional(v.string()),
	},
	handler: async (_ctx, args) => {
		const apiKey = process.env.RESEND_API_KEY;
		const from = process.env.EMAIL_FROM ?? "JP-WALLET <onboarding@resend.dev>";
		if (!apiKey) {
			console.warn("RESEND_API_KEY not set; skipping email");
			return { skipped: true };
		}

		const attachments = args.pdfBase64
			? [
					{
						filename: args.pdfFilename ?? "reporte.pdf",
						content: args.pdfBase64,
					},
				]
			: undefined;

		const res = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from,
				to: [args.to],
				subject: args.subject,
				html: args.html,
				attachments,
			}),
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Resend error: ${text}`);
		}

		return { ok: true };
	},
});

export const sendPush = internalAction({
	args: {
		subscriptions: v.array(
			v.object({
				endpoint: v.string(),
				p256dh: v.string(),
				auth: v.string(),
			}),
		),
		title: v.string(),
		body: v.string(),
		url: v.string(),
	},
	handler: async (_ctx, args) => {
		const publicKey = process.env.VAPID_PUBLIC_KEY;
		const privateKey = process.env.VAPID_PRIVATE_KEY;
		const subject = process.env.VAPID_SUBJECT ?? "mailto:support@wallet.lavalex.co";

		if (!publicKey || !privateKey) {
			console.warn("VAPID keys not set; skipping push");
			return { skipped: true, gone: [] as string[] };
		}

		webpush.setVapidDetails(subject, publicKey, privateKey);

		const payload = JSON.stringify({
			title: args.title,
			body: args.body,
			url: args.url,
		});

		const gone: string[] = [];

		for (const sub of args.subscriptions) {
			try {
				await webpush.sendNotification(
					{
						endpoint: sub.endpoint,
						keys: { p256dh: sub.p256dh, auth: sub.auth },
					},
					payload,
				);
			} catch (err: unknown) {
				const status = (err as { statusCode?: number }).statusCode;
				if (status === 404 || status === 410) {
					gone.push(sub.endpoint);
				}
			}
		}

		return { ok: true, gone };
	},
});
