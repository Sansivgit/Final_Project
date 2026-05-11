import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Product } from "@/data/products";
import { ProductQuickViewDialog } from "@/components/ProductQuickViewDialog";
import { cn } from "@/lib/utils";
import { orderedStandardSizes, resolveStoredSize } from "@/lib/sizes";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { loginSearch, safeRedirectPath } from "@/lib/authRedirect";
import { formatInr } from "@/lib/formatInr";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const [quickOpen, setQuickOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { has, toggle } = useWishlist();
  const { add } = useCart();
  const wished = has(product.id);

  const goLogin = () => {
    const r = `${window.location.pathname}${window.location.search}`;
    navigate({ to: "/login", search: loginSearch(safeRedirectPath(r)) });
  };

  const onWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info("Sign in to save favorites");
      goLogin();
      return;
    }
    toggle(product);
    toast(wished ? "Removed from wishlist" : "Added to wishlist", { description: product.name });
  };

  const onQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info("Sign in to add items to your bag");
      goLogin();
      return;
    }
    const sizesShown = orderedStandardSizes(product.sizes);
    const storedPick =
      sizesShown.length > 0 ? resolveStoredSize(sizesShown[0], product.sizes) : undefined;
    const size = storedPick ?? product.sizes[0];
    const color = product.colors[0]?.name ?? "Standard";
    if (!size) {
      toast.error("Open product to choose options", { description: product.name });
      return;
    }
    add(product, size, color, 1);
    toast.success("Added to bag", { description: `${product.name} · ${size}` });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
      >
        <div className="relative group">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              draggable={false}
              className="product-card-img h-full w-full object-cover pointer-events-none select-none"
            />
          </div>
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <button
              type="button"
              onClick={onQuickAdd}
              aria-label="Add to cart"
              className="h-9 w-9 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onWish}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              className="h-9 w-9 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
            >
              <Heart className={cn("h-4 w-4 transition-colors", wished && "fill-foreground text-foreground")} />
            </button>
          </div>
          <button
            type="button"
            className="absolute inset-x-3 bottom-3 z-10 translate-y-12 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickOpen(true);
            }}
          >
            <span className="pointer-events-none block bg-neutral-950 py-2.5 text-center text-xs font-display uppercase tracking-widest text-neutral-50 rounded-md dark:bg-neutral-900">
              Quick view
            </span>
          </button>
        </div>
        <Link to="/products/$slug" params={{ slug: product.slug }} className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{product.type}</div>
            <h3 className="text-sm font-medium truncate">{product.name}</h3>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-semibold">{formatInr(product.price)}</div>
            {product.compareAt && (
              <div className="text-xs text-muted-foreground line-through">{formatInr(product.compareAt)}</div>
            )}
          </div>
        </Link>
      </motion.div>
      <ProductQuickViewDialog product={product} open={quickOpen} onOpenChange={setQuickOpen} />
    </>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] rounded-lg bg-muted" />
      <div className="mt-3 h-3 w-1/3 bg-muted rounded" />
      <div className="mt-2 h-4 w-2/3 bg-muted rounded" />
    </div>
  );
}
