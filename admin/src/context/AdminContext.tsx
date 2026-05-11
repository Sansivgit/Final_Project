import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { products as seedProducts, type Product } from "@/data/products";
import {
  apiCreateProduct,
  apiDeleteProduct,
  apiLogin,
  apiUpdateProduct,
  fetchProductsPage,
  fetchCustomerUsers,
  fetchAdminOrders,
  fetchDashboardStats,
  isApiConfigured,
  mapApiProductToAdmin,
} from "@/services/api";
import type { ApiAdminOrder, ApiCustomerUser } from "@/services/api";
import { seedCustomers } from "@/data/customerMocks";

export type AdminCustomer = ApiCustomerUser;

export type AdminOrder = ApiAdminOrder;

export type AdminProductColor = { name: string; hex: string };

export type AdminProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
  discount: number;
  clothType: string;
  category: string;
  brand: string;
  stock: number;
  imageUrl: string;
  createdAt: string;
  sizes: string[];
  colors: AdminProductColor[];
};

type AdminAuth = { email: string; token: string; role?: string; name?: string } | null;

type Ctx = {
  admin: AdminAuth;
  useBackend: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  products: AdminProduct[];
  refreshProducts: () => Promise<void>;
  createProduct: (p: Omit<AdminProduct, "id" | "createdAt">) => Promise<void>;
  updateProduct: (id: string, p: Omit<AdminProduct, "id" | "createdAt">) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  users: AdminCustomer[];
  orders: AdminOrder[];
  dashboardStats: { totalProducts: number; totalUsers: number; totalOrders: number } | null;
};

const Ctx = createContext<Ctx>({} as Ctx);
const AUTH_KEY = "volt:admin";
const PROD_KEY = "volt:admin:products";
const USERS_KEY = "volt:admin:users";

const seedAdminProducts = (): AdminProduct[] =>
  seedProducts.map((p: Product) => ({
    id: p.id,
    title: p.name,
    description: p.description,
    price: p.price,
    discount: p.compareAt ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0,
    clothType: p.type,
    category: p.category,
    brand: p.brand,
    stock: 20 + Math.floor(Math.random() * 80),
    imageUrl: p.images[0],
    createdAt: new Date().toISOString(),
    sizes: [...p.sizes],
    colors: p.colors.map((c) => ({ name: c.name, hex: c.hex })),
  }));

