import { expect, test } from '@playwright/test';
import { ROUTES, USERS } from '../src/test-data/testData';
import { InventoryPage } from '../src/pages/InventoryPage';
import { LoginPage } from '../src/pages/LoginPage';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await new LoginPage(page).goto();
  });

  test(
    'allows standard_user to log in successfully',
    { tag: ['@smoke', '@regression'] },
    async ({ page }) => {
      const loginPage = new LoginPage(page);
      const inventoryPage = new InventoryPage(page);

      await loginPage.login(USERS.standard.username, USERS.standard.password);

      await expect(page).toHaveURL(new RegExp(`${ROUTES.inventory}$`));
      await expect(inventoryPage.pageTitle).toHaveText('Products');
      await expect(inventoryPage.inventoryItems).toHaveCount(6);
    },
  );

  test(
    'blocks locked_out_user with an explicit error message',
    { tag: ['@smoke', '@regression'] },
    async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.login(USERS.lockedOut.username, USERS.lockedOut.password);

      await expect(page).toHaveURL(/\/$/);
      await loginPage.expectError('Epic sadface: Sorry, this user has been locked out.');
    },
  );

  test(
    'rejects invalid password credentials',
    { tag: ['@regression'] },
    async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.login(USERS.standard.username, 'wrong_password');

      await expect(page).toHaveURL(/\/$/);
      await loginPage.expectError(
        'Epic sadface: Username and password do not match any user in this service',
      );
    },
  );

  const missingCredentialCases = [
    {
      label: 'missing username',
      username: '',
      password: USERS.standard.password,
      expectedError: 'Epic sadface: Username is required',
    },
    {
      label: 'missing password',
      username: USERS.standard.username,
      password: '',
      expectedError: 'Epic sadface: Password is required',
    },
  ];

  for (const testCase of missingCredentialCases) {
    test(
      `shows validation error for ${testCase.label}`,
      { tag: ['@regression'] },
      async ({ page }) => {
        const loginPage = new LoginPage(page);

        await loginPage.login(testCase.username, testCase.password);
        await loginPage.expectError(testCase.expectedError);
      },
    );
  }
});
