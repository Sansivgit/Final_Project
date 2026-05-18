# VOLT Admin Panel

React admin dashboard for managing products, cloth types, customers, and orders. It talks to the VOLT backend API over HTTPS.

**Live URL:** https://volt-admin.onrender.com

## Tech stack

- React 19 + TypeScript
- Vite 7
- React Router 7
- Tailwind CSS 4
- Radix UI + shadcn-style components
- Zod + React Hook Form

## Configuration

This app does **not** use `.env` files. Public settings live in:

```ts
// admin/env.public.ts
export const publicEnv = {
  VITE_API_URL: "https://volt-backend-20cc.onrender.com",
  VITE_BACKEND_ORIGIN: "https://volt-backend-20cc.onrender.com",
  VITE_ADMIN_PORT: "5174",
  VITE_ADMIN_URL: "https://volt-admin.onrender.com",
  VITE_STORE_URL: "",
} as const;
```

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Base URL for API requests (no trailing slash) |
| `VITE_BACKEND_ORIGIN` | Backend origin used by the Vite dev proxy |
| `VITE_ADMIN_PORT` | Local dev server port |
| `VITE_ADMIN_URL` | Public admin site URL |
| `VITE_STORE_URL` | Optional link to the customer storefront |

Change these values in `env.public.ts`, then rebuild or restart the dev server.

## Prerequisites

- Node.js 18+ (22 recommended)
- npm
- Backend running at https://volt-backend-20cc.onrender.com (or your own API URL in `env.public.ts`)

## Local development

```bash
cd admin
npm install
npm run dev
```

Open http://localhost:5174 (or the port set in `VITE_ADMIN_PORT`).

### Default admin login

When connected to the backend:

- **Email:** `admin@volt.com`
- **Password:** `admin123`

Change the admin password in production.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 5174 |
| `npm run build` | Type-check and build for production → `admin/dist` |
| `npm run preview` | Preview production build locally |

## Project structure

```
admin/
├── env.public.ts          # Public config (replaces .env)
├── vite.config.ts
├── src/
│   ├── App.tsx            # Routes
│   ├── main.tsx
│   ├── context/           # Admin auth & theme
│   ├── pages/             # Dashboard, products, users, cloth types
│   ├── services/api.ts    # Backend API client
│   ├── components/        # UI and admin components
│   └── routes/            # Layout & auth guards
└── dist/                  # Production build output
```

## Features

- Admin login (JWT from backend)
- Dashboard stats (products, users, orders)
- Product CRUD with image upload (Cloudinary via backend)
- Cloth type management
- Customer list and detail view
- Light / dark theme

## Deploy on Render

Use a **Static Site** with:

| Setting | Value |
|---------|--------|
| Build Command | `cd admin && npm install && npm run build` |
| Publish Directory | `admin/dist` |
| Rewrite | `/*` → `/index.html` |

Or use the root `render.yaml` service `volt-admin`.

After deploy, ensure the backend allows `https://volt-admin.onrender.com` in CORS (`ADMIN_URL` in `backend/config/appEnv.production.ts`).

## API

All requests go to `{VITE_API_URL}/api/...` with `Authorization: Bearer <token>` for protected routes.

Main endpoints used:

- `POST /api/admin/login`
- `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`
- `GET /api/products/stats/summary`
- `GET /api/users`, `GET /api/users/:id/details`
- `GET /api/orders`
- `GET|POST|PUT|DELETE /api/admin/cloth-types`
- `POST /api/upload` (multipart field `image`)

See `docs/volt-backend.postman_collection.json` for the full API.

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Login fails / JWT error | Backend deployed with latest `appEnv.production.ts` and `JWT_SECRET` |
| CORS errors | Backend `ADMIN_URL` includes your admin origin |
| Blank page after deploy | Publish directory is `admin/dist` and rewrite `/*` → `/index.html` is set |
| API offline mode | `VITE_API_URL` is set; without it, admin only works in dev with proxy |
