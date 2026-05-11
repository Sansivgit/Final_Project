import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, Grid2x2, List, X } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { getProducts, type Filters, type Sort } from "@/lib/api/products";
import type { Product } from "@/data/products";
import { fetchCatalogClothTypes } from "@/lib/catalog";
import { STANDARD_APPAREL_SIZES } from "@/lib/sizes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatInr } from "@/lib/formatInr";

type Search = { category?: string; sort?: Sort; search?: string };

export const Route = createFileRoute("/products")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    category: typeof s.category === "string" ? s.category : undefined,
    sort: typeof s.sort === "string" ? (s.sort as Sort) : undefined,
    search: typeof s.search === "string" ? s.search : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop All — VOLT" },
      { name: "description", content: "Browse all athletic streetwear: shoes, hoodies, pants, tees, accessories." },
      { property: "og:title", content: "Shop All — VOLT" },
    ],
  }),
  component: PLP,
});

/** Fallback when cloth-types catalog API is still loading or unreachable. */
const FALLBACK_CLOTH_TYPES: string[] = [];

/** URL `?category=` values that always map to product `category`, never `clothType`. */
const APPAREL_CATEGORIES = new Set<string>(["Men", "Women", "Unisex"]);

function PLP() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/products" });
  const [items, setItems] = useState<Product[] | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [clothTypesFromApi, setClothTypesFromApi] = useState<string[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [visible, setVisible] = useState(12);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetchCatalogClothTypes().then(setClothTypesFromApi);
  }, []);

  const typeOptions = clothTypesFromApi.length > 0 ? clothTypesFromApi : FALLBACK_CLOTH_TYPES;

  const activeFilters: Filters = useMemo(() => {
    const f: Filters = { ...filters };
    if (search.category) {
      if (APPAREL_CATEGORIES.has(search.category)) {
        f.category = search.category;
      } else if (typeOptions.includes(search.category)) {
        f.type = search.category;
      } else {
        f.category = search.category;
      }
    }
    if (search.search) f.search = search.search;
    return f;
  }, [filters, search.category, search.search, typeOptions]);

  useEffect(() => {
    setItems(null);
    getProducts({ filters: activeFilters, sort: search.sort ?? "featured" }).then(setItems);
  }, [activeFilters, search.sort]);

  useEffect(() => {
    if (!sentinel.current || !items) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setVisible((v) => Math.min(v + 8, items.length));
    });
    obs.observe(sentinel.current);
    return () => obs.disconnect();
  }, [items]);

  const toggleSizeFilter = (v: string) => {
    setFilters((f) => {
      const arr = f.sizes ?? [];
      return { ...f, sizes: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });
  };

  const clearAll = () => {
    setFilters({});
    navigate({ search: { sort: search.sort } });
  };

  const FilterPanel = (
    <div className="space-y-6">
      <FilterGroup title="Category">
        {(["Men", "Women", "Unisex"] as const).map((c) => (
          <button
            key={c}
            onClick={() => navigate({ search: (prev: Search) => ({ ...prev, category: prev.category === c ? undefined : c }) })}
            className={cn("block text-sm py-1 transition-colors hover:text-foreground", search.category === c ? "font-semibold" : "text-muted-foreground")}
          >
            {c}
          </button>
        ))}
      </FilterGroup>
      <FilterGroup title="Cloth type">
        {typeOptions.map((t) => (
          <button
            key={t}
            onClick={() => setFilters((f) => ({ ...f, type: f.type === t ? undefined : t }))}
            className={cn("block text-sm py-1 transition-colors hover:text-foreground", filters.type === t ? "font-semibold" : "text-muted-foreground")}
          >
            {t}
          </button>
        ))}
      </FilterGroup>
      <FilterGroup title="Size">
        <div className="flex flex-wrap gap-2">
          {STANDARD_APPAREL_SIZES.map((s) => {
            const on = filters.sizes?.includes(s);
            return (
              <button key={s} onClick={() => toggleSizeFilter(s)}
                className={cn("h-8 min-w-10 px-2 rounded border text-xs font-medium transition-colors", on ? "volt-primary-btn border-neutral-950 dark:border-neutral-50" : "border-border hover:border-neutral-500 dark:hover:border-neutral-400")}>
                {s}
              </button>
            );
          })}
        </div>
      </FilterGroup>
      <FilterGroup title="Price">
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={filters.minPrice ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value ? +e.target.value : undefined }))}
            className="h-9 w-full rounded border border-border bg-transparent px-2 text-sm" />
          <input type="number" placeholder="Max" value={filters.maxPrice ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value ? +e.target.value : undefined }))}
            className="h-9 w-full rounded border border-border bg-transparent px-2 text-sm" />
        </div>
      </FilterGroup>
      <Button variant="outline" className="w-full" onClick={clearAll}>Clear all</Button>
    </div>
  );

  const visibleItems = items?.slice(0, visible) ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Shop", to: "/products" }, ...(search.category ? [{ label: search.category }] : [])]} />

      <div className="mt-4 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-6xl uppercase">{search.category || (search.search ? `"${search.search}"` : "Shop all")}</h1>
          <div className="text-sm text-muted-foreground mt-1">{items ? `${items.length} products` : "Loading…"}</div>
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden"><SlidersHorizontal className="h-4 w-4 mr-2" />Filters</Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <div className="font-display text-xl uppercase mb-6 mt-2">Filters</div>
              {FilterPanel}
            </SheetContent>
          </Sheet>
          <Select value={search.sort ?? "featured"} onValueChange={(v) => navigate({ search: (prev: Search) => ({ ...prev, sort: v as Sort }) })}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low → High</SelectItem>
              <SelectItem value="price-desc">Price: High → Low</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
            </SelectContent>
          </Select>
          <div className="hidden md:flex items-center border border-border rounded">
            <button onClick={() => setView("grid")} className={cn("h-9 w-9 flex items-center justify-center rounded-l", view === "grid" && "volt-primary-btn")} aria-label="Grid view"><Grid2x2 className="h-4 w-4" /></button>
            <button onClick={() => setView("list")} className={cn("h-9 w-9 flex items-center justify-center rounded-r", view === "list" && "volt-primary-btn")} aria-label="List view"><List className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {/* Active chips */}
      {(filters.type || filters.sizes?.length) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.type && <Chip onRemove={() => setFilters((f) => ({ ...f, type: undefined }))}>{filters.type}</Chip>}
          {filters.sizes?.map((s) => (
            <Chip key={s} onRemove={() => toggleSizeFilter(s)}>
              Size {s}
            </Chip>
          ))}
        </div>
      )}

      <div className="mt-8 grid md:grid-cols-[240px_1fr] gap-10">
        <aside className="hidden md:block">{FilterPanel}</aside>
        <div>
          {visibleItems && visibleItems.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground">No products match your filters.</div>
          ) : view === "list" ? (
            <div className="grid gap-4">
              {(visibleItems ?? Array.from({ length: 6 })).map((p, i) =>
                p ? (
                  <div
                    key={(p as Product).id}
                    className="flex gap-5 group rounded-lg p-3 hover:bg-muted transition-colors"
                  >
                    <div className="h-40 w-32 shrink-0 overflow-hidden rounded bg-muted">
                      <img
                        src={(p as Product).images[0]}
                        alt={(p as Product).name}
                        draggable={false}
                        className="h-full w-full object-cover pointer-events-none select-none"
                      />
                    </div>
                    <Link to="/products/$slug" params={{ slug: (p as Product).slug }} className="min-w-0 flex-1 block">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{(p as Product).type}</div>
                      <h3 className="font-display text-xl uppercase mt-1">{(p as Product).name}</h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{(p as Product).description}</p>
                      <div className="mt-3 font-semibold">{formatInr((p as Product).price)}</div>
                    </Link>
                  </div>
                ) : (
                  <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
                )
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {visibleItems
                ? visibleItems.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
                : Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          )}
          <div ref={sentinel} className="h-10" />
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-display uppercase text-xs tracking-widest mb-3">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <button onClick={onRemove} className="inline-flex items-center gap-1.5 bg-muted hover:bg-accent rounded-full px-3 py-1 text-xs transition-colors">
      {children} <X className="h-3 w-3" />
    </button>
  );
}
