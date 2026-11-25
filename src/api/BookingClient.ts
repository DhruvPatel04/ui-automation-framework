import { APIRequestContext, APIResponse } from '@playwright/test';
import {
    BOOKER_AUTH,
    BookingPayload,
    PartialBookingPayload,
} from '../test-data/bookingData';

export class BookingClient {
    readonly request: APIRequestContext;

    constructor(request: APIRequestContext) {
        this.request = request;
    }

    async createToken(
        username: string = BOOKER_AUTH.username,
        password: string = BOOKER_AUTH.password,
    ): Promise<APIResponse> {
        return this.request.post('/auth', {
            data: { username, password },
        });
    }

    async getAuthToken(
        username: string = BOOKER_AUTH.username,
        password: string = BOOKER_AUTH.password,
    ): Promise<string> {
        const response = await this.createToken(username, password);
        if (!response.ok()) {
            throw new Error(`Failed to generate auth token: HTTP ${response.status()}`);
        }
        const body = (await response.json()) as { token?: string };
        if (!body.token) {
            throw new Error('Auth response did not include a token');
        }
        return body.token;
    }

    async getBookingIds(params?: Record<string, string>): Promise<APIResponse> {
        return this.request.get('/booking', { params });
    }

    async getBooking(id: number | string): Promise<APIResponse> {
        return this.request.get(`/booking/${id}`);
    }

    async createBooking(payload: BookingPayload | Record<string, unknown>): Promise<APIResponse> {
        return this.request.post('/booking', {
            data: payload,
        });
    }

    async updateBooking(
        id: number | string,
        payload: BookingPayload | Record<string, unknown>,
        token?: string,
    ): Promise<APIResponse> {
        return this.request.put(`/booking/${id}`, {
            data: payload,
            headers: token ? { Cookie: `token=${token}` } : undefined,
        });
    }

    async partialUpdateBooking(
        id: number | string,
        payload: PartialBookingPayload | Record<string, unknown>,
        token?: string,
    ): Promise<APIResponse> {
        return this.request.patch(`/booking/${id}`, {
            data: payload,
            headers: token ? { Cookie: `token=${token}` } : undefined,
        });
    }

    async deleteBooking(id: number | string, token?: string): Promise<APIResponse> {
        return this.request.delete(`/booking/${id}`, {
            headers: token ? { Cookie: `token=${token}` } : undefined,
        });
    }
}
