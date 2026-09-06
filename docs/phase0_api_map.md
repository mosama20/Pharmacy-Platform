# Chefaa Platform — API & Integration Map (Phase 0 Baseline)

## 1. Overview
This document records the exact baseline of API endpoints, parameters, response shapes, and frontend integration points prior to any production code modification.

---

## 2. API Endpoints & Response Shapes

### 2.1 Authentication (`/api/auth`)
- **POST `/api/auth/login`**
  - Body: `{ email, password }`
  - Response (200):
    ```json
    {
      "access_token": "JWT_TOKEN",
      "user": {
        "id": "usr_101",
        "name": "مدير النظام",
        "email": "admin@chefaa.com",
        "role": "ADMIN",
        "phone": "01000000001",
        "avatar": "...",
        "isActive": true
      }
    }
    ```
- **POST `/api/auth/register`**
  - Body: `{ name, email, password, phone, role? }`
  - Response (201): Same as login (`{ access_token, user }`)
- **GET `/api/auth/profile`**
  - Headers: `Authorization: Bearer <token>`
  - Response (200): Sanitized user object (`id`, `name`, `email`, `role`, `phone`, `avatar`, `addresses`, `loyaltyPoints`, `walletBalance`)

---

### 2.2 Products (`/api/products`)
- **GET `/api/products`**
  - Query: `search`, `category`, `subCategory`, `isHotDeal`, `isPrescriptionRequired`, `sortBy`, `all`, `limit`, `page`
  - Response (200): `Product[]` (Plain JSON array of product objects)
- **GET `/api/products/:id`**
  - Response (200): `Product` object or 404
- **GET `/api/products/catalog-stats`**
  - Response (200):
    ```json
    {
      "totalProducts": 11600,
      "categoriesCount": 11,
      "lowStockCount": 12,
      "outOfStockCount": 5,
      "categories": [ ... ]
    }
    ```
- **GET `/api/products/categories`**
  - Response (200): Array of category names (`string[]`)
- **GET `/api/products/categories-tree`**
  - Response (200): Array of `CategoryNode` objects (`{ name, count, subCategories: [...] }`)
- **POST `/api/products`** (Staff)
  - Body: Product fields
  - Response (201): Created `Product`
- **PUT `/api/products/:id`** (Staff)
  - Body: Updated product fields
  - Response (200): Updated `Product`
- **DELETE `/api/products/:id`** (Staff)
  - Response (200): `{ success: true, message: "..." }`

---

### 2.3 Orders (`/api/orders`)
- **POST `/api/orders`**
  - Body:
    ```json
    {
      "customerId": "usr_...",
      "customerName": "...",
      "customerPhone": "...",
      "deliveryAddress": { "governorate": "...", "city": "...", "street": "..." },
      "deliveryType": "EXPRESS_45M | SCHEDULED | MONTHLY_REFILL",
      "paymentMethod": "CASH_ON_DELIVERY | CREDIT_CARD | ...",
      "items": [{ "productId": "...", "productName": "...", "price": 100, "quantity": 2 }],
      "promoCode": "...",
      "notes": "..."
    }
    ```
  - Response (201): `Order` object with `id`, `orderNumber`, `status`, `total`, `items`, etc.
- **GET `/api/orders`**
  - Query: `status`, `deliveryType`, `paymentMethod`, `search`, `courierId`
  - Response (200): `Order[]` (Sorted by createdAt descending)
- **GET `/api/orders/my-orders`**
  - Headers: `Authorization: Bearer <token>`
  - Response (200): `Order[]` belonging to authenticated customer
- **GET `/api/orders/:id`**
  - Response (200): `Order` object
- **GET `/api/orders/:id/live-tracking`**
  - Response (200):
    ```json
    {
      "orderId": "...",
      "orderNumber": "...",
      "status": "...",
      "customer": { "name": "...", "address": { ... }, "coordinates": { "lat": 30.0444, "lng": 31.2357 } },
      "courier": { "id": "...", "name": "...", "phone": "...", "coordinates": { "lat": 30.05, "lng": 31.24 } },
      "etaMinutes": 25,
      "distanceRemainingKm": 3.4
    }
    ```
- **PATCH `/api/orders/:id/status`**
  - Body: `{ status, note?, courierId? }`
  - Response (200): Updated `Order`
