import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Search, Heart, ShoppingBag, Sun, Moon, Menu, X, User as UserIcon, LogOut, Package } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { searchProducts } from "@/lib/api/products";
import type { Product } from "@/data/products";
import { loginSearch } from "@/lib/authRedirect";
import { formatInr } from "@/lib/formatInr";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const NAV = [
  { label: "Men", to: "/products", search: { category: "Men" } },
  { label: "Women", to: "/products", search: { category: "Women" } },
  { label: "Unisex", to: "/products", search: { category: "Unisex" } },
];

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const { user, logout } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q) return setResults([]);
      setResults(await searchProducts(q));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      navigate({ to: "/products", search: { search: q.trim() } as any });
      setOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <Link to="/" onClick={() => setSheetOpen(false)} className="font-display text-2xl font-bold tracking-tight">
                VOLT<span className="text-volt">.</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setSheetOpen(false)}><X className="h-5 w-5" /></Button>
            </div>
            <nav className="flex flex-col p-4 gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.label}
                  to={n.to}
                  search={n.search as any}
                  onClick={() => setSheetOpen(false)}
                  className="font-display text-2xl uppercase tracking-tight py-3 hover:text-volt transition-colors"
                >
                  {n.label}
                </Link>
              ))}
              <div className="h-px bg-border my-3" />
              {user ? (
                <>
                  <Link to="/wishlist" onClick={() => setSheetOpen(false)} className="py-2 text-sm">Wishlist ({wishCount})</Link>
                  <Link to="/cart" onClick={() => setSheetOpen(false)} className="py-2 text-sm">Cart ({count})</Link>
                </>
              ) : (
                <>
                  <Link to="/login" search={loginSearch("/wishlist")} onClick={() => setSheetOpen(false)} className="py-2 text-sm">Wishlist</Link>
                  <Link to="/login" search={loginSearch("/cart")} onClick={() => setSheetOpen(false)} className="py-2 text-sm">Cart</Link>
                </>
              )}
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setSheetOpen(false)} className="py-2 text-sm">Profile</Link>
                  <button onClick={() => { logout(); setSheetOpen(false); }} className="py-2 text-sm text-left">Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setSheetOpen(false)} className="py-2 text-sm">Sign in</Link>
                  <Link to="/register" onClick={() => setSheetOpen(false)} className="py-2 text-sm">Create account</Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="font-display text-2xl font-bold tracking-tight shrink-0">
          VOLT<span className="text-volt">.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 ml-6">
          {NAV.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              search={n.search as any}
              className="text-sm font-medium uppercase tracking-wide hover:text-volt transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <form onSubmit={submitSearch} className="hidden sm:block relative" ref={ref}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Search"
              className="h-10 w-44 md:w-64 rounded-full bg-muted pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring transition-all focus:w-72"
              aria-label="Search products"
            />
          </div>
          {open && results.length > 0 && (
            <div className="absolute right-0 top-12 w-80 rounded-lg border bg-popover shadow-elevated overflow-hidden">
              {results.map((p) => (
                <Link
                  key={p.id}
                  to="/products/$slug"
                  params={{ slug: p.slug }}
                  onClick={() => { setOpen(false); setQ(""); }}
                  className="flex items-center gap-3 p-3 hover:bg-accent transition-colors"
                >
                  <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{formatInr(p.price)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </form>

        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {user ? (
          <Link to="/wishlist" className="relative" aria-label="Wishlist">
            <Button variant="ghost" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
            {wishCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-volt text-volt-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {wishCount}
              </span>
            )}
          </Link>
        ) : (
          <Link to="/login" search={loginSearch("/wishlist")} className="relative" aria-label="Wishlist — sign in">
            <Button variant="ghost" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
        )}

        {user ? (
          <Link to="/cart" className="relative" aria-label="Cart">
            <Button variant="ghost" size="icon">
              <ShoppingBag className="h-5 w-5" />
            </Button>
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-volt text-volt-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        ) : (
          <Link to="/login" search={loginSearch("/cart")} className="relative" aria-label="Cart — sign in">
            <Button variant="ghost" size="icon">
              <ShoppingBag className="h-5 w-5" />
            </Button>
          </Link>
        )}

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Account">
                <div className="h-7 w-7 rounded-full bg-neutral-950 text-neutral-50 flex items-center justify-center text-xs font-semibold uppercase dark:bg-neutral-900">
                  {user.name[0]}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/profile"><UserIcon className="h-4 w-4 mr-2" />Profile</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/profile" search={{ tab: "orders" } as any}><Package className="h-4 w-4 mr-2" />Orders</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/wishlist"><Heart className="h-4 w-4 mr-2" />Wishlist</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}><LogOut className="h-4 w-4 mr-2" />Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="hidden sm:flex items-center gap-1">
            {path === "/login" ? (
              <>
                <Button size="sm" asChild className="volt-primary-btn font-display uppercase tracking-widest">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/register">Create account</Link>
                </Button>
              </>
            ) : path === "/register" ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild className="volt-primary-btn font-display uppercase tracking-widest">
                  <Link to="/register">Create account</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild className="volt-primary-btn font-display uppercase tracking-widest">
                  <Link to="/register">Create account</Link>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      {path === "/" && (
        <div className="bg-neutral-950 text-neutral-50 text-xs overflow-hidden">
          <div className="flex whitespace-nowrap animate-marquee py-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex shrink-0 gap-12 px-6 font-display uppercase tracking-widest">
                <span>Free shipping over ₹8,500</span><span>•</span>
                <span>Free 30-day returns</span><span>•</span>
                <span>New drops every Friday</span><span>•</span>
                <span>Members earn double points</span><span>•</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
