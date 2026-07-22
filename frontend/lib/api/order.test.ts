import { test, expect, vi } from 'vitest';
import { orderApi } from './order';
import * as client from './client';

vi.mock('./client', () => ({
  apiJson: vi.fn(),
}));

test('createOrder sends correct payload', async () => {
  const mockResponse = { reference: '1234', authorization_url: 'http://pay.url', orders: [] };
  (client.apiJson as any).mockResolvedValue(mockResponse);

  const payload = {
    items: [{ productId: 'prod-1', qty: 2 }],
    shippingAddress: { name: 'Test', phone: '123', line1: 'line', city: 'city', region: 'region' },
    paymentMethod: 'paystack',
  };

  const response = await orderApi.createOrder(payload);

  expect(client.apiJson).toHaveBeenCalledWith('/api/backend/orders', {
    method: 'POST',
    body: payload,
  });
  expect(response).toEqual(mockResponse);
});

test('getMyOrders calls GET /api/backend/orders/me', async () => {
  (client.apiJson as any).mockResolvedValue([]);
  const res = await orderApi.getMyOrders();
  expect(client.apiJson).toHaveBeenCalledWith('/api/backend/orders/me');
  expect(res).toEqual([]);
});
