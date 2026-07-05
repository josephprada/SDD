import { api } from "@convex/_generated/api";
import type { ConvexReactClient } from "convex/react";

const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
	const raw = atob(base64);
	const arr = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
	return arr;
}

export async function registerPushSubscription(
	convex: ConvexReactClient,
): Promise<boolean> {
	if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
		return false;
	}
	if (!VAPID_KEY) {
		console.warn("VITE_VAPID_PUBLIC_KEY not set");
		return false;
	}

	const permission = await Notification.requestPermission();
	if (permission !== "granted") return false;

	const reg = await navigator.serviceWorker.ready;
	const existing = await reg.pushManager.getSubscription();
	const sub =
		existing ??
		(await reg.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(VAPID_KEY) as BufferSource,
		}));

	const json = sub.toJSON();
	if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

	await convex.mutation(api.notifications.subscribePush, {
		endpoint: json.endpoint,
		p256dh: json.keys.p256dh,
		auth: json.keys.auth,
		userAgent: navigator.userAgent,
	});

	return true;
}

export async function unregisterPushSubscription(
	convex: ConvexReactClient,
): Promise<void> {
	if (!("serviceWorker" in navigator)) return;
	const reg = await navigator.serviceWorker.ready;
	const sub = await reg.pushManager.getSubscription();
	if (sub) {
		await convex.mutation(api.notifications.unsubscribePush, {
			endpoint: sub.endpoint,
		});
		await sub.unsubscribe();
	}
}

export function isPushSupported(): boolean {
	return (
		typeof window !== "undefined" &&
		"serviceWorker" in navigator &&
		"PushManager" in window &&
		!!VAPID_KEY
	);
}
