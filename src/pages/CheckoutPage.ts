import { Locator, Page, expect } from '@playwright/test';

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export interface OrderTotals {
  itemTotal: number;
  tax: number;
  orderTotal: number;
}

export class CheckoutPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly cartBadge: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorBanner: Locator;

  readonly summaryItems: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;

  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByTestId('title');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.firstNameInput = page.getByTestId('firstName');
    this.lastNameInput = page.getByTestId('lastName');
    this.postalCodeInput = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.cancelButton = page.getByTestId('cancel');
    this.errorBanner = page.getByTestId('error');

    this.summaryItems = page.getByTestId('inventory-item');
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
    this.finishButton = page.getByTestId('finish');

    this.completeHeader = page.getByTestId('complete-header');
    this.completeText = page.getByTestId('complete-text');
    this.backHomeButton = page.getByTestId('back-to-products');
  }

  async submitCustomerInfo(info: Partial<CustomerInfo>): Promise<void> {
    await this.firstNameInput.fill(info.firstName ?? '');
    await this.lastNameInput.fill(info.lastName ?? '');
    await this.postalCodeInput.fill(info.postalCode ?? '');
    await this.continueButton.click();
  }

  async expectValidationError(message: string): Promise<void> {
    await expect(this.errorBanner).toBeVisible();
    await expect(this.errorBanner).toHaveText(message);
  }

  async getOrderTotals(): Promise<OrderTotals> {
    await expect(this.pageTitle).toHaveText('Checkout: Overview');
    const [subtotalText, taxText, totalText] = await Promise.all([
      this.subtotalLabel.innerText(),
      this.taxLabel.innerText(),
      this.totalLabel.innerText(),
    ]);

    return {
      itemTotal: parseDollarAmount(subtotalText),
      tax: parseDollarAmount(taxText),
      orderTotal: parseDollarAmount(totalText),
    };
  }

  async finishOrder(): Promise<void> {
    await this.finishButton.click();
    await expect(this.pageTitle).toHaveText('Checkout: Complete!');
    await expect(this.completeHeader).toHaveText('Thank you for your order!');
  }

  async expectCartCount(expectedCount: number): Promise<void> {
    if (expectedCount === 0) {
      await expect(this.cartBadge).toBeHidden();
      return;
    }
    await expect(this.cartBadge).toHaveText(String(expectedCount));
  }
}

function parseDollarAmount(text: string): number {
  const match = text.match(/\$([0-9]+(?:\.[0-9]+)?)/);
  if (!match) {
    throw new Error(`Unable to parse dollar amount from "${text}"`);
  }
  return Number(match[1]);
}
