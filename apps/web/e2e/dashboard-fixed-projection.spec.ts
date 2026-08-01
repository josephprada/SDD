import { expect, test } from "./fixtures/auth";

/**
 * Smoke without auth: login page loads.
 * Authenticated projection/hierarchy specs skip until e2e/.auth/user.json exists.
 */
test.describe("dashboard fixed projection", () => {
	test("login screen is reachable", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("body")).toBeVisible();
	});

	test("projection hierarchy when authenticated", async ({
		page,
		requireAuth,
	}, testInfo) => {
		await requireAuth;
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		const projected = page.getByTestId("metric-projected-value").or(
			page.getByTestId("month-overview-projected-value"),
		);
		const net = page.getByTestId("metric-net-value").or(
			page.getByTestId("month-overview-net-value"),
		);

		const hasProjection = (await projected.count()) > 0;
		testInfo.skip(
			!hasProjection,
			"No pending fixed expenses in fixture data — projection block hidden",
		);

		await expect(projected.first()).toBeVisible();
		await expect(net.first()).toBeVisible();

		const projectedBox = await projected.first().boundingBox();
		const netBox = await net.first().boundingBox();
		expect(projectedBox && netBox).toBeTruthy();
		if (projectedBox && netBox) {
			// Primary projection should appear above secondary net (or larger font on desktop card).
			expect(projectedBox.y).toBeLessThanOrEqual(netBox.y + 1);
		}
	});
});
