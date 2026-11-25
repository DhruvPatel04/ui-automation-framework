import { expect, test } from '@playwright/test';
import { CartPage } from '../../src/pages/CartPage';
import { CheckoutPage } from '../../src/pages/CheckoutPage';
import { InventoryPage } from '../../src/pages/InventoryPage';
import { LoginPage } from '../../src/pages/LoginPage';
import { PRODUCTS, ROUTES, USERS } from '../../src/test-data/testData';

test.describe('Exploratory Defect Automation', () => {
  test(
    'problem_user checkout form retains Last Name and proceeds to overview',
    { tag: ['@regression'] },
    async ({ page }) => {
      test.fail(
        true,
        'Known defect for problem_user: typing Last Name overwrites First Name and blocks checkout',
      );

      const loginPage = new LoginPage(page);
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await loginPage.goto();
      await loginPage.login(USERS.problem.username, USERS.problem.password);
      await expect(inventoryPage.pageTitle).toHaveText('Products');

      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await inventoryPage.openCart();
      await cartPage.proceedToCheckout();

      await checkoutPage.submitCustomerInfo({
        firstName: 'John',
        lastName: 'Doe',
        postalCode: '12345',
      });

      await expect(checkoutPage.firstNameInput).toHaveValue('John');
      await expect(checkoutPage.lastNameInput).toHaveValue('Doe');
      await expect(page).toHaveURL(new RegExp(`${ROUTES.checkoutStepTwo}$`));
      await expect(checkoutPage.pageTitle).toHaveText('Checkout: Overview');
    },
  );
});
