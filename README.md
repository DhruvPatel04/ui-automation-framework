# QA Automation Engineer — Take-Home Assignment

Playwright + TypeScript automation framework covering [SauceDemo](https://www.saucedemo.com) (UI) using the Page Object Model and [Restful-Booker](https://restful-booker.herokuapp.com) (API) using a reusable API client and cleanup fixtures.

## Project Structure

```text
ui-automation-framework/
├── .github/
│   └── workflows/
│       └── playwright.yml        # GitHub Actions CI workflow running Playwright tests & uploading reports
├── playwright.config.ts          # Projects (setup, ui-unauthenticated, ui-authenticated, legacy, exploratory, api)
├── package.json                  # Project metadata and Playwright/Node devDependencies
├── docs/
│   ├── bug-reports.md            # Task 4 exploratory testing bug reports & severity analysis
│   └── evidence/                 # Screenshots supporting exploratory findings
├── src/
│   ├── api/
│   │   └── BookingClient.ts      # Reusable Restful-Booker APIRequestContext client
│   ├── fixtures/
│   │   └── apiFixtures.ts        # API client fixture & automatic created-booking cleanup
│   ├── test-data/
│   │   ├── testData.ts           # UI test users, routes, product fixtures, and sort types
│   │   └── bookingData.ts        # API payload types, auth defaults, and isolated data factory
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
    ├── checkout.spec.ts          # End-to-end totals verification & form validation (@smoke, @regression)
    ├── api/
    │   └── booking.spec.ts       # Restful-Booker CRUD & negative API tests (@smoke, @regression)
    ├── exploratory/
    │   └── defects.spec.ts       # Automated regression test for confirmed defect (test.fail())
    └── legacy/
        └── legacy.spec.ts        # Fixed versions of the 4 unreliable legacy tests
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
# Run all tests (UI + legacy + API projects)
npx playwright test

# Run only the API test suite
npx playwright test --project=api

# Run the exploratory defect test (expected failure via test.fail())
npx playwright test --project=exploratory

# Run the corrected legacy suite repeatedly across 4 workers
npx playwright test tests/legacy --repeat-each=10 --workers=4

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
* **Thin API client & teardown cleanup:** `BookingClient` wraps `APIRequestContext` and returns raw `APIResponse` objects so both positive and negative tests can assert status codes and bodies uniformly. `apiFixtures.ts` provides `trackBooking(id)` to automatically delete test-created bookings during teardown, and `buildBookingPayload()` generates unique names per test to keep parallel runs isolated.
* **CI/CD integration:** `.github/workflows/playwright.yml` runs `npx playwright test` on pushes and pull requests to `main`/`master` and uploads `playwright-report/` as a workflow artifact.

## API Observations (Task 2 Bonus)

During testing against `https://restful-booker.herokuapp.com`, the following non-standard behaviors were observed:

1. **`DELETE /booking/:id` returns `201 Created`:**
   * **Evidence:** Authenticated `DELETE /booking/<id>` returned HTTP `201` with body `Created` instead of `200 OK` or `204 No Content`.
   * **Assessment:** Intentional API behavior (documented in the Restful-Booker API docs), not a bug—though non-standard for REST `DELETE`.
2. **`POST /auth` with invalid credentials returns `200 OK`:**
   * **Evidence:** `POST /auth` with `{"username":"admin","password":"wrong"}` returned HTTP `200` with JSON `{"reason":"Bad credentials"}` and no `token` field rather than `401 Unauthorized`.
   * **Assessment:** Documented quirk of the demo API; clients must check for the presence of `token` in addition to the HTTP status.
3. **`POST /booking` with missing required fields returns `500 Internal Server Error`:**
   * **Evidence:** `POST /booking` with `{"firstname":"OnlyFirstName"}` returned HTTP `500` with body `Internal Server Error` instead of `400 Bad Request`.
   * **Assessment:** Indicates missing server-side request validation before processing `bookingdates`/required fields.

## Task 3: Debugging Unreliable Legacy Tests

The four legacy tests from the appendix were placed in `tests/legacy/legacy.spec.ts` and fixed:

1. **`login works`**
   * **What was wrong:** `page.fill` calls for username and password were not `await`ed, causing a race condition with clicking `#login-button`, while `waitForTimeout(3000)` introduced an arbitrary fixed wait and `isVisible()` checked visibility only once without retrying.
   * **What changed:** Added `await` to both `fill()` calls, removed `waitForTimeout(3000)`, switched to `data-test` locators, and used the auto-retrying web-first assertion `await expect(page.getByTestId('title')).toHaveText('Products')`.
2. **`add item to cart`**
   * **What was wrong:** The test mutated a shared module-level `cartCount` variable across tests, relied on a brittle positional XPath (`//div[@class='inventory_list']/div[1]/div[3]/button`), and used a non-retrying `textContent()` check.
   * **What changed:** Removed the shared `cartCount` state, targeted the specific product button with `getByTestId('add-to-cart-sauce-labs-backpack')`, and asserted `await expect(page.getByTestId('shopping-cart-badge')).toHaveText('1')`.
3. **`cart has two items`**
   * **What was wrong:** The test never navigated to the cart page before querying `.cart_item` (so `items` was `0`), and its assertion `expect(items).toBeGreaterThanOrEqual(0)` could never fail; it also mutated `cartCount` and used positional `nth(0)`/`nth(1)` locators.
   * **What changed:** Removed shared state, clicked specific `data-test` add-to-cart buttons, navigated to the cart page via `shopping-cart-link`, and asserted `await expect(page.locator('.cart_item')).toHaveCount(2)` along with the expected item names.
4. **`sort by price low to high`**
   * **What was wrong:** After selecting `'lohi'`, the test only checked `expect(prices.length).toBeGreaterThan(0)` and never verified that the prices were actually sorted in ascending order.
   * **What changed:** Confirmed the dropdown holds `'lohi'`, parsed the displayed price strings into numbers, and asserted `expect(prices).toEqual([...prices].sort((a, b) => a - b))`.

### Repeat-Run Verification

```bash
npx playwright test tests/legacy --repeat-each=10 --workers=4
```

* **Result:** `40 passed (1.4m)` (10 repetitions x 4 tests across 4 parallel workers, 0 failures).

### Practices to Avoid These Issues in Future

1. **Always `await` Playwright actions and use web-first assertions instead of fixed sleeps:** Enable TypeScript/ESLint rules (such as `@typescript-eslint/no-floating-promises`) to catch missing `await`s at build time, and replace `waitForTimeout` or one-shot `isVisible()`/`textContent()` checks with auto-retrying `await expect(locator)...` assertions.
2. **Enforce strict test isolation and meaningful, resilient assertions:** Never share mutable variables across tests, prefer stable semantic/test-id locators (`data-test`, `getByRole`) over positional XPaths or `.nth()`, and write assertions that directly verify the expected outcome (e.g., exact counts or sorted values) so broken behavior always fails.

## Task 4: Exploratory Testing

Exploratory testing was performed with `problem_user` and `performance_glitch_user`. Detailed bug reports, reproduction steps, severity justifications, and screenshots are documented in [docs/bug-reports.md](./docs/bug-reports.md):

1. **Finding 1 (`problem_user`, High):** Typing into the Checkout Step 1 **Last Name** field overwrites **First Name**, leaves **Last Name** empty, and blocks checkout (`Error: Last Name is required`). Automated with `test.fail()` in [tests/exploratory/defects.spec.ts](./tests/exploratory/defects.spec.ts).
2. **Finding 2 (`performance_glitch_user`, Medium):** Login (`5115 ms` vs. `105 ms` baseline) and product sorting (`5023 ms` vs. `18 ms` baseline) stall for ~5 seconds per action.

## AI Assistance

* AI assistance (Antigravity / Gemini) was used to scaffold the TypeScript/Playwright configuration, Page Object classes, UI/API/exploratory/legacy test suites, bug report documentation, and this README.
