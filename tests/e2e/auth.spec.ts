import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Authentication and role routing', () => {
  test('admin login redirects to admin dashboard', async ({ page }) => {
    await login(page, 'admin');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('architect login redirects to architect dashboard', async ({ page }) => {
    await login(page, 'architect');
    await expect(page).toHaveURL(/\/architect\/dashboard/);
  });

  test('designer login redirects to designer dashboard', async ({ page }) => {
    await login(page, 'designer');
    await expect(page).toHaveURL(/\/designer\/dashboard/);
  });

  test('invalid credentials show an error and do not navigate away', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('user@example.com').fill('admin@gmail.com');
    await page.getByPlaceholder('••••••••').fill('definitely-wrong-password');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/login|\/$/);
    await expect(page.getByText(/invalid|wrong|error|credentials/i)).toBeVisible({ timeout: 5000 });
  });

  test('unauthenticated visitor is redirected away from a protected admin route', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('architect cannot access the admin dashboard by direct URL', async ({ page }) => {
    await login(page, 'architect');
    await page.goto('/admin/dashboard');
    await expect(page).not.toHaveURL(/\/admin\/dashboard/);
    await expect(page).toHaveURL(/\/architect\/dashboard/);
  });
});
