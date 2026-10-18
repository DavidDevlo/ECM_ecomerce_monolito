<div align="center">

# ECM — *Tu estilo, tu identidad*

**Full-stack fashion e-commerce platform: customer storefront and role-based back office.**

![Java](https://img.shields.io/badge/Java-17+-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4-6DB33F?logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-18-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)

</div>

---

## Table of contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Domain model](#domain-model)
- [Order lifecycle](#order-lifecycle)
- [API overview](#api-overview)
- [Security](#security)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Author](#author)

---

## Overview

ECM is a monorepo containing a complete e-commerce system for a fashion brand:

- **`backend/`** — a Spring Boot REST API (catalog, orders, payments, coupons, reviews, reports, email notifications).
- **`frontend/`** — an Angular 18 application with a customer storefront and a back office for sellers and admins.

The system supports the full purchase flow: browsing and filtering the catalog, checkout with Yape, Plin or bank transfer, manual payment verification by staff, order fulfillment tracking, and post-delivery reviews.

## Architecture

```mermaid
flowchart LR
    U[Browser] --> F[Angular 18 SSR]
    F -->|REST + JWT| B[Spring Boot API]
    B --> D[(PostgreSQL)]
    B --> S[Local file storage<br/>product images]
    B --> M[SMTP<br/>order emails]
```

The backend follows a layered design: **Controller → Service → Repository**, with DTOs mapped by MapStruct so entities never leave the service layer.

## Features

### Storefront
- Catalog with server-side pagination, search, sorting, and filters (category, price range, size, color, discounts, collections).
- Product detail with image gallery, size and color selection, stock awareness, and reviews.
- Wishlist synchronized with the account.
- Cart and 3-step checkout (shipping address → payment → review) with coupon validation.
- Order history with a status tracker and cancellation while the order is still pending.

### Back office
- **Orders:** queue of paid orders, assignment to sellers, status transitions, and full status history.
- **Payments:** staff confirm or reject submitted payments.
- **Products, categories, collections, coupons, users:** full CRUD for admins.
- **Inventory:** low-stock and out-of-stock alerts.
- **Reports:** sales, inventory, and customers, with CSV export.

### Platform
- JWT authentication and three roles (`CLIENTE`, `VENDEDOR`, `ADMIN`); users can hold several roles.
- Atomic checkout: stock validation, order, details, stock decrement, and payment are created in one transaction.
- Optimistic locking on product stock to prevent overselling under concurrent purchases.
- Stock and coupon usage are restored automatically when an order is cancelled.
- Transactional email notifications (sent after commit, asynchronously).

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Java, Spring Boot 4, Spring MVC, Spring Data JPA (Hibernate 7), Spring Security 7 |
| Auth | JWT (JJWT) |
| Mapping & boilerplate | MapStruct, Lombok |
| Database | PostgreSQL |
| API docs | springdoc OpenAPI (Swagger UI) |
| Email | Spring Mail (SMTP) |
| Frontend | Angular 18 (standalone components, signals), TypeScript, SSR, Reactive Forms |
| Build | Maven (wrapper included), npm |

## Repository structure

```
.
├── backend/                       # Spring Boot API
│   ├── src/main/java/com/example/ecm/
│   │   ├── config/                # Security, CORS, web, async, data seeder
│   │   ├── controller/            # REST controllers
│   │   ├── service/               # Business logic (interfaces + impl)
│   │   ├── repository/            # Spring Data repositories and specifications
│   │   ├── model/                 # JPA entities and enums
│   │   ├── DTO/                   # Request and response DTOs
│   │   ├── mapper/                # MapStruct mappers
│   │   └── exception/             # Global exception handling
│   ├── src/main/resources/        # application.properties + dev / prod profiles
│   ├── uploads/                   # Product images (git-ignored)
│   └── pom.xml
├── frontend/                      # Angular application
│   ├── src/app/core/              # Guards, models, services, config
│   ├── src/app/features/          # Home, catalog, checkout, profile, admin
│   └── src/app/shared/            # Shared components
└── README.md
```

> Package names may differ slightly from the tree above; check `backend/src/main/java` for the exact layout.

## Getting started

### Prerequisites

- Java 17 or newer
- Node.js 18.19+ or 20+, and npm 9+
- PostgreSQL 14+ with an empty database created for the project

### 1. Clone

```bash
git clone https://github.com/DavidDevlo/ECM_ecomerce_monolito.git
cd ECM_ecomerce_monolito
```

### 2. Run the backend

Set the [required environment variables](#environment-variables) first, then:

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

The API starts at `http://localhost:8080`. Run it **from the `backend/` directory**: `app.upload.dir=uploads` is a relative path, so images are stored in `backend/uploads/`.

On first startup, a seeder creates the three roles and an initial admin user (see `ADMIN_*` variables). Hibernate creates the schema automatically in `dev`.

### 3. Run the frontend

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:4200`. Make sure `CORS_ALLOWED_ORIGINS` on the backend includes that origin.

### 4. API documentation

With the backend running, Swagger UI is available at `http://localhost:8080/swagger-ui/index.html`.

## Configuration

### Environment variables

Secrets are never stored in the repository; every credential is read from the environment.

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Signing key for JWT. Use a long random value, different per environment. |
| `DB_USERNAME` | Yes | PostgreSQL user. |
| `DB_PASSWORD` | Yes | PostgreSQL password. |
| `ADMIN_PASSWORD` | First run | Password of the bootstrap admin user. |
| `ADMIN_USERNAME` | No | Bootstrap admin username (default `admin`). |
| `ADMIN_EMAIL` | No | Bootstrap admin email (default `admin@ecm.com`). |
| `CORS_ALLOWED_ORIGINS` | Prod | Comma-separated list of allowed frontend origins (default `http://localhost:4200`). |
| `MAIL_ENABLED` | No | `true` to send order emails (default `false`). |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | If mail enabled | SMTP credentials (for Gmail, use an app password). |

Generate a JWT secret:

```bash
# Git Bash / Linux / macOS
openssl rand -base64 64
```

```powershell
# Windows PowerShell
$b = New-Object byte[] 64
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
[Convert]::ToBase64String($b)
```

> Changing `JWT_SECRET` invalidates all issued tokens; users must sign in again.

### Business settings

| Property | Default | Description |
|---|---|---|
| `app.shipping.free-threshold` | `299` | Subtotal from which shipping is free. |
| `app.shipping.flat-rate` | `15` | Flat shipping cost below the threshold. |
| `app.inventory.low-stock-threshold` | `5` | Stock level considered "low". |
| `app.upload.dir` | `uploads` | Directory for uploaded product images. |
| `jwt.expiration-ms` | `3600000` | Token lifetime (1 hour). |

### Profiles

| Profile | Purpose |
|---|---|
| `dev` | Local development. |
| `prod` | Production deployment; all secrets come from the environment. |

## Domain model

| Area | Entities |
|---|---|
| Identity | `User`, `Profile`, `Role`, `UserRole` |
| Catalog | `Category`, `Product`, `ProductImage`, `Collection` |
| Sales | `Order`, `OrderDetail`, `OrderStatusHistory`, `Payment`, `Coupon`, `ShippingAddress` (embeddable) |
| Engagement | `Review`, `WishlistItem`, `NewsletterSubscriber` |

Enums: `OrderStatus`, `PaymentMethod` (`YAPE`, `PLIN`, `TRANSFER`), `PaymentStatus` (`PENDING`, `PAID`, `REJECTED`), `DiscountType` (`PERCENT`, `FIXED`).

## Order lifecycle

```mermaid
stateDiagram-v2
    [*] --> PENDING: checkout
    PENDING --> PAID: staff confirms payment
    PAID --> CONFIRMED: seller accepts
    CONFIRMED --> PREPARING
    PREPARING --> SHIPPED
    SHIPPED --> DELIVERED
    PENDING --> CANCELLED: customer
    CONFIRMED --> CANCELLED: seller
    PREPARING --> CANCELLED: seller
    DELIVERED --> [*]
    CANCELLED --> [*]
```

- Admins can cancel from any non-final state.
- Cancelling restores stock, releases the coupon, and rejects pending payments.
- Every transition is stored in `order_status_history` (who, when, from and to).
- Reviews are only allowed for products from a `DELIVERED` order.

## API overview

Full interactive documentation is available in Swagger UI. Main groups:

| Domain | Endpoints | Access |
|---|---|---|
| Auth | `POST /api/auth/**` | Public |
| Catalog | `GET /api/products`, `/api/products/filters`, `/api/categories`, `/api/collections` | Public |
| Product admin | `POST/PUT/DELETE /api/products`, image upload and gallery | Admin |
| Orders | `POST /api/orders/checkout`, `GET /api/orders/me`, `GET /api/orders/{id}/history` | Customer |
| Order fulfillment | `GET /api/orders/available`, `POST /api/orders/{id}/accept`, `PATCH /api/orders/{id}/status` | Seller, Admin |
| Payments | `POST /api/payments/order/{id}`, `PATCH /api/payments/{id}/reference` | Customer |
| Payment review | `GET /api/payments/pending`, `POST /api/payments/{id}/confirm\|reject` | Seller, Admin |
| Coupons | `GET /api/coupons/validate`, CRUD under `/api/coupons` | Customer / Admin |
| Reviews | `POST /api/reviews`, `GET /api/reviews/product/{id}` | Customer / Public |
| Wishlist | `GET/POST/DELETE /api/wishlist` | Customer |
| Profile | `GET/PUT /api/profiles/me` | Authenticated |
| Shipping | `GET /api/shipping/config` | Public |
| Reports | `GET /api/admin/reports/{sales\|inventory\|customers\|low-stock}`, plus `/csv` variants | Admin |

### Catalog query parameters

`GET /api/products?search=&categoryId=&collectionId=&onlyWithDiscount=&minPrice=&maxPrice=&productSize=&color=&sortBy=price|name|createdAt&direction=asc|desc&page=0&pageSize=12`

The talla (garment size) filter is sent as `size` or `productSize`. Pagination uses **`pageSize`**; `size` is reserved for garment size.

### Checkout request

```json
{
  "shippingAddress": { "fullName": "", "phone": "", "address": "", "district": "", "reference": "" },
  "paymentMethod": "YAPE",
  "paymentReference": "optional",
  "couponCode": "optional",
  "items": [{ "productId": 1, "quantity": 2, "color": "Negro", "size": "M" }]
}
```

The user is taken from the JWT, never from the request body. Prices, discounts, shipping, and totals are computed by the server.

## Security

- Stateless authentication with JWT; method-level authorization with `@PreAuthorize`.
- Roles are checked per request and only active role assignments grant authorities.
- Ownership checks: customers can only read their own orders and payments.
- No secrets in version control; all credentials come from environment variables.
- Single CORS configuration, driven by `CORS_ALLOWED_ORIGINS`.
- Consistent error responses through a global exception handler (400, 401, 403, 404, 409, 500).

## Deployment

The backend is deployed on AWS. In production:

1. Provision PostgreSQL (for example, Amazon RDS) and create the database.
2. Define the environment variables listed above in the service that runs the app.
3. Build and run:

   ```bash
   cd backend
   ./mvnw -DskipTests package
   java -jar target/*.jar --spring.profiles.active=prod
   ```

4. Build the frontend with `npm run build` and serve it, setting the API base URL to the public backend address.
5. Set `CORS_ALLOWED_ORIGINS` to the public frontend origin.

Product images are stored on local disk (`uploads/`); use a persistent volume or object storage in production.

If you add a value to an enum that already has a column with a `CHECK` constraint, `ddl-auto=update` will not update that constraint; adjust it with SQL or adopt a migration tool.

## Roadmap

- [ ] Stock per size/variant (`ProductVariant`)
- [ ] HTML email templates
- [ ] Multiple saved shipping addresses
- [ ] Payment proof image upload
- [ ] Product Q&A, search autocomplete, back-in-stock alerts
- [ ] Card payments through a payment gateway
- [ ] Database migrations with Flyway
- [ ] `@EntityGraph` tuning for paginated queries
- [ ] Automated tests and CI pipeline

## Author

**Naira Alture Edgar David** — Systems Engineering, Universidad Peruana Unión (UPeU).

## License

Developed for academic purposes. Add a license file if you plan to distribute it.
