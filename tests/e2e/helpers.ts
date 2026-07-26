import { Page } from '@playwright/test';

// Seeded dev credentials. Override via env vars for CI/other environments.
export const CREDS = {
  admin: { email: process.env.TEST_ADMIN_EMAIL || 'admin@gmail.com', password: process.env.TEST_ADMIN_PASSWORD || 'admin123' },
  architect: { email: process.env.TEST_ARCHITECT_EMAIL || 'design@gmail.com', password: process.env.TEST_ARCHITECT_PASSWORD || 'design123' },
  designer: { email: process.env.TEST_DESIGNER_EMAIL || 'designer@gmail.com', password: process.env.TEST_DESIGNER_PASSWORD || 'design123' },
};

export async function login(page: Page, role: keyof typeof CREDS) {
  const { email, password } = CREDS[role];
  await page.goto('/login');
  await page.getByPlaceholder('user@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await Promise.all([
    page.waitForURL(new RegExp(`/${role}/dashboard`), { timeout: 15000 }),
    page.getByRole('button', { name: 'Sign In' }).click(),
  ]);
}
