import type { ApiCustomerUser, CustomerAdminDetails } from "@/services/api";
import { formatInr } from "@/lib/formatInr";

/** Demo-only customer rows when API is offline — admins are not listed here. */
export const seedCustomers: ApiCustomerUser[] = [
  {
    id: "u1",
    name: "Alex Carter",
    email: "alex@volt.com",
    phone: "+1 (415) 555-0142",
    avatarUrl: "",
    createdAt: "2025-12-04T10:00:00Z",
    isBlocked: false,
    totalOrders: 5,
    totalProductsPurchased: 12,
    totalSpent: 847.5,
    lastPurchaseAt: "2026-04-28T14:22:00Z",
  },
  {
    id: "u2",
    name: "Riley Kim",
    email: "riley@volt.com",
    phone: "+1 (646) 555-0198",
    avatarUrl: "",
    createdAt: "2026-01-12T09:30:00Z",
    isBlocked: false,
    totalOrders: 2,
    totalProductsPurchased: 4,
    totalSpent: 268.0,
    lastPurchaseAt: "2026-03-02T11:05:00Z",
  },
  {
    id: "u3",
    name: "Jordan Lee",
    email: "jordan@volt.com",
    phone: "+44 20 7946 0958",
    avatarUrl: "",
    createdAt: "2026-02-02T14:20:00Z",
    isBlocked: true,
    totalOrders: 1,
    totalProductsPurchased: 2,
    totalSpent: 156.99,
    lastPurchaseAt: "2026-02-15T09:12:00Z",
  },
  {
    id: "u4",
    name: "Sam Patel",
    email: "sam@volt.com",
    phone: "+1 (312) 555-0187",
    avatarUrl: "",
    createdAt: "2026-02-28T08:11:00Z",
    isBlocked: false,
    totalOrders: 8,
    totalProductsPurchased: 21,
    totalSpent: 1420.4,
    lastPurchaseAt: "2026-05-01T16:40:00Z",
  },
  {
    id: "u5",
    name: "Casey Morgan",
    email: "casey@volt.com",
    phone: "+1 (503) 555-0166",
    avatarUrl: "",
    createdAt: "2026-03-15T16:45:00Z",
    isBlocked: false,
    totalOrders: 0,
    totalProductsPurchased: 0,
    totalSpent: 0,
    lastPurchaseAt: null,
  },
  {
    id: "u6",
    name: "Quinn Rivera",
    email: "quinn@volt.com",
    phone: "+52 55 8421 3391",
    avatarUrl: "",
    createdAt: "2026-04-09T11:25:00Z",
    isBlocked: false,
    totalOrders: 3,
    totalProductsPurchased: 7,
    totalSpent: 512.25,
    lastPurchaseAt: "2026-04-21T10:00:00Z",
  },
  {
    id: "u7",
    name: "Avery Brooks",
    email: "avery@volt.com",
    phone: "+1 (206) 555-0174",
    avatarUrl: "",
    createdAt: "2026-04-22T13:50:00Z",
    isBlocked: false,
    totalOrders: 1,
    totalProductsPurchased: 3,
    totalSpent: 199.0,
    lastPurchaseAt: "2026-04-23T08:55:00Z",
  },
];

export function getMockCustomerDetails(user: ApiCustomerUser): CustomerAdminDetails {
  const created = new Date(user.createdAt);
  const lastPur = user.lastPurchaseAt ? new Date(user.lastPurchaseAt) : null;

  if (user.totalOrders <= 0) {
    return {
      user,
      orders: [],
      shippingAddresses: [],
      paymentSummary: {
        lifetimeTotal: 0,
        orderCount: 0,
        lastPaymentLabel: null,
      },
      recentlyPurchased: [],
      timeline: [
        {
          type: "account",
          title: "Account created",
          at: user.createdAt,
          meta: null,
        },
      ],
    };
  }

  const n = user.totalOrders;
  const orders: CustomerAdminDetails["orders"] = [];
  let allocated = 0;

  for (let i = 0; i < n; i++) {
    const isLast = i === n - 1;
    const amount = isLast
      ? Math.round((user.totalSpent - allocated) * 100) / 100
      : Math.round((user.totalSpent / n) * 100) / 100;
    allocated += amount;

    const daysAfterCreate = 8 + i * 18;
    const createdAt =
      i === 0 && lastPur
        ? lastPur.toISOString()
        : new Date(created.getTime() + 86400000 * daysAfterCreate).toISOString();

    orders.push({
      id: `${user.id}-o${i + 1}`,
      orderNumber: `VT-${user.id.slice(-2).toUpperCase()}-${9001 + i}`,
      createdAt,
      totalAmount: amount,
      status: i === 0 ? "delivered" : i === 1 ? "shipped" : "paid",
      paymentSummary: i % 2 === 0 ? "Visa ···· 4242" : "PayPal",
      shippingAddress: {
        fullName: user.name,
        line1: `${1200 + i * 22} Market Street`,
        line2: i % 2 === 0 ? "Suite 400" : "",
        city: i % 3 === 0 ? "San Francisco" : "Portland",
        postalCode: i % 2 === 0 ? "94102" : "97205",
        country: "USA",
      },
      items: [
        { title: "Phantom Runner 1", quantity: 1 + i, unitPrice: 129 },
        { title: "Core Tee", quantity: 2, unitPrice: 45 },
      ],
    });
  }

  orders.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const addrMap = new Map<string, NonNullable<(typeof orders)[0]["shippingAddress"]>>();
  for (const o of orders) {
    const a = o.shippingAddress;
    if (!a?.line1) continue;
    const key = `${a.line1}|${a.city}|${a.postalCode}`;
    if (!addrMap.has(key)) addrMap.set(key, a);
  }

  const recentlyPurchased = (orders[0]?.items ?? []).slice(0, 8);

  const timeline = [
    { type: "account", title: "Account created", at: user.createdAt, meta: null },
    ...orders.map((o) => ({
      type: "order",
      title: `Order ${o.orderNumber}`,
      at: o.createdAt,
      meta: `${formatInr(o.totalAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · ${o.status}`,
    })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  return {
    user,
    orders,
    shippingAddresses: [...addrMap.values()],
    paymentSummary: {
      lifetimeTotal: user.totalSpent,
      orderCount: user.totalOrders,
      lastPaymentLabel: orders[0]?.paymentSummary ?? null,
    },
    recentlyPurchased,
    timeline,
  };
}
