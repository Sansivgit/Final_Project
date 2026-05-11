import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Truck, Shield, RotateCcw, Zap } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { getProducts } from "@/lib/api/products";
import { categories, type Product } from "@/data/products";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VOLT — Athletic Streetwear, Engineered in Motion" },
      { name: "description", content: "Discover premium athletic streetwear. Shop new drops, trending shoes, hoodies, and more." },
      { property: "og:title", content: "VOLT — Athletic Streetwear" },
      { property: "og:description", content: "Built for athletes. Worn by everyone." },
    ],
  }),
  component: Index,
});

function Index() {
  const [trending, setTrending] = useState<Product[] | null>(null);

  useEffect(() => {
    getProducts({ sort: "newest" }).then((p) => setTrending(p.slice(0, 8)));
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative h-[88vh] min-h-[600px] w-full overflow-hidden bg-neutral-950 text-neutral-50">
        <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-4 md:px-6 pb-20 md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-volt text-volt-foreground px-3 py-1 rounded-full text-[10px] font-display uppercase tracking-widest mb-6">
              <Zap className="h-3 w-3" /> New Drop · Spring '26
            </div>
            <h1 className="display-hero text-6xl sm:text-7xl md:text-8xl lg:text-9xl">
              Move<br />Like<br />Lightning<span className="text-volt">.</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-neutral-50/80 max-w-md">
              The Phantom Runner 1 is here. Featherlight. Volt-fast. Built for the relentless.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-volt text-volt-foreground hover:brightness-110 font-display uppercase tracking-widest h-12 px-7">
                <Link to="/products" search={{ sort: "newest" } as Record<string, unknown>}>Shop the drop <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-neutral-50 text-neutral-50 bg-transparent hover:bg-neutral-50 hover:text-neutral-950 font-display uppercase tracking-widest h-12 px-7">
                <Link to="/products">Explore all</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORY TILES */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs font-display uppercase tracking-widest text-muted-foreground">Shop by</div>
            <h2 className="font-display text-3xl md:text-5xl uppercase mt-1">Category</h2>
          </div>
          <Link to="/products" className="text-sm font-medium underline-offset-4 hover:underline hidden md:inline-flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((c) => (
            <Link
              key={c.name}
              to="/products"
              search={{ category: c.name } as any}
              className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-muted"
            >
              <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-4 bottom-4">
                <div className="font-display text-2xl md:text-3xl uppercase text-white">{c.name}</div>
                <div className="text-xs text-white/80 mt-1 flex items-center gap-1">Shop now <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" /></div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TRENDING */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 pb-16 md:pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs font-display uppercase tracking-widest text-muted-foreground">This Week</div>
            <h2 className="font-display text-3xl md:text-5xl uppercase mt-1">Trending</h2>
          </div>
          <Link to="/products" className="text-sm font-medium underline-offset-4 hover:underline hidden md:inline-flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {trending
            ? trending.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
            : Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </section>

      {/* EDITORIAL SPLIT */}
      <section className="bg-neutral-950 text-neutral-50">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs font-display uppercase tracking-widest text-volt">Manifesto</div>
            <h2 className="display-hero text-5xl md:text-7xl mt-3">No off<br />days<span className="text-volt">.</span></h2>
            <p className="mt-6 text-neutral-50/70 max-w-md">
              Every stitch, every sole, every seam is engineered for the one thing that matters: forward.
              We don't make clothes for the sidelines.
            </p>
            <Button asChild className="mt-8 bg-volt text-volt-foreground hover:brightness-110 font-display uppercase tracking-widest h-12 px-7">
              <Link to="/products">Shop the movement</Link>
            </Button>
          </div>
          <div className="aspect-[4/5] rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80"
              alt="Athlete training"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* PROMISES */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { i: Truck, t: "Free Shipping", d: "On orders over ₹8,500" },
            { i: RotateCcw, t: "30-Day Returns", d: "No questions asked" },
            { i: Shield, t: "2-Yr Warranty", d: "On every shoe" },
            { i: Zap, t: "Member Perks", d: "Early access drops" },
          ].map((x) => (
            <div key={x.t} className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-neutral-950 text-neutral-50 ring-1 ring-white/15 flex items-center justify-center shrink-0 dark:bg-neutral-900 dark:ring-white/10">
                <x.i className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display uppercase text-sm tracking-wider">{x.t}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{x.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
