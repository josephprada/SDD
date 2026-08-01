import { AUTH_STORAGE_STATE, expect, hasAuthFixture, test } from "./fixtures/auth";

test.describe("edit transaction autofocus", () => {
	test.skip(!hasAuthFixture, `Missing ${AUTH_STORAGE_STATE}`);

	test("amount input is not focused on edit open", async ({ page }, testInfo) => {
		await page.goto("/transactions");
		await page.waitForLoadState("networkidle");

		const row = page
			.locator("[data-testid='transaction-row'], .tx-row, li")
			.first();
		testInfo.skip((await row.count()) === 0, "No transactions in fixture");

		await row.click();
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		const amount = dialog.locator('input[aria-label*="Monto"]').first();
		testInfo.skip((await amount.count()) === 0, "Amount input not found");

		await expect(amount).not.toBeFocused();
	});
});
