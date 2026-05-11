# Plan: Nike-Inspired Clothing E-commerce Frontend

A bold, monochrome, athletic-energy storefront with all 9 pages, mock data, and zero backend. Built on the existing TanStack Start + Tailwind v4 + shadcn template.

## Design system (`src/styles.css`)

- **Palette**: near-black `#0A0A0A` background-foreground inversion, pure white surfaces, single bold accent (volt/electric). Heavy contrast, no purple.
- **Typography**: display sans (Oswald or Anton via Google Fonts) for huge headlines + Inter for body. Big, condensed, uppercase headlines.
- **Tokens**: extend with `--accent-volt`, `--shadow-card`, `--shadow-elevated`, `--radius` 8px, gradient `--gradient-hero`.
- **Dark mode**: full support, persisted in `localStorage` via a `ThemeContext`. Toggle in navbar.
- **Motion**: framer-motion for hero reveal + page transitions; Tailwind hover scales/translates on cards.

## Routes (TanStack file-based, all under `src/routes/`)

```
__root.tsx            shell + Navbar + Footer + Toaster + providers
index.tsx             Landing
login.tsx             Login
register.tsx          Register
products.tsx          PLP (filters, sort, grid/list, infinite scroll)
products.$slug.tsx    PDP (gallery, variants, reviews, related)
cart.tsx              Cart
wishlist.tsx          Wishlist
profile.tsx           Profile (tabs: info, addresses, orders, settings)
                      404 already handled in __root notFoundComponent (enhance branding)
```

## Shared components (`src/components/`)

- `Navbar.tsx` — logo, search w/ suggestions popover, cart/wishlist badges, theme toggle, auth buttons / user dropdown, mobile Sheet hamburger.
- `Footer.tsx` — link columns, socials, payment icons, newsletter input.
- `Breadcrumbs.tsx` — used on PLP/PDP/Cart/Wishlist/Profile.
- `ProductCard.tsx`, `ProductGrid.tsx`, `ProductGallery.tsx`, `FilterSidebar.tsx`, `SortMenu.tsx`, `QuantityStepper.tsx`, `PriceSummary.tsx`, `EmptyState.tsx`, `SkeletonCard.tsx`.

## State (Context, no extra deps)

- `CartContext` — items, add/remove/update qty, totals; persisted in localStorage.
- `WishlistContext` — toggle/list; persisted.
- `AuthContext` — mock login/register/logout; user object in localStorage.
- `ThemeContext` — light/dark, persisted.
- All providers mounted in `__root.tsx`.

## Data layer (`src/lib/api/`)

- `products.ts` — `getProducts({filters, sort, page})`, `getProduct(slug)`, `getRelated(id)` — currently read from `src/data/products.json`, returning Promises so swap-to-fetch is one line.
- `auth.ts`, `orders.ts` — same pattern, mock-first.
- 24+ mock products across categories (Men/Women, Tees/Hoodies/Pants/Shoes/Accessories), each with variants (size/color), Unsplash imagery.

## Page details

- **Landing**: full-bleed AI-generated hero (athlete in motion, monochrome + volt accent) with bold uppercase headline + CTA, category tiles (4), trending products carousel, promo strip ("FREE SHIPPING OVER $100"), editorial split section, newsletter.
- **PLP**: sticky sidebar filters (category, size chips, color swatches, price slider, brand) + chip list of active filters; sort dropdown; grid/list toggle; infinite scroll via IntersectionObserver; skeleton on load.
- **PDP**: thumbnail gallery + main image with hover-zoom; size selector (chips, OOS state), color swatches, qty stepper, sticky add-to-cart on mobile, accordions (description, shipping, returns), reviews summary + list, related products.
- **Cart**: line items with image/variant/qty; coupon input (mock validates `NIKE10`); price summary card; sticky checkout CTA; empty state with CTA.
- **Wishlist**: grid of saved items, move-to-cart, remove, empty state.
- **Profile**: tabs (Info, Addresses, Orders, Settings); mock orders with status badges; logout.
- **Auth**: react-hook-form + zod validation; social login placeholder buttons; password visibility toggle; clear error states.
- **404**: enhance existing root notFound with bold "404" display type, volt accent, back-to-home + shop CTAs.

## Forms & validation

- `react-hook-form` + `zod` for login, register, newsletter, address. Already plan to add as deps.

## Toasts

- Existing `sonner` `<Toaster />` mounted in root. Triggered on add-to-cart, add-to-wishlist, login success, coupon apply, etc.

## SEO

- Per-route `head()` with unique `title`, `description`, `og:*`. PDP derives title from product. Single H1 per page; semantic `<main>`, `<nav>`, `<section>`.

## Accessibility

- Keyboard navigation across all interactive controls; visible focus rings; ARIA labels on icon buttons; `alt` on every image; reduced-motion respect.

## Imagery

- One AI-generated landing hero (premium quality, monochrome + volt athlete shot) saved to `src/assets/`.
- All product images: curated Unsplash URLs in mock JSON.

## Dependencies to add

- `framer-motion`, `react-hook-form`, `zod`, `@hookform/resolvers`.

## Out of scope (this build)

- Real backend / auth (mock only, ready to swap).
- Checkout flow past cart (mentioned as future).
- Admin/seller views (consumer-only, per request).

## Build order

1. Design tokens + fonts + dark mode + global providers.
2. Mock data + API layer + contexts.
3. Navbar, Footer, Breadcrumbs, shared product components.
4. Landing (with generated hero).
5. PLP + PDP.
6. Cart + Wishlist.
7. Login + Register + Profile.
8. 404 polish + final responsive QA pass.
