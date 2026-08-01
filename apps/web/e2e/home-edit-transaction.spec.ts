import { AUTH_STORAGE_STATE, expect, hasAuthFixture, test } from "./fixtures/auth";

test.describe("home edit transaction", () => {
	test.skip(!hasAuthFixture, `Missing ${AUTH_STORAGE_STATE}`);

	test("opens edit modal from home without navigating to /transactions", async ({
		page,
	}, testInfo) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		const recent = page
			.locator(".recent-tx, [data-testid='recent-transaction']")
			.first();
		const fallbackRow = page
			.locator("a, button, li")
			.filter({ hasText: /\$|COP|−|\+/ })
			.first();
		const target = (await recent.count()) > 0 ? recent : fallbackRow;

		testInfo.skip(
			(await target.count()) === 0,
			"No recent transactions in fixture",
		);

		await target.click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page).not.toHaveURL(/\/transactions/);
	});
});
