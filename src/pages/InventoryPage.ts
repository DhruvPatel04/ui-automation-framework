import { Locator, Page, expect } from '@playwright/test';
import { ROUTES, SortOption } from '../test-data/testData';

export class InventoryPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly sortSelect: Locator;
  readonly inventoryItems: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByTestId('title');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.sortSelect = page.getByTestId('product-sort-container');
    this.inventoryItems = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
  }

  async goto(): Promise<void> {
    await this.page.goto(ROUTES.inventory);
    await expect(this.pageTitle).toHaveText('Products');
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
    await expect(this.pageTitle).toHaveText('Your Cart');
  }

  async expectCartCount(expectedCount: number): Promise<void> {
    if (expectedCount === 0) {
      await expect(this.cartBadge).toBeHidden();
      return;
    }
    await expect(this.cartBadge).toHaveText(String(expectedCount));
  }

  itemActionButton(productName: string): Locator {
    return this.itemByName(productName).locator('button');
  }

  private itemByName(productName: string): Locator {
    const exactName = new RegExp(`^${escapeRegExp(productName)}$`);
    return this.page.getByTestId('inventory-item').filter({
      has: this.page.getByTestId('inventory-item-name').filter({ hasText: exactName }),
    });
  }

  async addToCart(productName: string): Promise<void> {
    const button = this.itemActionButton(productName);
    await expect(button).toHaveText('Add to cart');
    await button.click();
    await expect(button).toHaveText('Remove');
  }

  async removeFromCart(productName: string): Promise<void> {
    const button = this.itemActionButton(productName);
    await expect(button).toHaveText('Remove');
    await button.click();
    await expect(button).toHaveText('Add to cart');
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(option);
    await expect(this.sortSelect).toHaveValue(option);
  }

  async getDisplayedNames(): Promise<string[]> {
    return (await this.itemNames.allTextContents()).map((name) => name.trim());
  }

  async getDisplayedPrices(): Promise<number[]> {
    const texts = await this.itemPrices.allTextContents();
    return texts.map((price) => Number(price.replace('$', '').trim()));
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
