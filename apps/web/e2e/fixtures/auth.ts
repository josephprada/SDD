import { test as base, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const authFile = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	".auth",
	"user.json",
);

export const AUTH_STORAGE_STATE = authFile;
export const hasAuthFixture = fs.existsSync(authFile);

type AuthFixtures = {
	requireAuth: void;
};

export const test = base.extend<AuthFixtures>({
	storageState: async ({}, use) => {
		await use(hasAuthFixture ? authFile : undefined);
	},
	requireAuth: [
		async ({}, use, testInfo) => {
			if (!hasAuthFixture) {
				testInfo.skip(
					true,
					`Missing ${authFile}. See apps/web/e2e/README.md`,
				);
			}
			await use();
		},
		{ auto: false },
	],
});

export { expect };
