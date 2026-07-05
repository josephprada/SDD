# API Contract: Notifications (Convex)

**Change**: web-budgets-reports  
**Modules**: `convex/notifications/*`, `convex/userPreferences.ts` (ext)

---

## Mutations (client)

### `notifications.subscribePush`

**Args**

```ts
{
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}
```

**Effect**: Upsert `pushSubscriptions` by endpoint; set `userPreferences.pushEnabled = true`.

---

### `notifications.unsubscribePush`

**Args**: `{ endpoint }`

---

### `userPreferences.update` (ext)

**New optional args**:

```ts
{
  reportEmailEnabled?: boolean;
  pushEnabled?: boolean;
  // existing fields unchanged
}
```

---

## Internal actions

### `notifications.sendEmail`

**Args**: `{ to, subject, html, pdfAttachment?: { filename, base64 } }`  
**Effect**: Resend API; log on success.

### `notifications.sendPush`

**Args**: `{ userId, title, body, url }`  
**Effect**: Fan-out active subscriptions; prune 410 gone endpoints.

### `notifications.dispatch`

**Args**

```ts
{
  userId: string;
  type: "fixed_expense_reminder" | "budget_threshold" | "period_report";
  referenceId: string;
  channels: Array<"email" | "push" | "in_app">;
  payload: { title, body, url?, emailHtml?, pdf? };
}
```

**Effect**: Check `notificationsEnabled`, per-channel prefs, `dedupeKey`; skip if exists.

---

## Cron

### `notifications.processDaily`

**Schedule**: daily ~8:00 COT  
**Calls**: `fixedExpenses.processReminders`, `reports.processPeriodClosures`

---

## Client: Service Worker

**File**: `apps/web/public/sw.js`

Events: `push`, `notificationclick`  
Payload JSON: `{ title, body, url }`

---

## Client: Push registration

**File**: `apps/web/src/lib/push/registerPush.ts`

Uses `VITE_VAPID_PUBLIC_KEY` from env.
