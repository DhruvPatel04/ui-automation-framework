import { test as base } from '@playwright/test';
import { BookingClient } from '../api/BookingClient';

type ApiFixtures = {
    bookingClient: BookingClient;
    trackBooking: (id: number) => void;
};

/**
 * Provides a BookingClient instance and automatically cleans up any bookings
 * registered via trackBooking() after each test completes.
 */
export const test = base.extend<ApiFixtures>({
    bookingClient: async ({ request }, use) => {
        await use(new BookingClient(request));
    },

    trackBooking: async ({ bookingClient }, use) => {
        const createdIds: number[] = [];

        await use((id: number) => {
            createdIds.push(id);
        });

        if (createdIds.length === 0) {
            return;
        }

        const token = await bookingClient.getAuthToken();
        for (const id of createdIds) {
            // Best-effort cleanup: a test may have already deleted the booking.
            await bookingClient.deleteBooking(id, token).catch(() => undefined);
        }
    },
});

export { expect } from '@playwright/test';
