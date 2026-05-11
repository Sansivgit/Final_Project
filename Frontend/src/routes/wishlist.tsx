import { createFileRoute, Link, Navigate, useRouterState } from "@tanstack/react-router";
import { Heart, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { loginSearch, safeRedirectPath } from "@/lib/authRedirect";
import { formatInr } from "@/lib/formatInr";
import { orderedStandardSizes, resolveStoredSize } from "@/lib/sizes";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — VOLT" }, { name: "description", content: "Saved items in your wishlist." }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user } = useAuth();
  const loc = useRouterState({ select: (s) => s.location });
  const { items, remove } = useWishlist();
  const { add } = useCart();

  if (!user) {
    const back = safeRedirectPath(`${loc.pathname}${loc.search}`);
    return <Navigate to="/login" search={loginSearch(back)} replace />;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10">
        <Breadcrumbs items={[{ label: "Wishlist" }]} />
        <EmptyState icon={Heart} title="No favorites yet" description="Tap the heart on any product to save it for later." ctaLabel="Browse products" ctaTo="/products" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Wishlist" }]} />
      <h1 className="font-display text-4xl md:text-6xl uppercase mt-3">Wishlist</h1>
      <p className="text-sm text-muted-foreground mt-2">{items.length} saved</p>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {items.map((p) => (
          <div key={p.id} className="group">
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-muted">
              <Link to="/products/$slug" params={{ slug: p.slug }}>
                <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </Link>
              <button onClick={() => { remove(p.id); toast("Removed from wishlist"); }}
                className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:bg-background"
                aria-label="Remove">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.type}</div>
              <Link to="/products/$slug" params={{ slug: p.slug }} className="font-medium hover:underline">{p.name}</Link>
              <div className="text-sm font-semibold mt-1">{formatInr(p.price)}</div>
              <Button
                onClick={() => {
                  const sizesShown = orderedStandardSizes(p.sizes);
                  const stored =
                    sizesShown.length > 0 ? resolveStoredSize(sizesShown[0], p.sizes) : undefined;
                  const sz = stored ?? p.sizes[0];
                  const color = p.colors[0]?.name ?? "Standard";
                  if (!sz) {
                    toast.error("Choose options on the product page");
                    return;
                  }
                  add(p, sz, color, 1);
                  toast.success("Added to bag");
                }}
                size="sm" className="mt-3 w-full volt-primary-btn font-display uppercase tracking-widest">
                <ShoppingBag className="h-3.5 w-3.5 mr-1.5" /> Move to bag
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
