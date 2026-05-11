import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { CartItem } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { fetchAddresses, createAddress, type SavedAddress } from "@/lib/api/addresses";
import { requestAuthJson } from "@/lib/api";
import { formatInr } from "@/lib/formatInr";
import { publicEnv } from "../../env.public";
import {
  loadRazorpayScript,
  type RazorpayOrderPayload,
  type RazorpayPaymentSuccess,
} from "@/lib/razorpayCheckout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type LineItem = {
  productId?: string;
  title: string;
  quantity: number;
  unitPrice: number;
};

function buildOrderLines(
  cartItems: CartItem[],
  subtotal: number,
  discountAmt: number,
  shipping: number,
  total: number,
): { lines: LineItem[]; totalAmount: number } {
  const ratio =
    subtotal > 0 && discountAmt > 0 ? (subtotal - discountAmt) / subtotal : 1;

  const lines: LineItem[] = cartItems.map((it) => ({
    productId: it.product.id,
    title: it.product.name,
    quantity: it.qty,
    unitPrice: Math.round(it.product.price * ratio * 100) / 100,
  }));

  let sum = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  if (shipping > 0) {
    lines.push({ title: "Shipping", quantity: 1, unitPrice: shipping });
    sum += shipping;
  }

  const drift = Math.round((total - sum) * 100) / 100;
  if (Math.abs(drift) > 0.001 && lines.length > 0) {
    const idx = lines.findIndex((l) => l.title !== "Shipping");
    const i = idx >= 0 ? idx : 0;
    const line = lines[i];
    line.unitPrice = Math.round((line.unitPrice + drift / line.quantity) * 100) / 100;
  }

  return { lines, totalAmount: total };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  discountAmt: number;
  shipping: number;
  total: number;
  items: CartItem[];
};

