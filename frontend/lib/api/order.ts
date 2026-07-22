import { apiJson } from "./client";
import type { Address, CartItem, Size } from "../consumer/types";

export interface OrderItemPayload {
  productId: string;
  size?: string;
  color?: string;
  qty: number;
}

export interface CreateOrderPayload {
  items: OrderItemPayload[];
  shippingAddress: Address;
  paymentMethod: string;
  measurementId?: string | null;
}

export interface CreateOrderResponse {
  orders: Record<string, unknown>[];
  reference: string;
  authorization_url: string;
}

export const orderApi = {
  async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    return apiJson<CreateOrderResponse>("/api/backend/orders", {
      method: "POST",
      body: payload,
    });
  },

  async getMyOrders(): Promise<Record<string, unknown>[]> {
    return apiJson<Record<string, unknown>[]>("/api/backend/orders/me");
  },

  async getOrderById(id: string): Promise<Record<string, unknown>> {
    return apiJson<Record<string, unknown>>(`/api/backend/orders/${id}`);
  },
};
