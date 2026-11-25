import { Locator, Page, expect } from '@playwright/test';
import { ROUTES } from '../test-data/testData';

export interface CartItemSummary {
  name: string;
  price: number;
  quantity: number;
}

export class CartPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly cartBadge: Locator;
  readonly cartItems: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByTestId('title');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartItems = page.getByTestId('inventory-item');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
    this.checkoutButton = page.getByTestId('checkout');
  }

  async goto(): Promise<void> {
    await this.page.goto(ROUTES.cart);
    await expect(this.pageTitle).toHaveText('Your Cart');
  }

  async expectCartCount(expectedCount: number): Promise<void> {
    if (expectedCount === 0) {
      await expect(this.cartBadge).toBeHidden();
      return;
    }
    await expect(this.cartBadge).toHaveText(String(expectedCount));
  }

  cartItemRow(productName: string): Locator {
    return this.itemByName(productName);
  }

  private itemByName(productName: string): Locator {
    const exactName = new RegExp(`^${escapeRegExp(productName)}$`);
    return this.page.getByTestId('inventory-item').filter({
      has: this.page.getByTestId('inventory-item-name').filter({ hasText: exactName }),
    });
  }

  async removeItem(productName: string): Promise<void> {
    const row = this.cartItemRow(productName);
    await row.getByRole('button', { name: 'Remove' }).click();
    await expect(row).toHaveCount(0);
  }

  async getCartItems(): Promise<CartItemSummary[]> {
    const count = await this.cartItems.count();
    const items: CartItemSummary[] = [];
    for (let i = 0; i < count; i++) {
      const row = this.cartItems.nth(i);
      const name = (await row.getByTestId('inventory-item-name').innerText()).trim();
      const priceText = await row.getByTestId('inventory-item-price').innerText();
      const qtyText = await row.getByTestId('item-quantity').innerText();
      items.push({
        name,
        price: Number(priceText.replace('$', '').trim()),
        quantity: Number(qtyText.trim()),
      });
    }
    return items;
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
    await expect(this.pageTitle).toHaveText('Checkout: Your Information');
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