export function AdminProvider({ children }: { children: ReactNode }) {
  const useBackend = isApiConfigured();
  const [admin, setAdmin] = useState<AdminAuth>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [users, setUsers] = useState<AdminCustomer[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [dashboardStats, setDashboardStats] = useState<Ctx["dashboardStats"]>(null);

  const refreshProducts = async () => {
    if (useBackend && admin?.token) {
      const { items } = await fetchProductsPage(1, 500);
      setProducts(items.map(mapApiProductToAdmin));
      return;
    }
    if (!useBackend) {
      try {
        const p = localStorage.getItem(PROD_KEY);
        setProducts(p ? JSON.parse(p) : seedAdminProducts());
      } catch {
        setProducts(seedAdminProducts());
      }
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) setAdmin(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!admin?.token) return;
    if (useBackend) {
      void refreshProducts();
    } else {
      try {
        const p = localStorage.getItem(PROD_KEY);
        setProducts(p ? JSON.parse(p) : seedAdminProducts());
      } catch {
        setProducts(seedAdminProducts());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when auth / mode changes
  }, [admin?.token, useBackend]);

  useEffect(() => {
    if (!admin?.token) {
      setUsers([]);
      setOrders([]);
      setDashboardStats(null);
      return;
    }
    if (!useBackend) {
      try {
        const raw = localStorage.getItem(USERS_KEY);
        setUsers(raw ? JSON.parse(raw) : seedCustomers);
      } catch {
        setUsers(seedCustomers);
      }
      setOrders([]);
      setDashboardStats(null);
      return;
    }

    let cancelled = false;
    const token = admin.token;
    (async () => {
      try {
        const [userList, ordRes, stats] = await Promise.all([
          fetchCustomerUsers(token),
          fetchAdminOrders(token),
          fetchDashboardStats(token),
        ]);
        if (!cancelled) {
          setUsers(userList);
          setOrders(ordRes.items);
          setDashboardStats(stats);
        }
      } catch {
        if (!cancelled) {
          setUsers([]);
          setOrders([]);
          setDashboardStats(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [admin?.token, useBackend]);

  const login: Ctx["login"] = async (email, password) => {
    if (useBackend) {
      const data = await apiLogin(email, password);
      const session = {
        email: data.admin.email,
        token: data.token,
        role: data.admin.role,
        name: data.admin.name,
      };
      setAdmin(session);
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      return;
    }
    await new Promise((r) => setTimeout(r, 400));
    if (email !== "admin@volt.com" || password !== "admin123") {
      throw new Error("Invalid admin credentials");
    }
    const session = { email, token: "mock.jwt." + btoa(email), role: "admin" as const, name: "Admin" };
    setAdmin(session);
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem(AUTH_KEY);
    setProducts([]);
    setUsers([]);
    setOrders([]);
    setDashboardStats(null);
  };

  const createProduct: Ctx["createProduct"] = async (p) => {
    if (useBackend) {
      if (!admin?.token) throw new Error("Not signed in");
      const body = {
        title: p.title,
        description: p.description,
        price: p.price,
        discount: p.discount,
        clothType: p.clothType,
        category: p.category,
        brand: p.brand,
        stock: p.stock,
        image: p.imageUrl,
        sizes: p.sizes,
        colors: p.colors.map((c) => ({ name: c.name, hex: c.hex })),
      };
      const created = await apiCreateProduct(body, admin.token);
      const mapped = mapApiProductToAdmin(created);
      setProducts((prev) => [mapped, ...prev]);
      try {
        const stats = await fetchDashboardStats(admin.token);
        setDashboardStats(stats);
      } catch {
        /* ignore */
      }
      return;
    }
    setProducts((prev) => {
      const next = [{ ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...prev];
      localStorage.setItem(PROD_KEY, JSON.stringify(next));
      return next;
    });
  };

  const updateProduct: Ctx["updateProduct"] = async (id, p) => {
    if (useBackend) {
      if (!admin?.token) throw new Error("Not signed in");
      const body = {
        title: p.title,
        description: p.description,
        price: p.price,
        discount: p.discount,
        clothType: p.clothType,
        category: p.category,
        brand: p.brand,
        stock: p.stock,
        image: p.imageUrl,
        sizes: p.sizes,
        colors: p.colors.map((c) => ({ name: c.name, hex: c.hex })),
      };
      const updated = await apiUpdateProduct(id, body, admin.token);
      const mapped = mapApiProductToAdmin(updated);
      setProducts((prev) => prev.map((x) => (x.id === id ? mapped : x)));
      try {
        const stats = await fetchDashboardStats(admin.token);
        setDashboardStats(stats);
      } catch {
        /* ignore */
      }
      return;
    }
    setProducts((prev) => {
      const next = prev.map((x) => (x.id === id ? { ...x, ...p } : x));
      localStorage.setItem(PROD_KEY, JSON.stringify(next));
      return next;
    });
  };

  const deleteProduct: Ctx["deleteProduct"] = async (id) => {
    if (useBackend) {
      if (!admin?.token) throw new Error("Not signed in");
      await apiDeleteProduct(id, admin.token);
      setProducts((prev) => prev.filter((x) => x.id !== id));
      try {
        const stats = await fetchDashboardStats(admin.token);
        setDashboardStats(stats);
      } catch {
        /* ignore */
      }
      return;
    }
    setProducts((prev) => {
      const next = prev.filter((x) => x.id !== id);
      localStorage.setItem(PROD_KEY, JSON.stringify(next));
      return next;
    });
  };

  const value = useMemo(
    () => ({
      admin,
      useBackend,
      login,
      logout,
      products,
      refreshProducts,
      createProduct,
      updateProduct,
      deleteProduct,
      users,
      orders,
      dashboardStats,
    }),
    [admin, products, users, orders, dashboardStats, useBackend],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAdmin = () => useContext(Ctx);
