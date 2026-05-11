import { createFileRoute, Link, notFound, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Minus, Plus, ShoppingBag, Star, Truck, RotateCcw, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductCard } from "@/components/ProductCard";
import { getProduct, getRelated } from "@/lib/api/products";
import type { Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { loginSearch, safeRedirectPath } from "@/lib/authRedirect";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { formatInr } from "@/lib/formatInr";
import { orderedStandardSizes, resolveStoredSize } from "@/lib/sizes";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const product = await getProduct(params.slug);
    if (!product) throw notFound();
    const related = await getRelated(product.id, product.type);
    return { product, related };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — VOLT` },
          { name: "description", content: loaderData.product.description },
          { property: "og:title", content: `${loaderData.product.name} — VOLT` },
          { property: "og:description", content: loaderData.product.description },
          { property: "og:image", content: loaderData.product.images[0] },
        ]
      : [],
  }),
  component: PDP,
});

function PDP() {
  const { product, related } = Route.useLoaderData() as { product: Product; related: Product[] };
  const defaultColor = product.colors[0]?.name ?? "Standard";
  const displaySizes = orderedStandardSizes(product.sizes);
  const [size, setSize] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const loc = useRouterState({ select: (s) => s.location });
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const wished = has(product.id);

  const goLogin = () => {
    const r = `${loc.pathname}${loc.search}`;
    navigate({ to: "/login", search: loginSearch(safeRedirectPath(r)) });
  };

  // reset on slug change
  useEffect(() => {
    setSize("");
    setQty(1);
    setActiveImg(0);
  }, [product.id]);

  const onAdd = () => {
    if (!user) {
      toast.info("Sign in to add items to your bag");
      goLogin();
      return;
    }
    if (!size) {
      toast.error("Select a size");
      return;
    }
    add(product, size, defaultColor, qty);
    toast.success("Added to bag", { description: `${product.name} · ${size}` });
  };

  const onWishToggle = () => {
    if (!user) {
      toast.info("Sign in to save favorites");
      goLogin();
      return;
    }
    toggle(product);
    toast(wished ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Shop", to: "/products" }, { label: product.type, to: "/products" }, { label: product.name }]} />

      <div className="mt-6 grid md:grid-cols-[1fr_1fr] gap-8 lg:gap-14">
        {/* Gallery */}
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <div className="flex flex-col gap-2 order-2 md:order-1">
            {product.images.map((src, i) => (
              <button key={i} onClick={() => setActiveImg(i)}
                className={cn("aspect-square rounded-md overflow-hidden border-2 transition-colors", activeImg === i ? "border-foreground" : "border-transparent")}>
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <motion.div
            key={activeImg}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            className="order-1 md:order-2 aspect-[4/5] rounded-lg overflow-hidden bg-muted group relative"
          >
            <img src={product.images[activeImg]} alt={product.name}
              draggable={false}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none select-none" />
          </motion.div>
        </div>

        {/* Info */}
        <div>
          <div className="text-xs font-display uppercase tracking-widest text-muted-foreground">{product.brand} · {product.type}</div>
          <h1 className="font-display text-3xl md:text-5xl uppercase mt-2">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("h-4 w-4", i < Math.round(product.rating) ? "fill-foreground text-foreground" : "text-muted-foreground")} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{product.rating} · {product.reviewCount} reviews</span>
          </div>
          <div className="mt-5 flex items-baseline gap-3">
            <div className="text-3xl font-semibold">{formatInr(product.price)}</div>
            {product.compareAt && <div className="text-lg text-muted-foreground line-through">{formatInr(product.compareAt)}</div>}
            {product.compareAt && (
              <div className="text-xs font-display uppercase tracking-widest bg-volt text-volt-foreground px-2 py-1 rounded">
                Save {formatInr(product.compareAt - product.price)}
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="font-display uppercase text-xs tracking-widest">Size</div>
              <button type="button" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
                Size guide
              </button>
            </div>
            {displaySizes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Standard sizes (XS–XXL) are not listed for this product.
              </p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {displaySizes.map((canon) => {
                  const stored = resolveStoredSize(canon, product.sizes) ?? canon;
                  return (
                    <button
                      key={canon}
                      type="button"
                      onClick={() => setSize(stored)}
                      className={cn(
                        "h-12 rounded border text-sm font-medium transition-colors",
                        size === stored
                          ? "volt-primary-btn border-neutral-950 dark:border-neutral-50"
                          : "border-border hover:border-neutral-500 dark:hover:border-neutral-400",
                      )}
                    >
                      {canon}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center border border-border rounded">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-12 w-12 flex items-center justify-center" aria-label="Decrease"><Minus className="h-4 w-4" /></button>
              <div className="w-10 text-center text-sm">{qty}</div>
              <button onClick={() => setQty((q) => q + 1)} className="h-12 w-12 flex items-center justify-center" aria-label="Increase"><Plus className="h-4 w-4" /></button>
            </div>
            <Button onClick={onAdd} size="lg" className="flex-1 h-12 volt-primary-btn font-display uppercase tracking-widest">
              <ShoppingBag className="h-4 w-4 mr-2" /> Add to bag
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12" onClick={onWishToggle} aria-label="Wishlist">
              <Heart className={cn("h-5 w-5", wished && "fill-foreground")} />
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
            {[{ i: Truck, t: "Free shipping" }, { i: RotateCcw, t: "30-day returns" }, { i: Shield, t: "2yr warranty" }].map(({ i: I, t }) => (
              <div key={t} className="flex items-center gap-2 p-3 rounded border border-border">
                <I className="h-4 w-4" /> {t}
              </div>
            ))}
          </div>

          <Accordion type="multiple" className="mt-8">
            <AccordionItem value="desc">
              <AccordionTrigger className="font-display uppercase tracking-widest text-sm">Description</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{product.description}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="ship">
              <AccordionTrigger className="font-display uppercase tracking-widest text-sm">Shipping</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">Free standard shipping on orders over ₹8,500. Express options at checkout.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="ret">
              <AccordionTrigger className="font-display uppercase tracking-widest text-sm">Returns</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">Free 30-day returns. Items must be unworn with tags attached.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-20">
        <h2 className="font-display text-3xl uppercase">Reviews</h2>
        <div className="mt-6 grid md:grid-cols-[280px_1fr] gap-10">
          <div className="rounded-lg border border-border p-6">
            <div className="text-5xl font-display font-bold">{product.rating}</div>
            <div className="flex items-center gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("h-4 w-4", i < Math.round(product.rating) ? "fill-foreground text-foreground" : "text-muted-foreground")} />
              ))}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{product.reviewCount} reviews</div>
          </div>
          <div className="space-y-6">
            {[
              { n: "Jordan M.", r: 5, t: "Best gear I own", c: "Fits true to size, ships fast, looks better in person." },
              { n: "Sasha K.", r: 4, t: "Solid daily wear", c: "Comfortable and clean. Slight color difference from photos." },
              { n: "Marcus T.", r: 5, t: "Can't beat it", c: "Held up through six months of training. Worth every dollar." },
            ].map((rev, i) => (
              <div key={i} className="border-b border-border pb-6 last:border-0">
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} className={cn("h-3.5 w-3.5", j < rev.r ? "fill-foreground text-foreground" : "text-muted-foreground")} />)}
                </div>
                <div className="font-medium mt-2">{rev.t}</div>
                <p className="text-sm text-muted-foreground mt-1">{rev.c}</p>
                <div className="text-xs text-muted-foreground mt-2">— {rev.n}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="mt-20">
        <h2 className="font-display text-3xl uppercase">You may also like</h2>
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {related.map((p: Product, i: number) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>
    </div>
  );
}
