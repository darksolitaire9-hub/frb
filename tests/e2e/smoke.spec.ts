import { test, expect } from '@playwright/test';

test.describe('FRB Layer Studio Smoke Tests', () => {
  test('renders initial upload screen with accessible CTA and negative space hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check main headline
    const heading = page.locator('#main-heading');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Turn Flat Images Into Living Layers');

    // Check dropzone CTA
    const dropzone = page.locator('#upload-dropzone');
    await expect(dropzone).toBeVisible();
    await expect(dropzone).toHaveAttribute('role', 'button');

    // Verify feature badges exist
    await expect(page.getByText('Live Editable Text')).toBeVisible();
    await expect(page.getByText('Inpainted Clean Background')).toBeVisible();
    await expect(page.getByText('Automatic SAM 2.1 Cutouts')).toBeVisible();
    await expect(page.getByText('PSD & TIFF Export')).toBeVisible();

    // Verify viewport has no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
