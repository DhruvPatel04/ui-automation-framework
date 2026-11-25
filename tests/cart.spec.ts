import { expect, test } from '@playwright/test';
import { PRODUCTS } from '../src/test-data/testData';
import { CartPage } from '../src/pages/CartPage';
import { InventoryPage } from '../src/pages/InventoryPage';

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    await new InventoryPage(page).goto();
  });

  test(
    'displays expected item count and product details in cart',
    { tag: ['@smoke', '@regression'] },
    async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);
      const selectedProducts = [PRODUCTS.backpack, PRODUCTS.onesie];

      for (const product of selectedProducts) {
        await inventoryPage.addToCart(product.name);
      }

      await inventoryPage.expectCartCount(selectedProducts.length);
      await inventoryPage.openCart();

      await cartPage.expectCartCount(selectedProducts.length);
      await expect(cartPage.cartItems).toHaveCount(selectedProducts.length);

      const actualItems = await cartPage.getCartItems();
      expect(actualItems).toEqual(
        selectedProducts.map((product) => ({
          name: product.name,
          price: product.price,
          quantity: 1,
        })),
      );
    },
  );

  test(
    'removes products directly from the cart page',
    { tag: ['@regression'] },
    async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);

      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await inventoryPage.addToCart(PRODUCTS.fleeceJacket.name);
      await inventoryPage.openCart();

      await cartPage.removeItem(PRODUCTS.backpack.name);
      await cartPage.expectCartCount(1);
      expect(await cartPage.getCartItems()).toEqual([
        {
          name: PRODUCTS.fleeceJacket.name,
          price: PRODUCTS.fleeceJacket.price,
          quantity: 1,
        },
      ]);

      await cartPage.removeItem(PRODUCTS.fleeceJacket.name);
      await cartPage.expectCartCount(0);
      await expect(cartPage.cartItems).toHaveCount(0);
    },
  );

  test(
    'retains cart items and badge count after page reloads',
    { tag: ['@regression'] },
    async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);

      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await inventoryPage.addToCart(PRODUCTS.boltTShirt.name);
      await inventoryPage.expectCartCount(2);

      // Reload inventory page and confirm cart state persists
      await page.reload();
      await expect(inventoryPage.pageTitle).toHaveText('Products');
      await inventoryPage.expectCartCount(2);
      await expect(inventoryPage.itemActionButton(PRODUCTS.backpack.name)).toHaveText('Remove');
      await expect(inventoryPage.itemActionButton(PRODUCTS.boltTShirt.name)).toHaveText('Remove');

      // Navigate to cart, reload again, and confirm items remain
      await inventoryPage.openCart();
      await page.reload();
      await expect(cartPage.pageTitle).toHaveText('Your Cart');
      await cartPage.expectCartCount(2);
      expect(await cartPage.getCartItems()).toEqual([
        { name: PRODUCTS.backpack.name, price: PRODUCTS.backpack.price, quantity: 1 },
        { name: PRODUCTS.boltTShirt.name, price: PRODUCTS.boltTShirt.price, quantity: 1 },
      ]);
    },
  );
});
