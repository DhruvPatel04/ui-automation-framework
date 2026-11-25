import { expect, test } from '../../src/fixtures/apiFixtures';
import {
    BookingPayload,
    CreatedBookingResponse,
    buildBookingPayload,
} from '../../src/test-data/bookingData';

test.describe('Restful-Booker Booking API', () => {
    test(
        'creates a booking and retrieves it by ID',
        { tag: ['@smoke', '@regression'] },
        async ({ bookingClient, trackBooking }) => {
            const payload = buildBookingPayload();

            const createResponse = await bookingClient.createBooking(payload);
            expect(createResponse.status()).toBe(200);

            const created = (await createResponse.json()) as CreatedBookingResponse;
            expect(typeof created.bookingid).toBe('number');
            expect(created.bookingid).toBeGreaterThan(0);
            trackBooking(created.bookingid);

            expect(created.booking).toEqual(payload);

            const getResponse = await bookingClient.getBooking(created.bookingid);
            expect(getResponse.status()).toBe(200);

            const fetched = (await getResponse.json()) as BookingPayload;
            expect(fetched).toEqual(payload);
        },
    );

    test(
        'updates an existing booking completely with PUT',
        { tag: ['@smoke', '@regression'] },
        async ({ bookingClient, trackBooking }) => {
            const initialPayload = buildBookingPayload();
            const createResponse = await bookingClient.createBooking(initialPayload);
            expect(createResponse.status()).toBe(200);

            const { bookingid } = (await createResponse.json()) as CreatedBookingResponse;
            trackBooking(bookingid);

            const token = await bookingClient.getAuthToken();
            const updatedPayload = buildBookingPayload({
                firstname: `Updated-${Date.now().toString(36)}`,
                lastname: 'Morgan',
                totalprice: 320,
                depositpaid: false,
                bookingdates: {
                    checkin: '2027-01-10',
                    checkout: '2027-01-15',
                },
                additionalneeds: 'Late checkout',
            });

            const putResponse = await bookingClient.updateBooking(bookingid, updatedPayload, token);
            expect(putResponse.status()).toBe(200);

            const updatedBody = (await putResponse.json()) as BookingPayload;
            expect(updatedBody).toEqual(updatedPayload);

            const verifyResponse = await bookingClient.getBooking(bookingid);
            expect(verifyResponse.status()).toBe(200);
            expect(await verifyResponse.json()).toEqual(updatedPayload);
        },
    );

    test(
        'updates specific booking fields partially with PATCH',
        { tag: ['@regression'] },
        async ({ bookingClient, trackBooking }) => {
            const initialPayload = buildBookingPayload({
                totalprice: 200,
                additionalneeds: 'Breakfast',
            });
            const createResponse = await bookingClient.createBooking(initialPayload);
            expect(createResponse.status()).toBe(200);

            const { bookingid } = (await createResponse.json()) as CreatedBookingResponse;
            trackBooking(bookingid);

            const token = await bookingClient.getAuthToken();
            const patchPayload = {
                firstname: `Patched-${Date.now().toString(36)}`,
                totalprice: 275,
            };

            const patchResponse = await bookingClient.partialUpdateBooking(
                bookingid,
                patchPayload,
                token,
            );
            expect(patchResponse.status()).toBe(200);

            const expectedBooking: BookingPayload = {
                ...initialPayload,
                ...patchPayload,
            };
            expect(await patchResponse.json()).toEqual(expectedBooking);

            const verifyResponse = await bookingClient.getBooking(bookingid);
            expect(verifyResponse.status()).toBe(200);
            expect(await verifyResponse.json()).toEqual(expectedBooking);
        },
    );

    test(
        'deletes a booking and confirms it no longer exists',
        { tag: ['@smoke', '@regression'] },
        async ({ bookingClient }) => {
            const createResponse = await bookingClient.createBooking(buildBookingPayload());
            expect(createResponse.status()).toBe(200);

            const { bookingid } = (await createResponse.json()) as CreatedBookingResponse;
            const token = await bookingClient.getAuthToken();

            // Restful-Booker returns 201 Created on successful DELETE
            const deleteResponse = await bookingClient.deleteBooking(bookingid, token);
            expect(deleteResponse.status()).toBe(201);

            const getDeletedResponse = await bookingClient.getBooking(bookingid);
            expect(getDeletedResponse.status()).toBe(404);
        },
    );

    test(
        'rejects creating a booking with an invalid payload',
        { tag: ['@regression'] },
        async ({ bookingClient }) => {
            const invalidPayload = {
                firstname: 'OnlyFirstName',
            };

            const response = await bookingClient.createBooking(invalidPayload);
            // Restful-Booker returns 500 when required fields (e.g. bookingdates) are missing
            expect(response.status()).toBe(500);
        },
    );

    test(
        'returns 404 when retrieving a non-existent booking ID',
        { tag: ['@regression'] },
        async ({ bookingClient }) => {
            const nonExistentId = 999999999;

            const response = await bookingClient.getBooking(nonExistentId);
            expect(response.status()).toBe(404);
        },
    );

    test(
        'blocks PUT, PATCH, and DELETE without valid authentication',
        { tag: ['@regression'] },
        async ({ bookingClient, trackBooking }) => {
            const initialPayload = buildBookingPayload();
            const createResponse = await bookingClient.createBooking(initialPayload);
            expect(createResponse.status()).toBe(200);

            const { bookingid } = (await createResponse.json()) as CreatedBookingResponse;
            trackBooking(bookingid);

            const putWithoutToken = await bookingClient.updateBooking(
                bookingid,
                buildBookingPayload(),
            );
            expect(putWithoutToken.status()).toBe(403);

            const patchWithBadToken = await bookingClient.partialUpdateBooking(
                bookingid,
                { firstname: 'Unauthorized' },
                'invalid-token',
            );
            expect(patchWithBadToken.status()).toBe(403);

            const deleteWithoutToken = await bookingClient.deleteBooking(bookingid);
            expect(deleteWithoutToken.status()).toBe(403);

            // Confirm invalid auth credentials do not return a token
            const badAuthResponse = await bookingClient.createToken('admin', 'wrong_password');
            expect(badAuthResponse.status()).toBe(200);
            expect(await badAuthResponse.json()).toEqual({ reason: 'Bad credentials' });
        },
    );
});
