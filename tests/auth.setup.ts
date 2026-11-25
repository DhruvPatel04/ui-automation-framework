import { expect, test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { AUTH_STORAGE_PATH } from '../playwright.config';
import { ROUTES, USERS } from '../src/test-data/testData';
import { InventoryPage } from '../src/pages/InventoryPage';
import { LoginPage } from '../src/pages/LoginPage';

setup('authenticate as standard_user', async ({ page }) => {
    fs.mkdirSync(path.dirname(AUTH_STORAGE_PATH), { recursive: true });

    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login(USERS.standard.username, USERS.standard.password);

    await expect(page).toHaveURL(new RegExp(`${ROUTES.inventory}$`));
    await expect(inventoryPage.pageTitle).toHaveText('Products');

    await page.context().storageState({ path: AUTH_STORAGE_PATH });
});
