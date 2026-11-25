# QA Automation Engineer — Take-Home Assignment

Playwright + TypeScript automation framework covering [SauceDemo](https://www.saucedemo.com) (UI) using the Page Object Model.

## Project Structure

```text
ui-automation-framework/
├── .github/
│   └── workflows/
│       └── playwright.yml        # GitHub Actions CI workflow running Playwright tests & uploading reports
├── playwright.config.ts          # Projects (setup, ui-unauthenticated, ui-authenticated) & testId config
├── package.json                  # Project metadata and Playwright/Node devDependencies
├── src/
│   ├── test-data/
│   │   └── testData.ts           # Test users, routes, product fixtures, and sort types
│   └── pages/
│       ├── LoginPage.ts          # Login form actions and error assertions
│       ├── InventoryPage.ts      # Product sorting, item-row scoping, cart badge, and add/remove actions
│       ├── CartPage.ts           # Cart item inspection, removal, cart badge, and checkout navigation
│       └── CheckoutPage.ts       # Step 1 validation, Step 2 totals parsing, and Step 3 completion
└── tests/
    ├── auth.setup.ts             # Authenticates standard_user and saves storageState
    ├── login.spec.ts             # Authentication & login validation (@smoke, @regression)
    ├── inventory.spec.ts         # Sorting accuracy & add/remove cart badge (@smoke, @regression)
    ├── cart.spec.ts              # Cart contents, item removal, and reload persistence (@smoke, @regression)
    └── checkout.spec.ts          # End-to-end totals verification & form validation (@smoke, @regression)
```

## Prerequisites & Setup

* **Node.js** v18+
* **npm**

Install dependencies and the Playwright Chromium browser:

```bash
npm install
npx playwright install chromium
```

> **Windows PowerShell note:** If PowerShell execution policy blocks `npm.ps1` / `npx.ps1`, run `npm.cmd` and `npx.cmd` instead.

## Running Tests

```bash
# Run all tests (setup + unauthenticated + authenticated UI projects)
npx playwright test

# Run tests filtered by tag (quote @tag in PowerShell)
npx playwright test --grep "@smoke"
npx playwright test --grep "@regression"

# Open the HTML test report
npx playwright show-report
```

## Design Decisions

* **Page Object Model (POM) created on demand:** Each page (`LoginPage`, `InventoryPage`, `CartPage`, `CheckoutPage`) encapsulates its own locators, actions, and assertions directly. Tests instantiate only the page objects they require rather than injecting every page via custom fixtures.
* **Resilient selectors (`data-test`):** `playwright.config.ts` sets `testIdAttribute: 'data-test'`, allowing `page.getByTestId(...)` across SauceDemo components. Product cards and cart rows are scoped by exact product name (`itemByName`) rather than positional XPaths.
* **Web-first assertions & React Router sync:** Assertions use Playwright's auto-retrying `expect(locator)` APIs (`toHaveText`, `toBeVisible`, `toBeHidden`, `toHaveCount`). Page transitions assert target heading visibility rather than relying solely on `waitForURL`.
* **Authentication via `storageState`:** The `setup` project logs in once as `standard_user` and writes `playwright/.auth/standard-user.json` (gitignored). The `ui-authenticated` project reuses that session for inventory, cart, and checkout tests, while `ui-unauthenticated` runs `login.spec.ts` without pre-loaded state so login flows are tested end-to-end.
* **Test independence:** Every test starts in a fresh browser context with an isolated `localStorage` cart and manipulates only its own items.
* **Native Playwright tagging:** Tests are tagged with `@smoke` and `@regression` via Playwright's `tag` option so subsets can be run directly from the CLI.
* **CI/CD integration:** `.github/workflows/playwright.yml` runs `npx playwright test` on pushes and pull requests to `main`/`master` and uploads `playwright-report/` as a workflow artifact.

## AI Assistance

* AI assistance (Antigravity / Gemini) was used to scaffold the TypeScript/Playwright configuration, Page Object classes, UI test suites, and this README.
