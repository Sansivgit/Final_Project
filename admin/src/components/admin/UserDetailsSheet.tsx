import { useMemo } from "react";
import { CreditCard, MapPin, Package, TrendingUp } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdminCustomer } from "@/context/AdminContext";
import type { CustomerAdminDetails } from "@/services/api";
import { getMockCustomerDetails } from "@/data/customerMocks";
import { formatInr } from "@/lib/formatInr";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function UserDetailsSheet({
  user,
  open,
  onOpenChange,
}: {
  user: AdminCustomer | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const show: CustomerAdminDetails | null = useMemo(() => {
    if (!open || !user) return null;
    return getMockCustomerDetails(user);
  }, [open, user]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="border-b px-6 py-5">
          <div className="flex items-start gap-4">
            <CustomerAvatar user={user} size="lg" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl uppercase tracking-tight">{user?.name ?? "User"}</h2>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
              {user?.phone ? (
                <p className="truncate text-sm text-muted-foreground">{user.phone}</p>
              ) : null}
              {user && (
                <Badge
                  variant={user.isBlocked ? "destructive" : "outline"}
                  className={
                    user.isBlocked ? "" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  }
                >
                  {user.isBlocked ? "Blocked" : "Active"}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {show && (
            <div className="space-y-8">
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment summary
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border bg-muted/40 p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-wide">Lifetime spend</span>
                    </div>
                    <p className="mt-2 font-display text-2xl tabular-nums">{formatInr(show.paymentSummary.lifetimeTotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="rounded-xl border bg-muted/40 p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-wide">Last payment</span>
                    </div>
                    <p className="mt-2 text-sm font-medium">
                      {show.paymentSummary.lastPaymentLabel ?? "—"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Shipping addresses
                </h3>
                {show.shippingAddresses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {show.shippingAddresses.map((a, i) => (
                      <li key={`${a.line1}-${i}`} className="rounded-xl border bg-card p-4 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div>
                            {a.fullName ? <div className="font-medium">{a.fullName}</div> : null}
                            <div className="text-muted-foreground">
                              {[a.line1, a.line2].filter(Boolean).join(", ")}
                              <br />
                              {[a.city, a.postalCode].filter(Boolean).join(", ")}
                              {a.country ? ` · ${a.country}` : ""}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recently purchased
                </h3>
                {show.recentlyPurchased.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No purchases recorded.</p>
                ) : (
                  <ul className="divide-y rounded-xl border">
                    {show.recentlyPurchased.map((it, idx) => (
                      <li key={`${it.title}-${idx}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                        <span className="min-w-0 truncate font-medium">{it.title}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          ×{it.quantity} · {formatInr(it.unitPrice * it.quantity, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Order history
                </h3>
                {show.orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {show.orders.map((o) => (
                      <li
                        key={o.id}
                        className="flex flex-col gap-1 rounded-xl border bg-muted/30 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex flex-wrap items-center gap-2 font-medium">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{o.orderNumber || o.id.slice(-8)}</span>
                          <Badge variant="outline" className="font-normal">
                            {o.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                          <span className="tabular-nums">{fmtDate(o.createdAt)}</span>
                          <span className="font-medium text-foreground">{formatInr(o.totalAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Activity timeline
                </h3>
                <ul className="relative space-y-0 border-l border-muted pl-6">
                  {show.timeline.map((ev, i) => (
                    <li key={`${ev.at}-${i}`} className="relative pb-6 last:pb-0">
                      <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-foreground" />
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="font-medium">{ev.title}</div>
                          {ev.meta ? <div className="text-sm text-muted-foreground">{ev.meta}</div> : null}
                        </div>
                        <time className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {fmtDate(ev.at)}
                        </time>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4">
          <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function CustomerAvatar({ user, size }: { user: AdminCustomer | null; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-14 w-14 text-lg" : "h-9 w-9 text-xs";
  if (!user) return <div className={`grid shrink-0 place-items-center rounded-full bg-muted font-bold ${cls}`}>?</div>;
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt="" className={`${cls} shrink-0 rounded-full object-cover`} />;
  }
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return <div className={`grid shrink-0 place-items-center rounded-full bg-muted font-bold ${cls}`}>{initials}</div>;
}
