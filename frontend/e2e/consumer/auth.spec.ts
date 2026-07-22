import { test, expect } from '@playwright/test';

test.describe('Consumer Auth', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/savant/auth');

    // Wait for the login form (assuming standard inputs)
    // The actual form might use specific names or placeholders, but 'Email' and 'Password' are standard
    await page.locator('input[type="email"]').fill('customer@stylesavant.com');
    await page.locator('input[type="password"]').fill('customer123');

    // Click the login button
    await page.getByRole('button', { name: /log in|login/i }).last().click();

    // After login, it should redirect to feed or explore (or at least leave the auth page)
    await expect(page).not.toHaveURL(/.*\/auth/);

    // Optionally check if a profile link or something similar is visible,
    // but URL change is a good start.
  });
});
