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
import type * as categories from "../categories.js";
import type * as dashboard from "../dashboard.js";
import type * as http from "../http.js";
import type * as lib_accounts from "../lib/accounts.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_balance from "../lib/balance.js";
import type * as lib_preferences from "../lib/preferences.js";
import type * as lib_transactions from "../lib/transactions.js";
import type * as lib_validators from "../lib/validators.js";
import type * as migrations from "../migrations.js";
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
  categories: typeof categories;
  dashboard: typeof dashboard;
  http: typeof http;
  "lib/accounts": typeof lib_accounts;
  "lib/auth": typeof lib_auth;
  "lib/balance": typeof lib_balance;
  "lib/preferences": typeof lib_preferences;
  "lib/transactions": typeof lib_transactions;
  "lib/validators": typeof lib_validators;
  migrations: typeof migrations;
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