export function CartCheckoutDialog({
  open,
  onOpenChange,
  subtotal,
  discountAmt,
  shipping,
  total,
  items,
}: Props) {
  const { user, token } = useAuth();
  const { clear } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [selectedAddrId, setSelectedAddrId] = useState("");
  const [expandNewAddress, setExpandNewAddress] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const [paying, setPaying] = useState(false);

  const [newAddr, setNewAddr] = useState({
    label: "",
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  useEffect(() => {
    if (!open) return;
    setAddresses([]);
    setSelectedAddrId("");
    setExpandNewAddress(false);
    setNewAddr({
      label: "",
      fullName: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
    });
  }, [open]);

  useEffect(() => {
    if (!open || !token) return;
    let cancelled = false;
    void (async () => {
      setAddrLoading(true);
      try {
        const list = await fetchAddresses(token);
        if (cancelled) return;
        setAddresses(list);
        setSelectedAddrId((prev) => {
          if (list.length === 0) return "";
          if (prev && list.some((a) => String(a._id) === prev)) return prev;
          return String(list[0]._id);
        });
      } catch {
        if (!cancelled) toast.error("Could not load saved addresses");
      } finally {
        if (!cancelled) setAddrLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, token]);

  useEffect(() => {
    if (!open || addrLoading) return;
    if (addresses.length === 0) setExpandNewAddress(true);
  }, [open, addrLoading, addresses.length]);

  const submitNewAddress = async () => {
    if (!token) return;
    setSavingAddr(true);
    try {
      const created = await createAddress(token, {
        label: newAddr.label.trim(),
        fullName: newAddr.fullName.trim(),
        phone: newAddr.phone.trim(),
        line1: newAddr.line1.trim(),
        line2: newAddr.line2.trim(),
        city: newAddr.city.trim(),
        state: newAddr.state.trim(),
        postalCode: newAddr.postalCode.trim(),
        country: newAddr.country.trim() || "India",
      });
      setAddresses((prev) => [...prev, created]);
      setSelectedAddrId(String(created._id));
      setExpandNewAddress(false);
      setNewAddr({
        label: "",
        fullName: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
      });
      toast.success("Address saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save address");
    } finally {
      setSavingAddr(false);
    }
  };

  const startRazorpay = async () => {
    if (!token || !user) return;
    const addr = addresses.find((a) => String(a._id) === selectedAddrId);
    if (!addr) {
      toast.error("Select a delivery address");
      return;
    }

    const razorpayKey = publicEnv.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey || typeof razorpayKey !== "string") {
      toast.error("Razorpay is not configured (missing VITE_RAZORPAY_KEY_ID).");
      return;
    }

    const { lines, totalAmount } = buildOrderLines(
      items,
      subtotal,
      discountAmt,
      shipping,
      total,
    );

    setPaying(true);
    try {
      const receipt = `cart_${Date.now()}`.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 40);
      const order = await requestAuthJson<RazorpayOrderPayload>("/api/payments/create-order", token, {
        method: "POST",
        body: {
          amount: totalAmount,
          currency: "INR",
          receipt: receipt || `rcpt_${Date.now()}`,
        },
      });

      await loadRazorpayScript();
      const Rzp = window.Razorpay;
      if (!Rzp) throw new Error("Razorpay failed to load");

      const options: Record<string, unknown> = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: "VOLT",
        description: `Order · ${items.length} item(s)`,
        prefill: {
          name: user.name,
          email: user.email,
          contact: addr.phone,
        },
        handler: (response: RazorpayPaymentSuccess) => {
          void (async () => {
            try {
              await requestAuthJson("/api/payments/verify", token, {
                method: "POST",
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
              });

              await requestAuthJson("/api/orders/checkout", token, {
                method: "POST",
                body: {
                  items: lines.map((l) => ({
                    ...(l.productId ? { productId: l.productId } : {}),
                    title: l.title,
                    quantity: l.quantity,
                    unitPrice: l.unitPrice,
                  })),
                  totalAmount,
                  shippingAddress: {
                    fullName: addr.fullName,
                    phone: addr.phone,
                    line1: addr.line1,
                    line2: addr.line2 || "",
                    city: addr.city,
                    state: addr.state,
                    postalCode: addr.postalCode,
                    country: addr.country || "India",
                  },
                  paymentSummary: `razorpay:${response.razorpay_payment_id}`,
                  clearCart: true,
                },
              });

              toast.success("Payment successful — order placed");
              clear();
              onOpenChange(false);
              navigate({ to: "/profile" });
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Checkout failed");
            } finally {
              setPaying(false);
            }
          })();
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new Rzp(options);
      onOpenChange(false);
      window.setTimeout(() => {
        try {
          rzp.open();
        } catch (openErr) {
          toast.error(openErr instanceof Error ? openErr.message : "Could not open payment");
          setPaying(false);
        }
      }, 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start payment");
      setPaying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase">Delivery & payment</DialogTitle>
          <DialogDescription>
            Choose a delivery address. Pay {formatInr(total)} securely with Razorpay.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {addrLoading ? (
            <div className="text-sm text-muted-foreground">Loading addresses…</div>
          ) : addresses.length > 0 ? (
            <div className="space-y-3">
              <Label>Saved addresses</Label>
              <RadioGroup value={selectedAddrId} onValueChange={setSelectedAddrId}>
                {addresses.map((a) => (
                  <label
                    key={String(a._id)}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-foreground"
                  >
                    <RadioGroupItem value={String(a._id)} id={`cart-addr-${a._id}`} className="mt-1" />
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{a.fullName}</div>
                      <div className="text-muted-foreground mt-1">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.postalCode}, {a.country ?? "India"}
                      </div>
                      <div className="text-muted-foreground text-xs mt-1">Phone: {a.phone}</div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No saved addresses yet. Add one below.</p>
          )}

          {addresses.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={() => setExpandNewAddress((v) => !v)}>
              {expandNewAddress ? "Hide new address form" : "Add another address"}
            </Button>
          )}

          {expandNewAddress && (
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="font-display text-sm uppercase tracking-widest">New address</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="cart-label">Label (optional)</Label>
                  <Input
                    id="cart-label"
                    value={newAddr.label}
                    onChange={(e) => setNewAddr((s) => ({ ...s, label: e.target.value }))}
                    placeholder="Home, Office…"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cart-name">Full name</Label>
                  <Input
                    id="cart-name"
                    value={newAddr.fullName}
                    onChange={(e) => setNewAddr((s) => ({ ...s, fullName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cart-phone">Phone</Label>
                  <Input
                    id="cart-phone"
                    type="tel"
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr((s) => ({ ...s, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="cart-line1">Address line 1</Label>
                  <Input
                    id="cart-line1"
                    value={newAddr.line1}
                    onChange={(e) => setNewAddr((s) => ({ ...s, line1: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="cart-line2">Address line 2 (optional)</Label>
                  <Textarea
                    id="cart-line2"
                    value={newAddr.line2}
                    onChange={(e) => setNewAddr((s) => ({ ...s, line2: e.target.value }))}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cart-city">City</Label>
                  <Input id="cart-city" value={newAddr.city} onChange={(e) => setNewAddr((s) => ({ ...s, city: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cart-state">State</Label>
                  <Input id="cart-state" value={newAddr.state} onChange={(e) => setNewAddr((s) => ({ ...s, state: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cart-postal">Postal code</Label>
                  <Input
                    id="cart-postal"
                    value={newAddr.postalCode}
                    onChange={(e) => setNewAddr((s) => ({ ...s, postalCode: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cart-country">Country</Label>
                  <Input id="cart-country" value={newAddr.country} onChange={(e) => setNewAddr((s) => ({ ...s, country: e.target.value }))} />
                </div>
              </div>
              <Button type="button" variant="secondary" onClick={() => void submitNewAddress()} disabled={savingAddr}>
                {savingAddr ? "Saving…" : "Save address"}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="volt-primary-btn font-display uppercase tracking-widest"
            disabled={paying || !selectedAddrId}
            onClick={() => void startRazorpay()}
          >
            {paying ? "Opening payment…" : `Pay ${formatInr(total)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
