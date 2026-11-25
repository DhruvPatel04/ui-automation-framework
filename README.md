# QA Automation Engineer — Take-Home Assignment

Playwright + TypeScript automation framework covering [SauceDemo](https://www.saucedemo.com) (UI) using the Page Object Model and [Restful-Booker](https://restful-booker.herokuapp.com) (API) using a reusable API client and cleanup fixtures.

## Project Structure

```text
ui-automation-framework/
├── .github/
│   └── workflows/
│       └── playwright.yml        # GitHub Actions CI workflow running Playwright tests & uploading reports
├── playwright.config.ts          # Projects (setup, ui-unauthenticated, ui-authenticated, api) & testId config
├── package.json                  # Project metadata and Playwright/Node devDependencies
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
    └── api/
        └── booking.spec.ts       # Restful-Booker CRUD & negative API tests (@smoke, @regression)
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
# Run all tests (UI + API projects)
npx playwright test

# Run only the API test suite
npx playwright test --project=api

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

## AI Assistance

* AI assistance (Antigravity / Gemini) was used to scaffold the TypeScript/Playwright configuration, Page Object classes, UI test suites, and this README.
