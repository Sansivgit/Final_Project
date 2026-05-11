import { Package, Users, ShoppingBag, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/context/AdminContext";
import { CustomerAvatar } from "@/components/admin/UserDetailsSheet";

export function DashboardPage() {
  const { products, users, useBackend, dashboardStats } = useAdmin();
  const totalStock = products.reduce((s, p) => s + p.stock, 0);

  const totalProductsCount =
    useBackend && dashboardStats != null ? dashboardStats.totalProducts : products.length;
  const totalUsersCount = useBackend && dashboardStats != null ? dashboardStats.totalUsers : users.length;
  const ordersCount =
    useBackend && dashboardStats != null ? dashboardStats.totalOrders : users.reduce((s, u) => s + u.totalOrders, 0);

  const stats = [
    { label: "Total Products", value: totalProductsCount, icon: Package, accent: "bg-blue-500/10 text-blue-600" },
    { label: "Total Users", value: totalUsersCount, icon: Users, accent: "bg-purple-500/10 text-purple-600" },
    { label: "Total Orders", value: ordersCount.toLocaleString(), icon: ShoppingBag, accent: "bg-emerald-500/10 text-emerald-600" },
  ];

  const lowStock = [...products].sort((a, b) => a.stock - b.stock).slice(0, 5);
  const recentUsers = [...users].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your store. Total stock units: {totalStock.toLocaleString()}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-lg ${s.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-4 text-2xl font-bold">{s.value}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Low stock</h2>
          <ul className="space-y-3">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <img src={p.imageUrl} alt={p.title} className="h-10 w-10 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.clothType}</div>
                </div>
                <span
                  className={`rounded px-2 py-1 text-xs font-semibold ${p.stock < 30 ? "bg-destructive/10 text-destructive" : "bg-muted"}`}
                >
                  {p.stock} left
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Recent users</h2>
          <ul className="space-y-3">
            {recentUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-3">
                <CustomerAvatar user={u} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{u.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                </div>
                <Badge
                  variant={u.isBlocked ? "destructive" : "outline"}
                  className={
                    u.isBlocked ? "" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  }
                >
                  {u.isBlocked ? "Blocked" : "Active"}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
