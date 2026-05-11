import { createFileRoute, Link, Navigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { CartCheckoutDialog } from "@/components/CartCheckoutDialog";
import { loginSearch, safeRedirectPath } from "@/lib/authRedirect";
import { formatInr } from "@/lib/formatInr";

/** Free domestic shipping threshold (INR). */
const FREE_SHIPPING_SUBTOTAL_INR = 8500;
/** Flat shipping when below threshold (INR). */
const SHIPPING_FLAT_INR = 99;

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Bag — VOLT" }, { name: "description", content: "Review your bag and check out." }] }),
  component: CartPage,
});

function CartPage() {
  const { user } = useAuth();
  const loc = useRouterState({ select: (s) => s.location });
  const { items, remove, setQty, subtotal } = useCart();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (!user) {
    const back = safeRedirectPath(`${loc.pathname}${loc.search}`);
    return <Navigate to="/login" search={loginSearch(back)} replace />;
  }

  const apply = () => {
    if (coupon.trim().toUpperCase() === "VOLT10") {
      setDiscount(0.1);
      toast.success("Promo applied — 10% off");
    } else {
      setDiscount(0);
      toast.error("Invalid promo code");
    }
  };

  const shipping = subtotal > FREE_SHIPPING_SUBTOTAL_INR || subtotal === 0 ? 0 : SHIPPING_FLAT_INR;
  const discountAmt = subtotal * discount;
  const total = subtotal - discountAmt + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10">
        <Breadcrumbs items={[{ label: "Bag" }]} />
        <EmptyState icon={ShoppingBag} title="Your bag is empty" description="Add some heat from the latest drop." ctaLabel="Start shopping" ctaTo="/products" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Bag" }]} />
      <h1 className="font-display text-4xl md:text-6xl uppercase mt-3">Your bag</h1>

      <div className="mt-8 grid lg:grid-cols-[1fr_380px] gap-10">
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.id} className="flex gap-4 p-4 border border-border rounded-lg">
              <Link to="/products/$slug" params={{ slug: it.product.slug }} className="shrink-0">
                <img src={it.product.images[0]} alt={it.product.name} className="w-24 h-32 sm:w-28 sm:h-36 rounded object-cover" />
              </Link>
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{it.product.type}</div>
                    <Link to="/products/$slug" params={{ slug: it.product.slug }} className="font-display text-lg uppercase hover:underline">
                      {it.product.name}
                    </Link>
                    <div className="text-xs text-muted-foreground mt-1">Size {it.size}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatInr(it.product.price * it.qty)}</div>
                    <div className="text-xs text-muted-foreground">{formatInr(it.product.price)} each</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-3">
                  <div className="flex items-center border border-border rounded">
                    <button onClick={() => setQty(it.id, it.qty - 1)} className="h-9 w-9 flex items-center justify-center" aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                    <div className="w-8 text-center text-sm">{it.qty}</div>
                    <button onClick={() => setQty(it.id, it.qty + 1)} className="h-9 w-9 flex items-center justify-center" aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <button onClick={() => { remove(it.id); toast("Removed from bag"); }} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-24 h-fit rounded-lg border border-border p-6 bg-card">
          <h2 className="font-display text-xl uppercase">Summary</h2>
          <div className="mt-5 space-y-3 text-sm">
            <Row label="Subtotal" value={formatInr(subtotal)} />
            <Row label="Shipping" value={shipping === 0 ? "FREE" : formatInr(shipping)} />
            {discount > 0 && (
              <Row label={`Promo (${(discount * 100).toFixed(0)}%)`} value={`-${formatInr(discountAmt)}`} />
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Promo code (try VOLT10)"
                className="h-10 w-full rounded border border-border bg-transparent pl-9 pr-3 text-sm" />
            </div>
            <Button variant="outline" onClick={apply}>Apply</Button>
          </div>
          <div className="mt-5 pt-5 border-t border-border flex items-center justify-between">
            <div className="font-display uppercase text-sm tracking-widest">Total</div>
            <div className="text-2xl font-bold">{formatInr(total)}</div>
          </div>
          <Button
            type="button"
            className="mt-5 w-full h-12 volt-primary-btn font-display uppercase tracking-widest"
            onClick={() => setCheckoutOpen(true)}
          >
            Checkout <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <CartCheckoutDialog
            open={checkoutOpen}
            onOpenChange={setCheckoutOpen}
            subtotal={subtotal}
            discountAmt={discountAmt}
            shipping={shipping}
            total={total}
            items={items}
          />
          <Link to="/products" className="block text-center text-xs text-muted-foreground mt-4 underline-offset-4 hover:underline">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
