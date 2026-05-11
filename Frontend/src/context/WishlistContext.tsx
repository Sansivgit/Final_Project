import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Product } from "@/data/products";

type WishCtx = {
  items: Product[];
  toggle: (p: Product) => void;
  has: (id: string) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
};

const Ctx = createContext<WishCtx>({} as WishCtx);
const KEY = "volt:wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const has = (id: string) => items.some((i) => i.id === id);
  const toggle = (p: Product) =>
    setItems((prev) => (prev.some((i) => i.id === p.id) ? prev.filter((i) => i.id !== p.id) : [...prev, p]));
  const remove = (id: string) => setItems((p) => p.filter((i) => i.id !== id));
  const clear = () => setItems([]);

  return (
    <Ctx.Provider value={{ items, toggle, has, remove, clear, count: items.length }}>{children}</Ctx.Provider>
  );
}

export const useWishlist = () => useContext(Ctx);
