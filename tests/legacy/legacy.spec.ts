import { expect, test } from '@playwright/test';
import { PRODUCTS, USERS } from '../../src/test-data/testData';

test.describe('legacy suite', () => {
  // Fix: awaited fill() calls, removed fixed 3000ms wait, and switched to web-first assertion.
  test('login works', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('username').fill(USERS.standard.username);
    await page.getByTestId('password').fill(USERS.standard.password);
    await page.getByTestId('login-button').click();

    await expect(page.getByTestId('title')).toHaveText('Products');
  });

  // Fix: removed shared module-level cartCount, replaced brittle positional XPath with data-test,
  // and used auto-retrying web-first badge assertion.
  test('add item to cart', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('username').fill(USERS.standard.username);
    await page.getByTestId('password').fill(USERS.standard.password);
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('title')).toHaveText('Products');

    await page.getByTestId('add-to-cart-sauce-labs-backpack').click();
    await expect(page.getByTestId('shopping-cart-badge')).toHaveText('1');
  });

  // Fix: navigated to the cart page before checking .cart_item, removed shared state and nth() locators,
  // and replaced the tautological >= 0 check with an exact count assertion of 2.
  test('cart has two items', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('username').fill(USERS.performanceGlitch.username);
    await page.getByTestId('password').fill(USERS.performanceGlitch.password);
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('title')).toHaveText('Products');

    await page.getByTestId('add-to-cart-sauce-labs-backpack').click();
    await page.getByTestId('add-to-cart-sauce-labs-bike-light').click();
    await page.getByTestId('shopping-cart-link').click();

    await expect(page.getByTestId('title')).toHaveText('Your Cart');
    await expect(page.locator('.cart_item')).toHaveCount(2);
    await expect(page.getByTestId('inventory-item-name')).toHaveText([
      PRODUCTS.backpack.name,
      PRODUCTS.bikeLight.name,
    ]);
  });

  // Fix: asserted that displayed prices are actually sorted in ascending numeric order (low to high),
  // rather than only checking prices.length > 0.
  test('sort by price low to high', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('username').fill(USERS.standard.username);
    await page.getByTestId('password').fill(USERS.standard.password);
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('title')).toHaveText('Products');

    const sortDropdown = page.getByTestId('product-sort-container');
    await sortDropdown.selectOption('lohi');
    await expect(sortDropdown).toHaveValue('lohi');

    const priceTexts = await page.getByTestId('inventory-item-price').allTextContents();
    const prices = priceTexts.map((text) => Number(text.replace('$', '').trim()));

    expect(prices.length).toBeGreaterThan(0);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});
