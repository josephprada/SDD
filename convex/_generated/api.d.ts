/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as attachments from "../attachments.js";
import type * as auth from "../auth.js";
import type * as budgets from "../budgets.js";
import type * as categories from "../categories.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as fixedExpenses from "../fixedExpenses.js";
import type * as http from "../http.js";
import type * as lib_accounts from "../lib/accounts.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_balance from "../lib/balance.js";
import type * as lib_fixedExpensePayments from "../lib/fixedExpensePayments.js";
import type * as lib_fixedExpenses from "../lib/fixedExpenses.js";
import type * as lib_notifications from "../lib/notifications.js";
import type * as lib_period from "../lib/period.js";
import type * as lib_preferences from "../lib/preferences.js";
import type * as lib_reports from "../lib/reports.js";
import type * as lib_transactions from "../lib/transactions.js";
import type * as lib_validators from "../lib/validators.js";
import type * as migrations from "../migrations.js";
import type * as notificationActions from "../notificationActions.js";
import type * as notifications from "../notifications.js";
import type * as reports from "../reports.js";
import type * as seed from "../seed.js";
import type * as transactions from "../transactions.js";
import type * as userPreferences from "../userPreferences.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  attachments: typeof attachments;
  auth: typeof auth;
  budgets: typeof budgets;
  categories: typeof categories;
  crons: typeof crons;
  dashboard: typeof dashboard;
  fixedExpenses: typeof fixedExpenses;
  http: typeof http;
  "lib/accounts": typeof lib_accounts;
  "lib/auth": typeof lib_auth;
  "lib/balance": typeof lib_balance;
  "lib/fixedExpensePayments": typeof lib_fixedExpensePayments;
  "lib/fixedExpenses": typeof lib_fixedExpenses;
  "lib/notifications": typeof lib_notifications;
  "lib/period": typeof lib_period;
  "lib/preferences": typeof lib_preferences;
  "lib/reports": typeof lib_reports;
  "lib/transactions": typeof lib_transactions;
  "lib/validators": typeof lib_validators;
  migrations: typeof migrations;
  notificationActions: typeof notificationActions;
  notifications: typeof notifications;
  reports: typeof reports;
  seed: typeof seed;
  transactions: typeof transactions;
  userPreferences: typeof userPreferences;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
