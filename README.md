# 🏥 Chefaa - Next-Gen Smart Healthcare & E-Pharmacy Platform

[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS%2010%20%7C%20TypeScript-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2017%20%7C%20Prisma%206-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Deployment-Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS%203-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Cloudflare R2](https://img.shields.io/badge/Storage-Cloudflare%20R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/products/r2/)

An enterprise-grade, full-stack digital pharmacy and tele-health ecosystem. Built with a modern microservices-ready architecture, **Chefaa** features AI-driven prescription OCR, real-time interactive GPS delivery tracking, automated drug-drug interaction screening, chronic refill subscriptions, dynamic catalog synchronization, and a two-sheet dynamic Excel bulk import/export engine.

---

## 📑 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Key Features](#-key-features)
  - [1. AI Vision OCR & Clinical Assistant](#1-ai-vision-ocr--clinical-assistant)
  - [2. Dynamic Product & Catalog Management](#2-dynamic-product--catalog-management)
  - [3. Telepharmacy & Prescription Lifecycle](#3-telepharmacy--prescription-lifecycle)
  - [4. Real-Time GPS Tracking & Logistics](#4-real-time-gps-tracking--logistics)
  - [5. Omnichannel Notifications](#5-omnichannel-notifications)
  - [6. Security, RBAC & Audit Trails](#6-security-rbac--audit-trails)
  - [7. Dual-Engine Resilience & Cloud Storage](#7-dual-engine-resilience--cloud-storage)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start with Docker Compose](#quick-start-with-docker-compose-recommended)
  - [Local Development Setup](#local-development-setup)
- [Environment Variables](#-environment-variables)
- [API Documentation Summary](#-api-documentation-summary)
- [Preloaded Test Accounts](#-preloaded-test-accounts)
- [Project Directory Structure](#-project-directory-structure)
- [License](#-license)

---

## 🏛 Architectural Overview

```
                                  ┌─────────────────────────────────────────┐
                                  │   Clients: Web App / Mobile Browser     │
                                  │       (React 18 + Vite + Tailwind)      │
                                  └────────────────────┬────────────────────┘
                                                       │ HTTP / REST / Blobs
                                                       ▼
                                  ┌─────────────────────────────────────────┐
                                  │      Nginx Reverse Proxy (Port 80)      │
                                  └────────────┬───────────────┬────────────┘
                                               │               │
                        Static Assets / SPA    │               │ /api/* (Reverse Proxy)
                                               ▼               ▼
                        ┌────────────────────────┐   ┌─────────────────────────────────────────┐
                        │   React Frontend Pod   │   │       NestJS Backend API (Port 5000)    │
                        └────────────────────────┘   │  - Auth (JWT, Guards, RBAC)             │
                                                     │  - Products & Dynamic Excel Engine      │
                                                     │  - AI Vision OCR & Clinical Assistant   │
                                                     │  - Orders, Prescriptions, & Refills     │
                                                     │  - Telegram & SMTP Notifications        │
                                                     └───────┬────────────┬───────────┬────────┘
                                                             │            │           │
                                                             ▼            │           ▼
                                                  ┌───────────────────┐   │   ┌───────────────────┐
                                                  │ PostgreSQL 17 DB  │   │   │  Cloudflare R2    │
                                                  │   (Prisma ORM)    │   │   │  Object Storage   │
                                                  └───────────────────┘   │   └───────────────────┘
                                                                          ▼
                                                              ┌───────────────────────┐
                                                              │  Atomic JSON Storage  │
                                                              │  (Disk Fallback Sync) │
                                                              └───────────────────────┘
```

---

## 🌟 Key Features

### 1. AI Vision OCR & Clinical Assistant
- **Handwritten Prescription OCR**: Employs computer vision to parse doctors' handwriting, accurately extracting active ingredients, drug names, concentrations, and dosage instructions.
- **Cheaper Generic Drug Matcher**: Automatically maps branded medications to equivalent, bio-identical generic alternatives registered with the health authorities, calculating instant patient savings.
- **AI Clinical Pharmacist Chatbot**: Integrated 24/7 intelligent health counselor capable of:
  - Performing drug-drug interaction (DDI) risk assessments.
  - Answering contraindication and side-effect inquiries.
  - Suggesting proper administration schedules and safe dosage guidelines.

### 2. Dynamic Product & Catalog Management
- **Dynamic 2-Sheet Excel Template Engine**:
  - Automatically exports a production-grade spreadsheet (`.xlsx`) populated with up-to-date categories.
  - **Sheet 1 (`جميع المنتجات المصنفة`)**: Structured tabular schema supporting product name (Arabic & English), SKU, brand, active ingredient, retail price, original price, stock quantity, prescription flag, and image URLs.
  - **Sheet 2 (`دليل الأقسام والتصنيفات`)**: Real-time reference index listing all active parent categories and their respective subcategories to ensure 100% schema alignment during imports.
- **Bulk Excel Importer**: High-throughput parser with intelligent column matching, automatic discount percentage computation (`originalPrice` vs. `price`), and hot-deal tagging.
- **Zero-Lock Freedom & Full Catalog Lifecycle**:
  - Independent catalog management with complete CRUD capabilities per item.
  - **Clear Catalog (One-Click Reset)**: Secure administrative endpoint (`DELETE /api/products/clear-all`) allowing staff to purge existing demo inventories and rebuild customized catalogs from scratch.
  - Auto-synchronization of CMS category counts whenever items are created, modified, or removed.

### 3. Telepharmacy & Prescription Lifecycle
- **End-to-End Rx Workflow**:
  1. Patient uploads prescription via camera capture, device storage, or Cloudflare R2 upload.
  2. Pharmacist inspects the high-resolution image, amends quantities, selects matching products, and inputs doctor instructions.
  3. Patient receives an instant digital quote with approval/rejection actions.
  4. One-click conversion from accepted prescription quote directly into a dispatchable order.
- **Chronic Disease Refill Subscriptions**: Automated monthly recurring deliveries for maintenance therapies (hypertension, diabetes, cardiac care) with pause, resume, and cancellation controls.

### 4. Real-Time GPS Tracking & Logistics
- **Live Courier Radar**: Interactive delivery tracking component displaying the live GPS trajectory of the delivery rider from the dispensing pharmacy branch to the customer's doorstep.
- **Dynamic Arrival Countdown**: Real-time calculated ETA (Estimated Time of Arrival) with remaining distance calculations (KM/Meters).
- **Flexible Delivery Tiers**:
  - **Express 45-Minute Dispatch**: Urgent medication fulfillment via automated local routing.
  - **Scheduled Delivery**: Time-slot reservation for planned home care deliveries.
  - **Monthly Chronic Refills**: Automatic recurring fulfillment cycles.

### 5. Omnichannel Notifications
- **Instant Telegram Bot Integration**:
  - Dispatches immediate structured alerts to administrative and pharmacy staff channels upon new order placement or prescription submissions.
  - Instant direct links to order details and customer contact channels.
- **Automated SMTP Email Pipeline**: Sends transactional invoices, status changes, and prescription quotes to customers via authenticated SMTP (Google Workspace / Gmail).

### 6. Security, RBAC & Audit Trails
- **Granular Role-Based Access Control**:
  - Strict hierarchical permissions: `ADMIN`, `PHARMACIST`, `DELIVERY`, `SUPPORT`, and `CUSTOMER`.
- **JWT Authentication Flow**: Short-lived Access Tokens paired with hashed Refresh Tokens stored securely on disk/database.
- **Hardened API Gateway**:
  - Strict whitelist validation pipes (`class-validator` & `class-transformer`) preventing unauthorized payload injection.
  - Global Rate Limiting (`@nestjs/throttler`) protecting sensitive auth endpoints.
  - HTTP security headers powered by `helmet` and custom CORS policy enforcement.
- **Compliance Audit Logging**: Comprehensive ledger recording timestamped administrative events (product updates, catalog purges, role revisions).

### 7. Dual-Engine Resilience & Cloud Storage
- **Hybrid Storage Architecture**: Production runs on PostgreSQL via Prisma ORM. In development or offline environments, an atomic JSON persistence engine seamlessly takes over, ensuring zero data loss during restarts.
- **Cloudflare R2 Object Storage**: S3-compatible, globally distributed CDN for ultra-fast, zero-egress-fee storage of prescription scans and product imagery.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: [React 18](https://reactjs.org/) + [Vite 5](https://vitejs.dev/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Styling**: [TailwindCSS 3](https://tailwindcss.com/) (RTL first, Glassmorphism, Dark/Light Mode)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Build Tooling**: PostCSS, Autoprefixer, ESLint

### Backend
- **Framework**: [NestJS 10](https://nestjs.com/) (TypeScript)
- **ORM & Database**: [Prisma 6](https://www.prisma.io/) + [PostgreSQL 17 Alpine](https://www.postgresql.org/)
- **Validation**: `class-validator`, `class-transformer`
- **Spreadsheet Processing**: `xlsx` (SheetJS)
- **Cloud Storage**: `@aws-sdk/client-s3` (Cloudflare R2)
- **Security & Auth**: `Passport-JWT`, `bcryptjs`, `helmet`, `@nestjs/throttler`
- **Communications**: `nodemailer`, Telegram Bot HTTP API

### Infrastructure & DevOps
- **Containerization**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- **Web Server / Reverse Proxy**: [Nginx Alpine](https://nginx.org/)
- **Monitoring**: Built-in health endpoints (`/api/health/live`, `/api/health/ready`)

---

## 🚀 Getting Started

### Prerequisites
- [Git](https://git-scm.com/) installed
- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/) installed
- *(Optional for local dev)*: [Node.js](https://nodejs.org/) (v20+ recommended) and [npm](https://www.npmjs.com/)

---

### Quick Start with Docker Compose (Recommended)

Run the entire platform (PostgreSQL, Backend API, Frontend SPA, and Nginx) with a single command:

```bash
# Clone the repository
git clone git@github-client:mosama20/Pharmacy-Platform.git
cd Pharmacy-Platform

# Build and start all services in detached mode
docker compose up -d --build
```

#### Access Endpoints:
| Service | URL | Description |
| :--- | :--- | :--- |
| **Storefront & Admin Web App** | [http://localhost](http://localhost) | React SPA served via Nginx |
| **NestJS Backend REST API** | [http://localhost:5000/api](http://localhost:5000/api) | Core API Gateway & Documentation |
| **API Health Check** | [http://localhost:5000/api/health/live](http://localhost:5000/api/health/live) | System liveness probe |
| **PostgreSQL Database** | `localhost:5433` | Host port mapped to container port `5432` |

To stop the containers:
```bash
docker compose down
```

---

### Local Development Setup

#### 1. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Run database migrations / Prisma generation
npx prisma generate

# Start the NestJS API in development watch mode
npm run start:dev
```
Backend API will be live at `http://localhost:5000/api`.

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend development server will be running at `http://localhost:5173`.

---

## 🔐 Preloaded Test Accounts

Use these pre-configured accounts to explore the different roles:

| Role | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@chefaa.com` | `ChefaaAdmin@2026` | Full system control, inventory, users, finances, audit logs |
| **Reviewing Pharmacist** | `pharmacist@chefaa.com` | `ChefaaAdmin@2026` | Prescription quoting, order fulfillment, clinical validation |
| **Delivery Courier** | `courier@chefaa.com` | `ChefaaAdmin@2026` | Real-time tracking portal, order delivery status updates |
| **Verified Customer** | `user@gmail.com` | `123456` | Shopping, checkout, wallet, prescriptions, live tracking |

---

## ⚙️ Environment Variables

Configure your environment variables in `backend/.env` or inside `docker-compose.yml`:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database & Authentication
DATABASE_URL="postgresql://postgres:chefaa_secret_2026@postgres:5432/chefaa_db?schema=public"
JWT_SECRET="chefaa_prod_secret_key_2026_super_secure_min_32_chars"
ALLOWED_ORIGINS="http://localhost,http://localhost:80,http://localhost:5173"

# Telegram Bot Alerts
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_CHAT_ID="your_channel_id"
TELEGRAM_ENABLED=true

# Email Notification Service
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Dr. Shaimaa Pharmacy <your-email@gmail.com>"
ADMIN_NOTIFICATION_EMAIL="admin@chefaa.com"
EMAIL_ENABLED=true

# Cloudflare R2 Object Storage
CLOUDFLARE_R2_ACCOUNT_ID="your_r2_account_id"
CLOUDFLARE_R2_ACCESS_KEY_ID="your_r2_access_key"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your_r2_secret_key"
CLOUDFLARE_R2_BUCKET_NAME="pharmacy-uploads"
CLOUDFLARE_R2_PUBLIC_URL="https://your-public-r2-domain.r2.dev"
```

---

## 📡 API Documentation Summary

| Module | Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Register new customer account | No |
| **Auth** | `POST` | `/api/auth/login` | Authenticate & retrieve JWT tokens | No |
| **Auth** | `POST` | `/api/auth/refresh` | Issue new access token using refresh token | No |
| **Products** | `GET` | `/api/products` | Retrieve paginated products with filters | No |
| **Products** | `GET` | `/api/products/template` | Download dynamic 2-sheet Excel template | Admin / Pharmacist |
| **Products** | `POST` | `/api/products/import-excel` | Import products from uploaded `.xlsx` file | Admin / Pharmacist |
| **Products** | `POST` | `/api/products` | Create a single product | Admin / Pharmacist |
| **Products** | `PUT` | `/api/products/:id` | Update product details & pricing | Admin / Pharmacist |
| **Products** | `DELETE`| `/api/products/:id` | Remove a product from the catalog | Admin / Pharmacist |
| **Products** | `DELETE`| `/api/products/clear-all` | Purge entire catalog inventory | Admin |
| **Prescriptions**| `POST` | `/api/prescriptions` | Submit prescription with image scan | Customer |
| **Prescriptions**| `GET` | `/api/prescriptions` | Retrieve prescription queue | Pharmacist / Admin |
| **Prescriptions**| `PATCH`| `/api/prescriptions/:id/quote` | Issue pricing quote for prescription | Pharmacist / Admin |
| **Orders** | `POST` | `/api/orders` | Place a new order (Express/Scheduled/Refill) | Customer / Admin |
| **Orders** | `GET` | `/api/orders/:id/track`| Fetch live GPS coordinates & delivery ETA | Customer / Courier / Admin |
| **AI Assistant** | `POST` | `/api/ai/chat` | Query the AI Clinical Pharmacist | No |
| **Uploads** | `POST` | `/api/upload` | Upload image to Cloudflare R2 | Authenticated |
| **Health** | `GET` | `/api/health/live` | Health & liveness diagnostic probe | No |

---

## 📂 Project Directory Structure

```
chefaa-platform/
├── backend/                      # NestJS REST API Application
│   ├── prisma/                   # Prisma Schema, Migrations, and Seed script
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── ai/                   # AI Pharmacist & OCR Vision logic
│   │   ├── audit/                # Compliance audit logging service
│   │   ├── auth/                 # JWT strategy, guards, and RBAC decorator
│   │   ├── common/               # Database persistence layer & interceptors
│   │   ├── health/               # Kubernetes/Docker liveness & readiness checks
│   │   ├── notifications/        # Telegram Bot & SMTP Email services
│   │   ├── orders/               # Order processing, refills & live GPS tracking
│   │   ├── prescriptions/        # Prescription OCR & pharmacist quote workflows
│   │   ├── products/             # Catalog service, Excel template & DTOs
│   │   ├── upload/               # Cloudflare R2 object storage client
│   │   ├── app.module.ts
│   │   └── main.ts               # Application entrypoint & global pipes
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                     # React 18 + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/            # Administrative tabs & modal dialogues
│   │   │   │   ├── modals/       # NewProduct, EditProduct, ExcelImport, etc.
│   │   │   │   └── tabs/         # ProductsTab, OrdersTab, PrescriptionsTab
│   │   │   ├── common/           # ImageUpload, Alerts, Buttons, Layouts
│   │   │   └── tracking/         # Interactive GPS Delivery Radar map
│   │   ├── services/             # API client, auth token management
│   │   ├── App.jsx               # Application routing & layout tree
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf                # Nginx proxy & SPA fallback configuration
│   └── package.json
│
├── docker-compose.yml            # Multi-container orchestration specification
└── README.md                     # Comprehensive platform documentation
```

---

## 📄 License

This software is developed and maintained by **Antigravity**. All rights reserved. Licensed for production deployment under proprietary healthcare distribution guidelines.
