import { expect, test } from '@playwright/test';
import { PRODUCTS, SortOption } from '../src/test-data/testData';
import { InventoryPage } from '../src/pages/InventoryPage';

test.describe('Inventory & Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await new InventoryPage(page).goto();
  });

  const nameSortCases: Array<{ option: SortOption; label: string; descending: boolean }> = [
    { option: 'az', label: 'Name (A to Z)', descending: false },
    { option: 'za', label: 'Name (Z to A)', descending: true },
  ];

  for (const { option, label, descending } of nameSortCases) {
    test(
      `sorts products accurately by ${label}`,
      { tag: ['@regression'] },
      async ({ page }) => {
        const inventoryPage = new InventoryPage(page);

        await inventoryPage.sortBy(option);
        const displayedNames = await inventoryPage.getDisplayedNames();
        const expectedNames = [...displayedNames].sort((a, b) =>
          descending ? b.localeCompare(a) : a.localeCompare(b),
        );

        expect(displayedNames.length).toBe(6);
        expect(displayedNames).toEqual(expectedNames);
      },
    );
  }

  test(
    'sorts products accurately by Price (low to high)',
    { tag: ['@smoke', '@regression'] },
    async ({ page }) => {
      const inventoryPage = new InventoryPage(page);

      await inventoryPage.sortBy('lohi');
      const displayedPrices = await inventoryPage.getDisplayedPrices();
      const expectedPrices = [...displayedPrices].sort((a, b) => a - b);

      expect(displayedPrices.length).toBe(6);
      expect(displayedPrices).toEqual(expectedPrices);
    },
  );

  test(
    'sorts products accurately by Price (high to low)',
    { tag: ['@regression'] },
    async ({ page }) => {
      const inventoryPage = new InventoryPage(page);

      await inventoryPage.sortBy('hilo');
      const displayedPrices = await inventoryPage.getDisplayedPrices();
      const expectedPrices = [...displayedPrices].sort((a, b) => b - a);

      expect(displayedPrices.length).toBe(6);
      expect(displayedPrices).toEqual(expectedPrices);
    },
  );

  test(
    'adds and removes products from the inventory page and updates cart badge',
    { tag: ['@smoke', '@regression'] },
    async ({ page }) => {
      const inventoryPage = new InventoryPage(page);

      await inventoryPage.expectCartCount(0);

      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await inventoryPage.expectCartCount(1);

      await inventoryPage.addToCart(PRODUCTS.bikeLight.name);
      await inventoryPage.expectCartCount(2);

      await inventoryPage.removeFromCart(PRODUCTS.backpack.name);
      await inventoryPage.expectCartCount(1);

      await inventoryPage.removeFromCart(PRODUCTS.bikeLight.name);
      await inventoryPage.expectCartCount(0);
    },
  );
});
