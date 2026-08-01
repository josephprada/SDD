import { AUTH_STORAGE_STATE, expect, hasAuthFixture, test } from "./fixtures/auth";

test.describe("create transaction attachments", () => {
	test.skip(!hasAuthFixture, `Missing ${AUTH_STORAGE_STATE}`);

	test("attach control is visible on create modal", async ({ page }) => {
		await page.goto("/?mode=create&type=expense");
		await page.waitForLoadState("networkidle");
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByTestId("attachments-section")).toBeVisible();
		await expect(page.getByTestId("attach-file-button")).toBeVisible();
	});
});
