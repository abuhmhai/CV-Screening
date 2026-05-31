import { test, expect } from "@playwright/test";

function headerNav(page: import("@playwright/test").Page) {
  return page.locator("header nav");
}

test.describe("Public pages", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Tuyển dụng thông minh/i })).toBeVisible();
    await expect(headerNav(page).getByRole("link", { name: "Việc làm", exact: true })).toBeVisible();
    await expect(headerNav(page).getByRole("link", { name: "Search", exact: true })).toBeVisible();
  });

  test("jobs page lists openings", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: "Việc làm đang tuyển" })).toBeVisible({
      timeout: 15_000
    });
  });

  test("sign-in page shows demo accounts", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Linh Nguyen/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Thu Do/ })).toBeVisible();
  });
});

test.describe("Candidate journey", () => {
  test("demo login → jobs → applications nav", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.getByRole("button", { name: /Linh Nguyen/ }).click();
    await expect(page).toHaveURL("/", { timeout: 15_000 });
    await expect(headerNav(page).getByRole("link", { name: "Ứng tuyển", exact: true })).toBeVisible();

    await headerNav(page).getByRole("link", { name: "Việc làm", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Việc làm đang tuyển" })).toBeVisible();

    await headerNav(page).getByRole("link", { name: "Ứng tuyển", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Đơn ứng tuyển của tôi" })).toBeVisible({
      timeout: 15_000
    });
  });
});

test.describe("Recruiter journey", () => {
  test("demo login → recruiter dashboard", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.getByRole("button", { name: /Thu Do/ }).click();
    await expect(page).toHaveURL("/", { timeout: 15_000 });
    await expect(headerNav(page).getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();

    await headerNav(page).getByRole("link", { name: "Dashboard", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Recruiter Dashboard" })).toBeVisible({
      timeout: 15_000
    });
  });
});
