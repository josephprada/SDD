/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener("push", (event) => {
	const data = event.data?.json() as
		| { title?: string; body?: string; url?: string }
		| undefined;
	event.waitUntil(
		self.registration.showNotification(data?.title ?? "JP-WALLET", {
			body: data?.body ?? "",
			icon: "/icon.svg",
			data: { url: data?.url ?? "/" },
		}),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const url = (event.notification.data?.url as string | undefined) ?? "/";
	event.waitUntil(
		self.clients.matchAll({ type: "window" }).then((clientList) => {
			for (const client of clientList) {
				if ("focus" in client) {
					return client.focus();
				}
			}
			return self.clients.openWindow(url);
		}),
	);
});
