import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { login } from './helpers';

const PAGES = [
  { path: '/admin/dashboard', name: 'Admin Dashboard' },
  { path: '/admin/projects', name: 'Admin Projects List' },
  { path: '/admin/users', name: 'Admin Users List' },
  { path: '/admin/payments', name: 'Admin Payments List' },
  { path: '/admin/pricing', name: 'Admin Pricing Plans' },
  { path: '/admin/revision-requests', name: 'Admin Revision Requests' },
  { path: '/admin/notifications', name: 'Admin Notifications' },
];

test.describe('Accessibility (axe-core)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  for (const { path, name } of PAGES) {
    test(`${name} has no serious or critical accessibility violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

      if (serious.length > 0) {
        console.log(`\n[${name}] violations:`, JSON.stringify(serious.map(v => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.length,
        })), null, 2));
      }

      expect(serious, `${name} has serious/critical a11y violations`).toEqual([]);
    });
  }
});
