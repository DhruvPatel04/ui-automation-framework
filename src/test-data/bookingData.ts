export interface BookingDates {
    checkin: string;
    checkout: string;
}

export interface BookingPayload {
    firstname: string;
    lastname: string;
    totalprice: number;
    depositpaid: boolean;
    bookingdates: BookingDates;
    additionalneeds?: string;
}

export type PartialBookingPayload = Partial<BookingPayload>;

export interface CreatedBookingResponse {
    bookingid: number;
    booking: BookingPayload;
}

export const BOOKER_BASE_URL =
    process.env.BOOKER_BASE_URL ?? 'https://restful-booker.herokuapp.com';

export const BOOKER_AUTH = {
    username: process.env.BOOKER_USERNAME ?? 'admin',
    password: process.env.BOOKER_PASSWORD ?? 'password123',
} as const;

/**
 * Generates an isolated booking payload per test so parallel runs do not collide.
 */
export function buildBookingPayload(
    overrides: Partial<BookingPayload> = {},
): BookingPayload {
    const uniqueId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    return {
        firstname: `Alex-${uniqueId}`,
        lastname: 'Taylor',
        totalprice: 150,
        depositpaid: true,
        bookingdates: {
            checkin: '2026-12-01',
            checkout: '2026-12-05',
        },
        additionalneeds: 'Breakfast',
        ...overrides,
    };
}
