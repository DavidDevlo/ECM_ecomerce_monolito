<div align="center">

# ECM — *Tu estilo, tu identidad*

**Fashion e-commerce storefront and admin back office built with Angular 18.**

![Angular](https://img.shields.io/badge/Angular-18-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![SSR](https://img.shields.io/badge/SSR-enabled-4c9a6a)
![Backend](https://img.shields.io/badge/API-Spring%20Boot-6DB33F?logo=springboot&logoColor=white)

</div>

---

## Overview

ECM is the frontend of a full-stack fashion e-commerce platform. It provides a customer-facing storefront (catalog, product detail, cart, checkout, order tracking) and a role-based back office for staff (orders, payments, products, users, coupons, reports).

It consumes the REST API of the Spring Boot service in [`../backend`](../backend), part of the same monorepo.

## Features

### Storefront
- **Home** with a full-bleed hero, marquee strip, horizontally scrolling categories, and scroll-driven reveal animations (with `prefers-reduced-motion` support).
- **Catalog** with a sidebar of filters (category, price range slider, size, color), grid/list views, and server-side pagination.
- **Product detail** with variant selection (size and color), stock awareness, and wishlist.
- **Cart and 3-step checkout**: shipping address → payment method → review, followed by a confirmation screen.
- **Payments**: Yape, Plin, and bank transfer. Clients attach a payment reference and can retry a rejected payment.
- **Coupons**: validation and discount preview at checkout (the backend recalculates the final amount).
- **Shipping**: cost computed from the backend configuration, with a free-shipping threshold.
- **Profile**: order history with a status tracker (Pending → Paid → Confirmed → Preparing → Shipped → Delivered).

### Back office (role-based)
- **Orders**: search, status filter, status changes, line-item detail, shipping address and payment panel.
- **Payments**: staff can confirm or reject submitted payments.
- **Products**: inventory management and **low-stock alerts** in the admin sidebar.
- **Users** and **Coupons** management.
- **CSV exports**: sales, inventory, and customers, downloaded with the authenticated session.

## Tech stack

| Area | Technology |
|---|---|
| Framework | Angular 18 (standalone components, signals, `@if` / `@for` control flow) |
| Rendering | Angular SSR with per-route render modes |
| Language | TypeScript |
| Forms | Reactive Forms |
| HTTP | `HttpClient` with interceptors, blob downloads |
| Routing | Lazy routes with role-based guards |
| Styling | Hand-written CSS with design tokens (`theme-tokens.css`), light/dark ready |

## Getting started

### Prerequisites
- Node.js 18.19+ or 20+
- npm 9+
- The ECM backend running locally (default `http://localhost:8080`), see the [root README](../README.md#getting-started)

### Installation

This frontend lives in the `frontend/` folder of the ECM monorepo, next to the Spring Boot API in `backend/`.

```bash
git clone https://github.com/DavidDevlo/ECM_ecomerce_monolito.git
cd ECM_ecomerce_monolito/frontend
npm install
```

To run the full system, start the backend first (see the [root README](../README.md#getting-started)), then:

### Development server

```bash
npm start          # ng serve
```

Open `http://localhost:4200`. The app reloads on file changes.

### Production build

```bash
npm run build
```

Artifacts are written to `dist/`. With SSR enabled, the server bundle can be started with the script defined in `package.json` (`serve:ssr:*`).

## Configuration

### API base URL
Point the app at your backend in the environment/service configuration used by the HTTP services in `src/app/core/services`.

### Payment accounts
Payment details shown at checkout live in a single file and are **empty by default**. Fill in your own data; empty fields are hidden from the UI.

```
src/app/core/config/payment-accounts.ts
```

| Method | Fields |
|---|---|
| Yape / Plin | `number`, `holder`, `qrUrl` |
| Bank transfer | `bank`, `holder`, `account`, `cci` |

Payment logos are served from `public/assets/images/payment/` (`yape.png`, `plin.png`).

> **Do not commit real account numbers to a public repository.**

## Project structure

```
src/
├── app/
│   ├── core/
│   │   ├── config/        # payment accounts
│   │   ├── guards/        # auth and role guards
│   │   ├── models/        # TypeScript contracts mirroring the API
│   │   └── services/      # product, cart, order, payment, shipping, coupon, report
│   ├── features/
│   │   ├── home/          # landing page and product cards
│   │   ├── products/      # catalog and filters
│   │   ├── checkout/      # 3-step checkout and success screen
│   │   ├── profile/       # customer area and order history
│   │   └── admin/         # orders, products, users, coupons, layout
│   ├── shared/
│   │   └── components/    # order tracker, order payment, order shipping, header, footer
│   └── app.routes.ts
└── styles/
    └── theme-tokens.css   # colors, spacing, --page-gutter, --page-max
```

## Backend contract

The models in `core/models` mirror the backend DTOs.

| Concern | Endpoint / value |
|---|---|
| Checkout | `POST` with `shippingAddress`, `paymentMethod` (`YAPE` \| `PLIN` \| `TRANSFER`), `paymentReference?`, `couponCode?`, `items[]` |
| Order statuses | `PENDING`, `PAID`, `CONFIRMED`, `PREPARING`, `SHIPPED`, `DELIVERED`, `CANCELLED` |
| Shipping config | `GET /api/shipping/config` → `{ freeShippingThreshold, flatRate }` |
| Product filters | `GET /api/products/filters` → `{ sizes, colors, minPrice, maxPrice }` |
| Coupons | `/api/coupons`, `GET /api/coupons/validate?code&subtotal` |
| Reports | `/api/admin/reports/low-stock`, `/api/admin/reports/{sales\|inventory\|customers}/csv` |

Pagination uses `pageSize`; the `size` query param is reserved for garment size.

## Roles

| Role | Access |
|---|---|
| Customer | Storefront, cart, checkout, profile, own orders |
| Seller | Assigned orders and payment review |
| Admin | Full back office, including users, coupons, and reports |

## Design notes

- Animations use the individual `translate` / `scale` properties so they never collide with `transform`-based hover effects.
- Scroll-driven animations (`animation-timeline: view()`) are feature-detected with an `@supports` fallback.
- Motion is disabled globally under `prefers-reduced-motion: reduce`.
- Layout width is controlled by two global tokens, `--page-gutter` and `--page-max`.

## Roadmap

- [ ] Card payments (requires a payment gateway on the backend)
- [ ] Brand, rating, and category-count filters (requires backend support)
- [ ] Unit and end-to-end test coverage
- [ ] CI pipeline (lint, test, build)

## Author

**Vladimir Quispe Turpo** — Systems Engineering, Universidad Peruana Unión (UPeU).

## License

This project was developed for academic purposes. Add a license file if you plan to distribute it.
