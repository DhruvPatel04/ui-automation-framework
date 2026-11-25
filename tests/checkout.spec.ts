import { expect, test } from '@playwright/test';
import { PRODUCTS, ROUTES } from '../src/test-data/testData';
import { CartPage } from '../src/pages/CartPage';
import { CheckoutPage } from '../src/pages/CheckoutPage';
import { InventoryPage } from '../src/pages/InventoryPage';

const TAX_RATE = 0.08;

function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await new InventoryPage(page).goto();
  });

  test(
    'completes checkout and verifies item total, tax, and order total',
    { tag: ['@smoke', '@regression'] },
    async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);
      const checkoutPage = new CheckoutPage(page);
      const itemsToOrder = [PRODUCTS.backpack, PRODUCTS.bikeLight, PRODUCTS.onesie];

      for (const item of itemsToOrder) {
        await inventoryPage.addToCart(item.name);
      }
      await inventoryPage.openCart();
      await cartPage.proceedToCheckout();

      await checkoutPage.submitCustomerInfo({
        firstName: 'Alex',
        lastName: 'Morgan',
        postalCode: '94105',
      });

      await expect(page).toHaveURL(new RegExp(`${ROUTES.checkoutStepTwo}$`));
      await expect(checkoutPage.summaryItems).toHaveCount(itemsToOrder.length);

      const expectedItemTotal = roundCurrency(
        itemsToOrder.reduce((sum, item) => sum + item.price, 0),
      );
      const expectedTax = roundCurrency(expectedItemTotal * TAX_RATE);
      const expectedOrderTotal = roundCurrency(expectedItemTotal + expectedTax);

      const totals = await checkoutPage.getOrderTotals();
      expect(totals.itemTotal).toBe(expectedItemTotal);
      expect(totals.tax).toBe(expectedTax);
      expect(totals.orderTotal).toBe(expectedOrderTotal);

      await checkoutPage.finishOrder();
      await expect(page).toHaveURL(new RegExp(`${ROUTES.checkoutComplete}$`));
      await checkoutPage.expectCartCount(0);
    },
  );

  const validationCases = [
    {
      label: 'missing first name',
      info: { firstName: '', lastName: 'Morgan', postalCode: '94105' },
      expectedError: 'Error: First Name is required',
    },
    {
      label: 'missing last name',
      info: { firstName: 'Alex', lastName: '', postalCode: '94105' },
      expectedError: 'Error: Last Name is required',
    },
    {
      label: 'missing postal code',
      info: { firstName: 'Alex', lastName: 'Morgan', postalCode: '' },
      expectedError: 'Error: Postal Code is required',
    },
  ];

  for (const { label, info, expectedError } of validationCases) {
    test(
      `validates checkout form when ${label}`,
      { tag: ['@regression'] },
      async ({ page }) => {
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const checkoutPage = new CheckoutPage(page);

        await inventoryPage.addToCart(PRODUCTS.backpack.name);
        await inventoryPage.openCart();
        await cartPage.proceedToCheckout();

        await checkoutPage.submitCustomerInfo(info);

        await expect(page).toHaveURL(new RegExp(`${ROUTES.checkoutStepOne}$`));
        await checkoutPage.expectValidationError(expectedError);
      },
    );
  }
});
