# Exploratory Testing Bug Reports (Task 4)

Exploratory testing was conducted on [SauceDemo](https://www.saucedemo.com) using `problem_user` and `performance_glitch_user` (password: `secret_sauce`).

---

## Finding 1: `problem_user` — Last Name Input Overwrites First Name and Blocks Checkout

* **Severity:** **High**
* **Justification:** Completely blocks a logged-in user from progressing past Checkout Step 1 (`Your Information`) to complete any purchase, with no client-side workaround.
* **Environment:** `https://www.saucedemo.com`, Chromium (Playwright), account `problem_user`

### Issue Description
On the Checkout Step 1 form (`/checkout-step-one.html`), typing into the **Last Name** field updates the **First Name** field instead and leaves **Last Name** empty. Submitting the form triggers `Error: Last Name is required` and prevents checkout from proceeding.

### Reproduction Steps
1. Log in to `https://www.saucedemo.com` as `problem_user` / `secret_sauce`.
2. Add **Sauce Labs Backpack** to the cart and open the cart (`/cart.html`).
3. Click **Checkout** to open `/checkout-step-one.html`.
4. Enter `John` in **First Name**, `Doe` in **Last Name**, and `12345` in **Postal Code**.
5. Click **Continue**.

### Expected Behaviour
* **First Name** retains `John`, **Last Name** retains `Doe`, and **Postal Code** retains `12345`.
* Clicking **Continue** navigates to Checkout Step 2 (`/checkout-step-two.html`, `Checkout: Overview`).

### Actual Behaviour
* **First Name** is overwritten with `Doe` and **Last Name** remains empty (`""`).
* Clicking **Continue** keeps the user on `/checkout-step-one.html` and displays `Error: Last Name is required`.

### Supporting Evidence
* Screenshot: [problem-user-checkout-last-name-bug.png](./evidence/problem-user-checkout-last-name-bug.png)
* Automated regression test (marked with `test.fail()`): [defects.spec.ts](../tests/exploratory/defects.spec.ts)

---

## Finding 2: `performance_glitch_user` — ~5-Second Blocking Delay on Login and Product Sorting

* **Severity:** **Medium**
* **Justification:** Core storefront actions remain functional, so users are not completely blocked, but an artificial ~5-second delay per action severely degrades responsiveness and breaks any timing-sensitive user journeys or fixed-timeout checks.
* **Environment:** `https://www.saucedemo.com`, Chromium (Playwright), account `performance_glitch_user` vs. `standard_user` baseline

### Issue Description
Actions that execute almost instantaneously for `standard_user`—specifically submitting login credentials and changing the product sort order—stall for approximately **5 seconds** when logged in as `performance_glitch_user`.

### Reproduction Steps
1. Open `https://www.saucedemo.com`.
2. Enter `performance_glitch_user` / `secret_sauce` and click **Login**, measuring time until `/inventory.html` (`Products`) is visible.
3. On `/inventory.html`, change the sort dropdown (`product-sort-container`) to **Price (low to high)** (`lohi`), measuring time until the re-ordered product list renders.
4. Repeat steps 1–3 with `standard_user` as a baseline comparison.

### Expected Behaviour
* Login transition and client-side product sorting complete within typical sub-second UI responsiveness (comparable to `standard_user`: ~`105 ms` login, ~`18 ms` sort).

### Actual Behaviour
* Both operations exhibit a ~5-second delay before updating the UI:

| Action | `standard_user` | `performance_glitch_user` | Observed Slowdown |
| :--- | :--- | :--- | :--- |
| Login to `/inventory.html` | `105 ms` | `5115 ms` | ~48.7x slower |
| Sort by Price (`lohi`) | `18 ms` | `5023 ms` | ~279x slower |

### Supporting Evidence
* Screenshot after sort completion: [performance-glitch-user-inventory.png](./evidence/performance-glitch-user-inventory.png)
* Measured in Chromium via Playwright performance timestamps (`Date.now()` around action + DOM readiness wait).
