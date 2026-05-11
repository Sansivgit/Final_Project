import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 text-center">
      <div>
        <div className="font-display text-[12rem] md:text-[18rem] leading-none font-bold tracking-tighter">
          4<span className="text-volt">0</span>4
        </div>
        <h1 className="font-display text-3xl uppercase mt-2">Off the map</h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          The page you're chasing has run out of bounds. Let's get you back in the game.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="inline-flex items-center justify-center rounded-md volt-primary-btn px-6 py-3 text-sm font-display uppercase tracking-widest transition-colors">
            Home
          </Link>
          <Link to="/products" className="inline-flex items-center justify-center rounded-md border border-neutral-950 px-6 py-3 text-sm font-display uppercase tracking-widest transition-colors hover:bg-neutral-950 hover:text-neutral-50 dark:border-neutral-50 dark:hover:bg-neutral-50 dark:hover:text-neutral-950">
            Shop
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl uppercase">Something broke</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message || "Try again or head home."}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md volt-primary-btn px-5 py-2 text-sm">Try again</button>
          <a href="/" className="rounded-md border border-neutral-950 px-5 py-2 text-sm transition-colors hover:bg-neutral-950 hover:text-neutral-50 dark:border-neutral-50 dark:hover:bg-neutral-50 dark:hover:text-neutral-950">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VOLT — Athletic Streetwear, Engineered in Motion" },
      { name: "description", content: "Premium athletic streetwear: shoes, hoodies, tees and more. Free shipping over ₹8,500." },
      { property: "og:title", content: "VOLT — Athletic Streetwear, Engineered in Motion" },
      { property: "og:description", content: "Premium athletic streetwear: shoes, hoodies, tees and more. Free shipping over ₹8,500." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "VOLT — Athletic Streetwear, Engineered in Motion" },
      { name: "twitter:description", content: "Premium athletic streetwear: shoes, hoodies, tees and more. Free shipping over ₹8,500." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0d3ac243-457b-49a4-b0b1-f6ac264010cb/id-preview-b681e4a9--78d95c8b-72d0-4dd6-835a-bbcf2fa736e4.lovable.app-1778316920911.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0d3ac243-457b-49a4-b0b1-f6ac264010cb/id-preview-b681e4a9--78d95c8b-72d0-4dd6-835a-bbcf2fa736e4.lovable.app-1778316920911.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">
                  <Outlet />
                </main>
                <Footer />
              </div>
              <Toaster position="top-right" />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
