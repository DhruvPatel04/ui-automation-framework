export const USERS = {
    standard: {
        username: process.env.SAUCE_USERNAME ?? 'standard_user',
        password: process.env.SAUCE_PASSWORD ?? 'secret_sauce',
    },
    lockedOut: {
        username: 'locked_out_user',
        password: process.env.SAUCE_PASSWORD ?? 'secret_sauce',
    },
    problem: {
        username: 'problem_user',
        password: process.env.SAUCE_PASSWORD ?? 'secret_sauce',
    },
    performanceGlitch: {
        username: 'performance_glitch_user',
        password: process.env.SAUCE_PASSWORD ?? 'secret_sauce',
    },
} as const;

export const ROUTES = {
    login: '/',
    inventory: '/inventory.html',
    cart: '/cart.html',
    checkoutStepOne: '/checkout-step-one.html',
    checkoutStepTwo: '/checkout-step-two.html',
    checkoutComplete: '/checkout-complete.html',
} as const;

export interface ProductInfo {
    name: string;
    price: number;
}

export const PRODUCTS = {
    backpack: { name: 'Sauce Labs Backpack', price: 29.99 },
    bikeLight: { name: 'Sauce Labs Bike Light', price: 9.99 },
    boltTShirt: { name: 'Sauce Labs Bolt T-Shirt', price: 15.99 },
    fleeceJacket: { name: 'Sauce Labs Fleece Jacket', price: 49.99 },
    onesie: { name: 'Sauce Labs Onesie', price: 7.99 },
} as const satisfies Record<string, ProductInfo>;

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';
