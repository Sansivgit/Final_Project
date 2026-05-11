import type { Product } from "@/data/products";
import { resolveApiUrl } from "@/lib/api";

export type Filters = {
  category?: string;
  type?: string;
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
};

export type Sort = "featured" | "price-asc" | "price-desc" | "rating" | "newest";

type ApiProductDoc = {
  _id: string;
  title: string;
  description?: string;
  price: number;
  discount?: number;
  clothType: string;
  category: string;
  brand: string;
  sizes?: string[];
  colors?: Array<{ name: string; hex: string } | string>;
  image?: string;
  createdAt?: string;
};

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  );
}

/** Slug used in storefront URLs: stable because it ends with the Mongo `_id`. */
export function buildProductSlug(title: string, mongoId: string): string {
  return `${slugify(title)}-${mongoId}`;
}

export function extractMongoIdFromSlug(slug: string): string | undefined {
  if (/^[a-f\d]{24}$/i.test(slug)) return slug;
  const m = slug.match(/([a-f\d]{24})$/i);
  return m ? m[1] : undefined;
}

function mapApiProductToProduct(doc: ApiProductDoc): Product {
  const id = String(doc._id);
  const slug = buildProductSlug(doc.title, id);
  const colorsRaw = doc.colors ?? [];
  const colors = colorsRaw.map((c) =>
    typeof c === "string"
      ? { name: c, hex: "#888888" }
      : { name: c.name, hex: c.hex ?? "#888888" },
  );
  const rawImg = typeof doc.image === "string" ? doc.image.trim() : "";
  const images = rawImg ? [rawImg] : [PLACEHOLDER_IMG];
  const discount = Number(doc.discount) || 0;
  const compareAt =
    discount > 0 && doc.price > 0
      ? Math.round((doc.price / (1 - discount / 100)) * 100) / 100
      : undefined;
  const created = doc.createdAt ? new Date(doc.createdAt).getTime() : 0;
  const twoWeeks = 14 * 24 * 60 * 60 * 1000;

  return {
    id,
    slug,
    name: doc.title,
    brand: doc.brand?.trim() || "VOLT",
    category: doc.category?.trim() || "Unisex",
    type: doc.clothType?.trim() || "General",
    price: doc.price,
    compareAt,
    rating: 4.5,
    reviewCount: 0,
    colors: colors.length ? colors : [{ name: "Default", hex: "#888888" }],
    sizes: Array.isArray(doc.sizes) ? doc.sizes.map(String) : [],
    images,
    description: doc.description?.trim() ?? "",
    isNew: created > 0 && Date.now() - created < twoWeeks,
    isTrending: false,
  };
}

async function fetchProductList(searchParams: URLSearchParams): Promise<Product[]> {
  const qs = searchParams.toString();
  const url = resolveApiUrl(`/api/products${qs ? `?${qs}` : ""}`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (import.meta.env.DEV) {
        console.warn("[products] API error", res.status, res.statusText, url);
      }
      return [];
    }
    const data = (await res.json()) as { items?: ApiProductDoc[] };
    const items = Array.isArray(data.items) ? data.items : [];
    return items.map(mapApiProductToProduct);
  } catch {
    return [];
  }
}

async function fetchProductById(id: string): Promise<ApiProductDoc | null> {
  const url = resolveApiUrl(`/api/products/${encodeURIComponent(id)}`);
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as ApiProductDoc;
  } catch {
    return null;
  }
}

export async function getProducts(opts: { filters?: Filters; sort?: Sort } = {}) {
  const f = opts.filters ?? {};
  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("limit", "500");
  if (f.search?.trim()) params.set("search", f.search.trim());
  if (f.category?.trim()) params.set("category", f.category.trim());
  if (f.type?.trim()) params.set("clothType", f.type.trim());
  if (f.minPrice != null) params.set("minPrice", String(f.minPrice));
  if (f.maxPrice != null) params.set("maxPrice", String(f.maxPrice));

  const sort = opts.sort ?? "featured";
  if (sort === "price-asc") params.set("sort", "price-asc");
  else if (sort === "price-desc") params.set("sort", "price-desc");
  else if (sort === "newest") params.set("sort", "newest");

  let list = await fetchProductList(params);

  if (sort === "rating") {
    list = [...list].sort((a, b) => b.rating - a.rating);
  }

  if (f.sizes?.length) {
    list = list.filter((p) =>
      f.sizes!.some((sz) =>
        p.sizes.some((ps) => ps.toUpperCase() === sz.toUpperCase()),
      ),
    );
  }

  return list;
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const id = extractMongoIdFromSlug(slug);
  if (!id) return undefined;
  const doc = await fetchProductById(id);
  if (!doc?._id) return undefined;
  return mapApiProductToProduct(doc);
}

export async function getRelated(productId: string, clothType: string): Promise<Product[]> {
  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("limit", "40");
  if (clothType.trim()) params.set("clothType", clothType.trim());
  let list = await fetchProductList(params);
  list = list.filter((p) => p.id !== productId);
  return list.slice(0, 4);
}

export async function searchProducts(q: string): Promise<Product[]> {
  if (!q.trim()) return [];
  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("limit", "6");
  params.set("search", q.trim());
  return fetchProductList(params);
}
