import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Shirt, Users, LogOut, Zap, X } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/users", label: "Users", icon: Users, end: false },
  { to: "/products", label: "Products", icon: Package, end: false },
  { to: "/cloth-types", label: "Cloth types", icon: Shirt, end: false },
] as const;

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const { logout } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login", { replace: true });
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border/70 bg-gradient-to-b from-card via-card to-muted/25 shadow-[inset_-1px_0_0_0_hsl(var(--border)/0.5)]">
      <div className="flex h-[4.25rem] items-center justify-between gap-2 border-b border-border/60 px-4">
        <NavLink
          to="/"
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-muted/60"
          onClick={onClose}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-volt/25 to-volt/5 shadow-inner ring-1 ring-volt/35">
            <Zap className="h-[1.35rem] w-[1.35rem] text-volt drop-shadow-sm" aria-hidden />
          </span>
          <span className="min-w-0 text-left leading-tight">
            <span className="block font-display text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
              Volt
            </span>
            <span className="block truncate font-display text-base font-semibold uppercase tracking-[0.18em]">
              Admin
            </span>
          </span>
        </NavLink>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="px-3 pt-5">
        <p className="px-3 pb-2 font-display text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground/90">
          Menu
        </p>
        <nav className="flex flex-col gap-1">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-foreground text-background shadow-md shadow-black/10 ring-1 ring-border/60"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground hover:shadow-sm",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-background/15 text-background"
                          : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground",
                      )}
                    >
                      <Icon className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} />
                    </span>
                    <span className="truncate">{it.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-border/60 p-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 rounded-xl border-border/80 bg-muted/20 hover:bg-muted/60"
          type="button"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 opacity-80" /> Logout
        </Button>
      </div>
    </aside>
  );
}
