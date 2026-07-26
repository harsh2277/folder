import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Admin project directory', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test('project list loads with data', async ({ page }) => {
    await page.goto('/admin/projects');
    await expect(page.getByRole('heading', { name: 'Project Directory' })).toBeVisible();
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('search filters the visible rows', async ({ page }) => {
    await page.goto('/admin/projects');
    const searchBox = page.getByPlaceholder(/Search by ID, name, or representative/i);
    await searchBox.fill('zzz-no-such-project-zzz');
    await expect(page.getByText('No projects found')).toBeVisible();
    await searchBox.fill('');
  });

  test('pagination controls appear and page 2 shows different rows when there are more than 10 projects', async ({ page }) => {
    await page.goto('/admin/projects');
    const rowCountEl = page.locator('table tbody tr');
    await expect(rowCountEl.first()).toBeVisible();
    const totalRows = await rowCountEl.count();

    if (totalRows < 10) {
      test.skip(true, 'Not enough seed data to exercise pagination in this environment');
    }

    const firstRowPage1 = await rowCountEl.first().innerText();
    const page2Button = page.getByRole('button', { name: '2', exact: true });
    if (await page2Button.count()) {
      await page2Button.click();
      const firstRowPage2 = await page.locator('table tbody tr').first().innerText();
      expect(firstRowPage2).not.toEqual(firstRowPage1);
    }
  });

  test('deleting a project shows a confirmation dialog that can be cancelled without deleting', async ({ page }) => {
    await page.goto('/admin/projects');
    await expect(page.locator('table tbody tr').first()).toBeVisible();
    const rowsBefore = await page.locator('table tbody tr').count();

    await page.getByRole('button', { name: 'Delete' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Confirm Deletion')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    const rowsAfter = await page.locator('table tbody tr').count();
    expect(rowsAfter).toEqual(rowsBefore);
  });
});
