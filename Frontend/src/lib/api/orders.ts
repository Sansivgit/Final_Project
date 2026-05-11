import { getAuthJson } from "@/lib/api";

export type OrderLine = {
  title: string;
  quantity: number;
  unitPrice: number;
};

export type ShippingSnapshot = {
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type UserOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  paymentSummary?: string;
  shippingAddress?: ShippingSnapshot | null;
  items: OrderLine[];
};

export async function fetchMyOrders(token: string): Promise<UserOrder[]> {
  const data = await getAuthJson<{ items?: UserOrder[] }>("/api/orders/me", token);
  return Array.isArray(data.items) ? data.items : [];
}