- **GET `/api/orders/dashboard-stats`**
  - Response (200):
    ```json
    {
      "totalRevenue": 4820,
      "totalOrders": 5,
      "pendingCount": 1,
      "deliveredCount": 2,
      "activeDeliveriesCount": 1,
      "averageOrderValue": 964
    }
    ```
- **GET `/api/orders/courier-stats`**
  - Response (200): `{ totalAssigned, activeDeliveriesCount, deliveredCount, cashToCollect, cashCollected, commissionEarned }`

---

### 2.4 Prescriptions (`/api/prescriptions`)
- **POST `/api/prescriptions/upload`**
  - Body: `{ customerName, customerPhone, address, imageUrl, notes, insuranceProvider?, policyNumber? }`
  - Response (201): `Prescription` object
- **GET `/api/prescriptions`**
  - Response (200): `Prescription[]`
- **GET `/api/prescriptions/my`**
  - Response (200): `Prescription[]`
- **GET `/api/prescriptions/:id`**
  - Response (200): `Prescription` object
- **POST `/api/prescriptions/:id/quote`**
  - Body: `{ items: [{ name, price, quantity }], pharmacistNotes }`
  - Response (200): Updated `Prescription` with `items`, `totalAmount`, status `QUOTED`
- **PATCH `/api/prescriptions/:id/status`**
  - Body: `{ status, pharmacistNotes }`
  - Response (200): Updated `Prescription`

---

### 2.5 Refill Subscriptions (`/api/refill`)
- **GET `/api/refill`** -> `RefillSubscription[]`
- **GET `/api/refill/my`** -> `RefillSubscription[]`
- **POST `/api/refill`** -> Creates subscription
- **PATCH `/api/refill/:id/toggle`** -> Toggles active state

---

### 2.6 CMS (`/api/cms`)
- **GET/POST/PUT/DELETE `/api/cms/banners`**
- **GET/POST/PUT/DELETE `/api/cms/categories`**
- **GET/POST/PUT/DELETE `/api/cms/promo-codes`**
- **POST `/api/cms/promo-codes/validate`** -> `{ code, cartTotal }` => `{ valid: true, discountAmount, finalTotal, promo }`
- **GET/POST/PUT/DELETE `/api/cms/articles`**
- **GET/PUT `/api/cms/settings`**

---

### 2.7 Users & Staff (`/api/users`, `/api/staff`)
- **GET `/api/users`** -> `User[]`
- **GET `/api/users/customers`** -> `User[]`
- **GET `/api/users/:id`** -> `User`
- **PATCH `/api/users/:id/status`** -> `{ isActive: boolean }`
- **PATCH `/api/users/:id/role`** -> `{ role: UserRole }`
- **POST `/api/users/:id/reset-password`** -> `{ newPassword: string }`
- **DELETE `/api/users/:id`**
- **GET/POST/PUT/DELETE `/api/staff`**

---

### 2.8 AI Services (`/api/ai`)
- **POST `/api/ai/analyze-prescription`** -> `{ imageUrl, notes }`
- **POST `/api/ai/pharmacist-consult`** -> `{ message, history }`
- **POST `/api/ai/check-interactions`** -> `{ drugs: string[] }`

---

## 3. Frontend Integration Points

The frontend consumes these endpoints via [`frontend/src/services/api.js`](file:///c:/Users/Ayman%20Mossad/.gemini/antigravity-ide/scratch/chefaa-platform/frontend/src/services/api.js):
- Base URL determined dynamically (`/api` or `http://localhost:5000/api`)
- Tokens stored in `localStorage` (`auth_token` or `chefaa_token`)
- Auth headers: `Authorization: Bearer <token>`
- Expects:
  - `api.getProducts()` returning `Product[]` directly
  - `api.login()` returning `{ access_token, user }`
  - `api.getProfile()` returning `User`
  - `api.createOrder()` returning `Order`
  - `api.validatePromoCode()` returning `{ valid, discountAmount, finalTotal, promo }`

---

## 4. Current Storage Baseline Counts
From `backend/data/storage.json`:
- Users: 5
- Products: 11,600
- Prescriptions: 2
- Orders: 5
- Refills: 1
- Banners: 3
- Categories: 11
- PromoCodes: 2
- Articles: 3
- Settings: Object (1 key set)
