import type { AdminProduct } from "@/context/AdminContext";
import { publicEnv } from "../../env.public";

/**
 * Express API base URL from `publicEnv.VITE_API_URL` (see `admin/env.public.ts`). When unset, the browser uses `/api` and Vite proxies to `VITE_BACKEND_ORIGIN`.
 * Trimmed, no trailing slash. Empty when unset — admin stays in offline/localStorage mode.
 */
export function getApiBaseUrl(): string {
  const raw = publicEnv.VITE_API_URL;
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim().replace(/\/$/, "");
  }
  return "";
}

const baseUrl = () => getApiBaseUrl();

/** True if API calls will reach Express (explicit base URL, or Vite dev + `/api` proxy). */
export function isApiConfigured(): boolean {
  if (getApiBaseUrl()) return true;
  return Boolean(import.meta.env.DEV);
}

export function authHeader(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

/** Successful POST /api/admin/login */
export type AdminLoginResponse = {
  token: string;
  admin: {
    name: string;
    email: string;
    role: string;
  };
};

export async function apiLogin(email: string, password: string): Promise<AdminLoginResponse> {
  const res = await fetch(`${baseUrl()}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json().catch(() => ({}))) as AdminLoginResponse & { message?: string };
  if (!res.ok) {
    if (data.message?.includes("secretOrPrivateKey")) {
      throw new Error("Backend JWT config is missing. Redeploy the backend with the latest TS config.");
    }
    throw new Error(data.message || "Login failed");
  }
  return data as AdminLoginResponse;
}

/** Upload image to Cloudinary via backend; field name must be `image`. */
export async function uploadProductImage(file: File, token: string): Promise<{ url: string; publicId?: string }> {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`${baseUrl()}/api/upload`, {
    method: "POST",
    headers: authHeader(token),
    body: fd,
  });
  const data = (await res.json().catch(() => ({}))) as { url?: string; publicId?: string; message?: string };
  if (!res.ok) {
    throw new Error(data.message || "Image upload failed");
  }
  if (!data.url) {
    throw new Error("No image URL returned");
  }
  return { url: data.url, publicId: data.publicId };
}

export type ApiProduct = {
  _id: string;
  title: string;
  description?: string;
  price: number;
  discount?: number;
  clothType: string;
  category: string;
  brand: string;
  stock: number;
  image?: string;
  sizes?: string[];
  colors?: Array<{ name: string; hex: string } | string>;
  createdAt?: string;
};

export type ApiProductList = {
  items: ApiProduct[];
  page: number;
  pages: number;
  total: number;
};

export async function fetchProductsPage(page = 1, limit = 200): Promise<ApiProductList> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(`${baseUrl()}/api/products?${params}`);
  const data = (await res.json()) as ApiProductList & { message?: string };
  if (!res.ok) {
    throw new Error(data.message || "Failed to load products");
  }
  return data;
}

export async function apiCreateProduct(
  body: Record<string, unknown>,
  token: string,
): Promise<ApiProduct> {
  const res = await fetch(`${baseUrl()}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as ApiProduct & { message?: string };
  if (!res.ok) {
    throw new Error(data.message || "Failed to create product");
  }
  return data as ApiProduct;
}

export async function apiUpdateProduct(
  id: string,
  body: Record<string, unknown>,
  token: string,
): Promise<ApiProduct> {
  const res = await fetch(`${baseUrl()}/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as ApiProduct & { message?: string };
  if (!res.ok) {
    throw new Error(data.message || "Failed to update product");
  }
  return data as ApiProduct;
}

export async function apiDeleteProduct(id: string, token: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/api/products/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || "Failed to delete product");
  }
}

function normalizeApiColors(raw: unknown): { name: string; hex: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => {
    if (typeof c === "string") {
      return { name: c.trim() || "Color", hex: "#888888" };
    }
    const o = c as { name?: string; hex?: string };
    return {
      name: String(o?.name ?? "Color").trim() || "Color",
      hex: String(o?.hex ?? "#888888").trim() || "#888888",
    };
  });
}

export function mapApiProductToAdmin(p: ApiProduct): AdminProduct {
  const colors = normalizeApiColors(p.colors);
  return {
    id: String(p._id),
    title: p.title,
    description: p.description ?? "",
    price: p.price,
    discount: p.discount ?? 0,
    clothType: p.clothType,
    category: p.category,
    brand: p.brand,
    stock: p.stock,
    imageUrl: p.image ?? "",
    createdAt: p.createdAt ?? new Date().toISOString(),
    sizes: Array.isArray(p.sizes) && p.sizes.length > 0 ? [...p.sizes] : ["M"],
    colors: colors.length > 0 ? colors : [{ name: "Black", hex: "#0a0a0a" }],
  };
}

/** Customer accounts only (role=user); returned by GET /api/users */
export type ApiCustomerUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  createdAt: string;
  isBlocked: boolean;
  totalOrders: number;
  totalSpent: number;
  totalProductsPurchased: number;
  lastPurchaseAt: string | null;
};

export type CustomerShippingAddress = {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: string;
};

export type CustomerAdminDetails = {
  user: ApiCustomerUser;
  orders: Array<{
    id: string;
    orderNumber: string;
    createdAt: string;
    totalAmount: number;
    status: string;
    paymentSummary: string;
    shippingAddress: CustomerShippingAddress | null;
    items: Array<{ title: string; quantity: number; unitPrice: number }>;
  }>;
  shippingAddresses: CustomerShippingAddress[];
  paymentSummary: {
    lifetimeTotal: number;
    orderCount: number;
    lastPaymentLabel: string | null;
  };
  recentlyPurchased: Array<{ title: string; quantity: number; unitPrice: number }>;
  timeline: Array<{ type: string; title: string; at: string; meta: string | null }>;
};

export async function fetchCustomerUsers(token: string): Promise<ApiCustomerUser[]> {
  const res = await fetch(`${baseUrl()}/api/users`, {
    headers: { ...authHeader(token) },
  });
  const data = (await res.json().catch(() => [])) as ApiCustomerUser[] | { message?: string };
  if (!res.ok) {
    throw new Error((data as { message?: string }).message || "Failed to load users");
  }
  return data as ApiCustomerUser[];
}

export async function fetchCustomerUserDetails(id: string, token: string): Promise<CustomerAdminDetails> {
  const res = await fetch(`${baseUrl()}/api/users/${encodeURIComponent(id)}/details`, {
    headers: { ...authHeader(token) },
  });
  const data = (await res.json().catch(() => ({}))) as CustomerAdminDetails & { message?: string };
  if (!res.ok) {
    throw new Error(data.message || "Failed to load user details");
  }
  return data as CustomerAdminDetails;
}

/** Admin orders list — GET /api/orders */
export type ApiAdminOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  paymentSummary: string;
  shippingAddress: Record<string, unknown> | null;
  items: Array<{ title: string; quantity: number; unitPrice: number; productId: string | null }>;
  user: { id: string; name: string; email: string } | null;
};

export async function fetchAdminOrders(
  token: string,
  page = 1,
  limit = 200,
): Promise<{ items: ApiAdminOrder[]; total: number; page: number; pages: number }> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(`${baseUrl()}/api/orders?${params}`, {
    headers: { ...authHeader(token) },
  });
  const data = (await res.json().catch(() => ({}))) as {
    items?: ApiAdminOrder[];
    total?: number;
    page?: number;
    pages?: number;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message || "Failed to load orders");
  }
  return {
    items: data.items ?? [],
    total: data.total ?? 0,
    page: data.page ?? page,
    pages: data.pages ?? 1,
  };
}

/** GET /api/products/stats/summary — requires admin JWT */
export async function fetchDashboardStats(token: string): Promise<{
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
}> {
  const res = await fetch(`${baseUrl()}/api/products/stats/summary`, {
    headers: { ...authHeader(token) },
  });
  const data = (await res.json().catch(() => ({}))) as {
    totalProducts?: number;
    totalUsers?: number;
    totalOrders?: number;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message || "Failed to load dashboard stats");
  }
  return {
    totalProducts: data.totalProducts ?? 0,
    totalUsers: data.totalUsers ?? 0,
    totalOrders: data.totalOrders ?? 0,
  };
}

/** GET /api/admin/cloth-types — MongoDB catalog for product “Cloth type” */
export type ApiClothType = {
  _id: string;
  name: string;
  sortOrder?: number;
  createdAt?: string;
};

export async function fetchClothTypes(token: string): Promise<ApiClothType[]> {
  const res = await fetch(`${baseUrl()}/api/admin/cloth-types`, {
    headers: { ...authHeader(token) },
  });
  const data = (await res.json().catch(() => [])) as ApiClothType[] | { message?: string };
  if (!res.ok) {
    throw new Error((data as { message?: string }).message || "Failed to load cloth types");
  }
  return data as ApiClothType[];
}

export async function apiCreateClothType(name: string, token: string): Promise<ApiClothType> {
  const res = await fetch(`${baseUrl()}/api/admin/cloth-types`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ name: name.trim() }),
  });
  const data = (await res.json().catch(() => ({}))) as ApiClothType & { message?: string };
  if (!res.ok) {
    throw new Error(data.message || "Could not add cloth type");
  }
  return data as ApiClothType;
}

export async function apiUpdateClothType(id: string, name: string, token: string): Promise<ApiClothType> {
  const res = await fetch(`${baseUrl()}/api/admin/cloth-types/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ name: name.trim() }),
  });
  const data = (await res.json().catch(() => ({}))) as ApiClothType & { message?: string };
  if (!res.ok) {
    throw new Error(data.message || "Could not update cloth type");
  }
  return data as ApiClothType;
}

export async function apiDeleteClothType(id: string, token: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/api/admin/cloth-types/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...authHeader(token) },
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || "Could not delete cloth type");
  }
}
