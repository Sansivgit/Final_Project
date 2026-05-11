import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/data/products";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { loginSearch, safeRedirectPath } from "@/lib/authRedirect";
import { cn } from "@/lib/utils";
import { orderedStandardSizes, resolveStoredSize } from "@/lib/sizes";
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

type PayStep = "product" | "address";

type Props = {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductQuickViewDialog({ product, open, onOpenChange }: Props) {
  const { user, token } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();

  const [payStep, setPayStep] = useState<PayStep>("product");
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("");
  const [colorName, setColorName] = useState(product.colors[0]?.name ?? "Standard");

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [selectedAddrId, setSelectedAddrId] = useState<string>("");
  /** When true, show the "new address" form (forced on if user has no saved addresses). */
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

  const displaySizes = useMemo(() => orderedStandardSizes(product.sizes), [product.sizes]);

  useEffect(() => {
    if (!open) return;
    setPayStep("product");
    setQty(1);
    setColorName(product.colors[0]?.name ?? "Standard");
    const shown = orderedStandardSizes(product.sizes);
    const first = shown[0];
    setSize(
      first ? (resolveStoredSize(first, product.sizes) ?? first) : (product.sizes[0] ?? ""),
    );
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
  }, [open, product.id]);

  useEffect(() => {
    if (!open || payStep !== "address" || !token) return;
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
  }, [open, payStep, token]);

  useEffect(() => {
    if (payStep !== "address" || addrLoading) return;
    if (addresses.length === 0) setExpandNewAddress(true);
  }, [payStep, addrLoading, addresses.length]);

  const goLogin = () => {
    const r = `${window.location.pathname}${window.location.search}`;
    navigate({ to: "/login", search: loginSearch(safeRedirectPath(r)) });
  };

  const totalInr = product.price * qty;

  const onAddToCart = () => {
    if (!user) {
      toast.info("Sign in to add items to your bag");
      goLogin();
      return;
    }
    if (!size && product.sizes.length > 0) {
      toast.error("Select a size");
      return;
    }
    const effectiveSize = size || product.sizes[0];
    if (!effectiveSize) {
      toast.error("This product has no sizes configured");
      return;
    }
    add(product, effectiveSize, colorName, qty);
    toast.success("Added to bag", { description: `${product.name} · ${effectiveSize}` });
    onOpenChange(false);
  };

  const onPayNowClick = () => {
    if (!user || !token) {
      toast.info("Sign in to checkout");
      goLogin();
      return;
    }
    if (!size && product.sizes.length > 0) {
      toast.error("Select a size");
      return;
    }
    const effectiveSize = size || product.sizes[0];
    if (!effectiveSize && product.sizes.length > 0) {
      toast.error("Select a size");
      return;
    }
    setPayStep("address");
  };

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

    setPaying(true);
    try {
      const receipt = `qv_${product.id}`.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 40);
      const order = await requestAuthJson<RazorpayOrderPayload>("/api/payments/create-order", token, {
        method: "POST",
        body: {
          amount: totalInr,
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
        description: product.name,
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
                  items: [
                    {
                      productId: product.id,
                      title: product.name,
                      quantity: qty,
                      unitPrice: product.price,
                    },
                  ],
                  totalAmount: totalInr,
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
                  clearCart: false,
                },
              });
              toast.success("Payment successful — order placed");
              onOpenChange(false);
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
      <DialogContent className="left-[50%] top-4 flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-[960px] translate-x-[-50%] translate-y-0 flex-col gap-0 overflow-hidden border bg-background p-0 shadow-lg duration-200 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%] sm:top-8 sm:rounded-lg">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-6 sm:px-8 sm:py-8 [scrollbar-gutter:stable]">
            <DialogHeader className="text-left space-y-1 pr-8">
              <DialogTitle className="font-display text-2xl uppercase">
                {payStep === "product" ? "Quick view" : "Delivery & payment"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Product details and checkout options for {product.name}
              </DialogDescription>
            </DialogHeader>

            {payStep === "product" ? (
              <div className="mt-6 grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="aspect-[4/5] overflow-hidden rounded-lg bg-muted">
                    <img
                      src={product.images[0]}
                      alt=""
                      draggable={false}
                      className="h-full w-full select-none object-cover pointer-events-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {product.brand} · {product.type}
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl uppercase leading-tight">{product.name}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold">{formatInr(product.price)}</span>
                    {product.compareAt != null && (
                      <span className="text-muted-foreground line-through text-sm">{formatInr(product.compareAt)}</span>
                    )}
                  </div>

                  {product.colors.length > 0 && (
                    <div>
                      <Label className="text-xs uppercase tracking-widest font-display">Color</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {product.colors.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setColorName(c.name)}
                            className={cn(
                              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
                              colorName === c.name
                                ? "border-foreground bg-muted"
                                : "border-border hover:border-muted-foreground",
                            )}
                          >
                            <span
                              className="h-4 w-4 rounded-full border border-border"
                              style={{ backgroundColor: c.hex }}
                            />
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {displaySizes.length > 0 || product.sizes.length > 0 ? (
                    <div>
                      <Label className="text-xs uppercase tracking-widest font-display">Size</Label>
                      <div className="mt-2 grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {(displaySizes.length > 0 ? displaySizes : product.sizes).map((canon) => {
                          const stored =
                            displaySizes.length > 0
                              ? resolveStoredSize(String(canon), product.sizes) ?? String(canon)
                              : String(canon);
                          const label = displaySizes.length > 0 ? canon : String(canon);
                          return (
                            <button
                              key={`${label}-${stored}`}
                              type="button"
                              onClick={() => setSize(stored)}
                              className={cn(
                                "h-11 rounded border text-sm font-medium transition-colors",
                                size === stored
                                  ? "volt-primary-btn border-neutral-950 dark:border-neutral-50"
                                  : "border-border hover:border-muted-foreground",
                              )}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3">
                    <Label className="text-xs uppercase tracking-widest font-display shrink-0">Qty</Label>
                    <div className="flex items-center border border-border rounded">
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="h-10 w-10 flex items-center justify-center"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty((q) => q + 1)}
                        className="h-10 w-10 flex items-center justify-center"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onAddToCart} className="w-full sm:flex-1 font-display uppercase tracking-widest">
                      Add to cart
                    </Button>
                    <Button
                      type="button"
                      onClick={onPayNowClick}
                      disabled={paying}
                      className="w-full sm:flex-1 volt-primary-btn font-display uppercase tracking-widest"
                    >
                      Pay now · {formatInr(totalInr)}
                    </Button>
                  </DialogFooter>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <Button type="button" variant="ghost" size="sm" className="-mt-2 px-0" onClick={() => setPayStep("product")}>
                  ← Back to product
                </Button>

                <p className="text-sm text-muted-foreground">
                  Choose where we should ship this order. Amount due: <strong>{formatInr(totalInr)}</strong> (INR).
                </p>

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
                          <RadioGroupItem value={String(a._id)} id={`addr-${a._id}`} className="mt-1" />
                          <div className="flex-1 text-sm">
                            <div className="font-medium">{a.fullName}</div>
                            <div className="text-muted-foreground mt-1">
                              {a.line1}
                              {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.postalCode},{" "}
                              {a.country ?? "India"}
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
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandNewAddress((v) => !v)}
                    >
                      {expandNewAddress ? "Hide new address form" : "Add another address"}
                    </Button>
                  </div>
                )}

                {expandNewAddress && (
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <div className="font-display text-sm uppercase tracking-widest">New address</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="qv-label">Label (optional)</Label>
                        <Input
                          id="qv-label"
                          value={newAddr.label}
                          onChange={(e) => setNewAddr((s) => ({ ...s, label: e.target.value }))}
                          placeholder="Home, Office…"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="qv-name">Full name</Label>
                        <Input
                          id="qv-name"
                          value={newAddr.fullName}
                          onChange={(e) => setNewAddr((s) => ({ ...s, fullName: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="qv-phone">Phone</Label>
                        <Input
                          id="qv-phone"
                          value={newAddr.phone}
                          onChange={(e) => setNewAddr((s) => ({ ...s, phone: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="qv-line1">Address line 1</Label>
                        <Input
                          id="qv-line1"
                          value={newAddr.line1}
                          onChange={(e) => setNewAddr((s) => ({ ...s, line1: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="qv-line2">Address line 2 (optional)</Label>
                        <Textarea
                          id="qv-line2"
                          value={newAddr.line2}
                          onChange={(e) => setNewAddr((s) => ({ ...s, line2: e.target.value }))}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="qv-city">City</Label>
                        <Input
                          id="qv-city"
                          value={newAddr.city}
                          onChange={(e) => setNewAddr((s) => ({ ...s, city: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="qv-state">State</Label>
                        <Input
                          id="qv-state"
                          value={newAddr.state}
                          onChange={(e) => setNewAddr((s) => ({ ...s, state: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="qv-postal">Postal code</Label>
                        <Input
                          id="qv-postal"
                          value={newAddr.postalCode}
                          onChange={(e) => setNewAddr((s) => ({ ...s, postalCode: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="qv-country">Country</Label>
                        <Input
                          id="qv-country"
                          value={newAddr.country}
                          onChange={(e) => setNewAddr((s) => ({ ...s, country: e.target.value }))}
                        />
                      </div>
                    </div>
                    <Button type="button" variant="secondary" onClick={submitNewAddress} disabled={savingAddr}>
                      {savingAddr ? "Saving…" : "Save address"}
                    </Button>
                  </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
                  <Button
                    type="button"
                    className="w-full sm:w-auto volt-primary-btn font-display uppercase tracking-widest"
                    disabled={paying || !selectedAddrId}
                    onClick={() => void startRazorpay()}
                  >
                    {paying ? "Opening payment…" : `Proceed to pay ${formatInr(totalInr)}`}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </div>
      </DialogContent>
    </Dialog>
  );
}
