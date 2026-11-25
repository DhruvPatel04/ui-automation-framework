import { Locator, Page, expect } from '@playwright/test';
import { ROUTES } from '../test-data/testData';

export class LoginPage {
    readonly page: Page;
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly errorBanner: Locator;

    constructor(page: Page) {
        this.page = page;
        this.usernameInput = page.getByTestId('username');
        this.passwordInput = page.getByTestId('password');
        this.loginButton = page.getByTestId('login-button');
        this.errorBanner = page.getByTestId('error');
    }

    async goto(): Promise<void> {
        await this.page.goto(ROUTES.login);
        await expect(this.loginButton).toBeVisible();
    }

    async login(username: string, password: string): Promise<void> {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    async expectError(message: string): Promise<void> {
        await expect(this.errorBanner).toBeVisible();
        await expect(this.errorBanner).toHaveText(message);
    }
}
