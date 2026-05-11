import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Package, MapPin, Settings, User, LogOut, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatInr } from "@/lib/formatInr";
import { fetchMyOrders, type UserOrder } from "@/lib/api/orders";
import {
  fetchAddresses,
  createAddress,
  deleteAddress,
  type SavedAddress,
} from "@/lib/api/addresses";
import { updateProfile, changePassword } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "Profile — VOLT" }, { name: "description", content: "Your account." }],
  }),
  component: ProfilePage,
});

function formatOrderDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatMemberSince(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
}

function statusBadgeClass(status: string) {
  if (status === "cancelled") return "bg-destructive/15 text-destructive";
  if (status === "delivered" || status === "paid") return "bg-volt text-volt-foreground";
  return "bg-muted text-muted-foreground";
}

const PW_HINT =
  "Use at least 8 characters with uppercase, lowercase, and a number.";

const EMPTY_ADDR = {
  label: "",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

function ProfilePage() {
  const { user, logout, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<UserOrder[] | null>(null);

  const [nameDraft, setNameDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [infoSaving, setInfoSaving] = useState(false);

  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addrForm, setAddrForm] = useState({ ...EMPTY_ADDR });
  const [addrSaving, setAddrSaving] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user, navigate]);

  useEffect(() => {
    if (!token) return;
    void refreshUser();
  }, [token, refreshUser]);

  useEffect(() => {
    if (!user) return;
    setNameDraft(user.name);
    setPhoneDraft(user.phone ?? "");
  }, [user]);

  useEffect(() => {
    if (!user || !token) return;
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchMyOrders(token);
        if (!cancelled) setOrders(list);
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Could not load orders");
          setOrders([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      setAddressesLoading(true);
      try {
        const list = await fetchAddresses(token);
        if (!cancelled) setAddresses(list);
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Could not load addresses");
          setAddresses([]);
        }
      } finally {
        if (!cancelled) setAddressesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function reloadAddresses() {
    if (!token) return;
    const list = await fetchAddresses(token);
    setAddresses(list);
  }

  async function handleSaveInfo(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const name = nameDraft.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    setInfoSaving(true);
    try {
      await updateProfile(token, { name, phone: phoneDraft.trim() });
      await refreshUser();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setInfoSaving(false);
    }
  }

  async function handleAddAddress(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setAddrSaving(true);
    try {
      await createAddress(token, {
        label: addrForm.label,
        fullName: addrForm.fullName.trim(),
        phone: addrForm.phone.trim(),
        line1: addrForm.line1.trim(),
        line2: addrForm.line2.trim(),
        city: addrForm.city.trim(),
        state: addrForm.state.trim(),
        postalCode: addrForm.postalCode.trim(),
        country: addrForm.country.trim() || "India",
      });
      toast.success("Address saved");
      setAddrForm({ ...EMPTY_ADDR });
      setAddOpen(false);
      await reloadAddresses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add address");
    } finally {
      setAddrSaving(false);
    }
  }

  async function handleConfirmRemove() {
    if (!token || !removeId) return;
    setRemoveBusy(true);
    try {
      await deleteAddress(token, removeId);
      toast.success("Address removed");
      setRemoveId(null);
      await reloadAddresses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove address");
    } finally {
      setRemoveBusy(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (newPassword.length < 8 || !strong.test(newPassword)) {
      toast.error(PW_HINT);
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(token, { currentPassword, newPassword });
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPw(false);
      setShowNewPw(false);
      setShowConfirmPw(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setPasswordSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-10">
      <Breadcrumbs items={[{ label: "Account" }]} />
      <div className="mt-3 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-6xl uppercase">Hey, {user.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            logout();
            toast("Signed out");
            navigate({ to: "/" });
          }}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>

      <Tabs defaultValue="info" className="mt-8">
        <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-4">
          <TabsTrigger value="info">
            <User className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Info</span>
          </TabsTrigger>
          <TabsTrigger value="orders">
            <Package className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="addresses">
            <MapPin className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Addresses</span>
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <form
            onSubmit={handleSaveInfo}
            className="rounded-lg border border-border p-6 max-w-xl space-y-5"
          >
            <div className="font-display uppercase tracking-widest text-sm">Personal info</div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input id="profile-email" type="email" value={user.email} disabled readOnly />
                <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  type="tel"
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  autoComplete="tel"
                  placeholder="Optional"
                />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Member since
                </div>
                <div className="mt-1 font-medium">{formatMemberSince(user.createdAt)}</div>
              </div>
            </div>
            <Button type="submit" disabled={infoSaving} className="volt-primary-btn font-display uppercase tracking-widest">
              {infoSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          {orders === null ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-5 py-12 text-muted-foreground justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading orders…</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-lg border border-border border-dashed px-6 py-14 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
              <p className="mt-3 font-medium">No orders yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                When you complete a purchase, it will show up here.
              </p>
              <Button asChild className="mt-6 volt-primary-btn font-display uppercase tracking-widest">
                <Link to="/products">Shop now</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="rounded-lg border border-border bg-card overflow-hidden">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3 sm:px-5">
                    <div>
                      <div className="text-xs font-display uppercase tracking-widest text-muted-foreground">
                        Order
                      </div>
                      <div className="font-display text-lg uppercase mt-0.5">
                        {o.orderNumber || o.id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{formatOrderDate(o.createdAt)}</div>
                      <div className="mt-1 font-semibold">{formatInr(o.totalAmount)}</div>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-display uppercase tracking-widest px-2 py-1 rounded sm:ml-auto",
                        statusBadgeClass(o.status),
                      )}
                    >
                      {formatStatusLabel(o.status)}
                    </span>
                  </div>
                  <div className="px-4 py-4 sm:px-5 space-y-3">
                    <div className="text-xs font-display uppercase tracking-widest text-muted-foreground">
                      Items
                    </div>
                    <ul className="space-y-2 text-sm">
                      {o.items.map((it, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                        >
                          <span className="min-w-0">
                            <span className="font-medium">{it.title}</span>
                            <span className="text-muted-foreground"> × {it.quantity}</span>
                          </span>
                          <span className="shrink-0 tabular-nums">
                            {formatInr(it.unitPrice * it.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {o.shippingAddress && (
                      <div className="pt-2 text-xs text-muted-foreground border-t border-border">
                        <span className="font-display uppercase tracking-wider text-[10px]">
                          Ship to
                        </span>
                        <p className="mt-1">
                          {o.shippingAddress.fullName}
                          {o.shippingAddress.phone ? ` · ${o.shippingAddress.phone}` : ""}
                          <br />
                          {o.shippingAddress.line1}
                          {o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ""}
                          <br />
                          {[o.shippingAddress.city, o.shippingAddress.state, o.shippingAddress.postalCode]
                            .filter(Boolean)
                            .join(", ")}
                          {o.shippingAddress.country ? ` · ${o.shippingAddress.country}` : ""}
                        </p>
                      </div>
                    )}
                    {o.paymentSummary ? (
                      <p className="text-[11px] text-muted-foreground pt-1">
                        Payment: {o.paymentSummary}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          {addresses === null || addressesLoading ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-5 py-12 text-muted-foreground justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading addresses…</span>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {addresses.map((a) => (
                <div key={a._id} className="rounded-lg border border-border p-5">
                  {a.label ? (
                    <div className="text-xs font-display uppercase tracking-widest text-muted-foreground">
                      {a.label}
                    </div>
                  ) : null}
                  <div className="mt-2 font-medium">{a.fullName}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {a.phone && <span>{a.phone}</span>}
                    {a.phone && <br />}
                    {a.line1}
                    {a.line2 ? (
                      <>
                        <br />
                        {a.line2}
                      </>
                    ) : null}
                    <br />
                    {[a.city, a.state, a.postalCode].filter(Boolean).join(", ")}
                    {a.country ? (
                      <>
                        <br />
                        {a.country}
                      </>
                    ) : null}
                  </div>
                  <div className="mt-4">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setRemoveId(a._id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors min-h-32 flex flex-col items-center justify-center gap-2"
                onClick={() => setAddOpen(true)}
              >
                + Add new address
              </button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <form
            onSubmit={handleChangePassword}
            className="rounded-lg border border-border p-6 max-w-xl space-y-4"
          >
            <div className="font-display uppercase tracking-widest text-sm">Change password</div>
            <p className="text-sm text-muted-foreground">{PW_HINT}</p>
            <div className="space-y-2">
              <Label htmlFor="current-pw">Current password</Label>
              <div className="relative">
                <Input
                  id="current-pw"
                  type={showCurrentPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrentPw((s) => !s)}
                  aria-label={showCurrentPw ? "Hide current password" : "Show current password"}
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">New password</Label>
              <div className="relative">
                <Input
                  id="new-pw"
                  type={showNewPw ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPw((s) => !s)}
                  aria-label={showNewPw ? "Hide new password" : "Show new password"}
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pw">Confirm new password</Label>
              <div className="relative">
                <Input
                  id="confirm-pw"
                  type={showConfirmPw ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPw((s) => !s)}
                  aria-label={showConfirmPw ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={passwordSaving}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {passwordSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating…
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add address</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAddress} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="addr-label">Label (optional)</Label>
              <Input
                id="addr-label"
                value={addrForm.label}
                onChange={(e) => setAddrForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="Home, Work…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-name">Full name</Label>
              <Input
                id="addr-name"
                required
                value={addrForm.fullName}
                onChange={(e) => setAddrForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-phone">Phone</Label>
              <Input
                id="addr-phone"
                required
                type="tel"
                value={addrForm.phone}
                onChange={(e) => setAddrForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-line1">Address line 1</Label>
              <Input
                id="addr-line1"
                required
                value={addrForm.line1}
                onChange={(e) => setAddrForm((f) => ({ ...f, line1: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-line2">Address line 2 (optional)</Label>
              <Textarea
                id="addr-line2"
                rows={2}
                value={addrForm.line2}
                onChange={(e) => setAddrForm((f) => ({ ...f, line2: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="addr-city">City</Label>
                <Input
                  id="addr-city"
                  required
                  value={addrForm.city}
                  onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-state">State</Label>
                <Input
                  id="addr-state"
                  required
                  value={addrForm.state}
                  onChange={(e) => setAddrForm((f) => ({ ...f, state: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="addr-postal">Postal code</Label>
                <Input
                  id="addr-postal"
                  required
                  value={addrForm.postalCode}
                  onChange={(e) => setAddrForm((f) => ({ ...f, postalCode: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-country">Country</Label>
                <Input
                  id="addr-country"
                  value={addrForm.country}
                  onChange={(e) => setAddrForm((f) => ({ ...f, country: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addrSaving} className="volt-primary-btn font-display uppercase tracking-widest">
                {addrSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save address"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeId !== null} onOpenChange={(open) => !open && setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this address?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the saved address from your account. You can add it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeBusy}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={removeBusy}
              onClick={() => void handleConfirmRemove()}
            >
              {removeBusy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Removing…
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
