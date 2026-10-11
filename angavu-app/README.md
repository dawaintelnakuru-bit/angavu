# Angavu Business Intelligence Platform

> **"Angavu"** (*Swahili: "Bright. Illuminated. Full of light. Clear where there was darkness."*)  
> Enterprise-grade operational intelligence and financial visibility for Kenyan SMEs.

Angavu unifies **Finance**, **Pharmacy**, **Inventory**, and **Analytics** into an intuitive dashboard and offline-ready mobile web app. It bridges the spreadsheets business owners already use (Google Sheets, Form responses, cash till registers) into live business clarity without requiring complex software migrations.

---

## 🏛️ Architecture & Privacy Guarantee

1. **Private Server Bridge**: Google Sheets workbooks act as the secure data warehouse, but their credentials, URLs, and sheet layouts remain strictly on the backend. Frontend clients only interact with authenticated `/api` endpoints.
2. **Zero-Config Embedded Storage**: Workspace settings and offline sync idempotency ledgers are backed by local **SQLite** (`better-sqlite3`). No external Postgres cluster is required.
3. **Offline-First Data Capture**: The Quick Entry system stores transactions in browser **IndexedDB** when offline, queuing records until a connection is restored and the server confirms receipt.
4. **Self-Hostable Anywhere**: Completely decoupled from proprietary platform connectors (no Replit lock-in). Can be hosted for free or on low-cost virtual servers (Render, Fly.io, Railway, VPS).

```
                      ┌──────────────────────────────────────────────┐
                      │              Client Browser                  │
                      │  React 19 + Vite + Tailwind v4 + Clerk Auth  │
                      │         IndexedDB Offline Queue              │
                      └──────────────────────┬───────────────────────┘
                                             │  /api (Bearer token)
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │             Express API Server               │
                      │    TypeScript + Pino + @clerk/express        │
                      └──────────────┬────────────────────────┬──────┘
                                     │                        │
                      SQLite Storage │                        │ Googleapis
                      (angavu.db)    ▼                        ▼ (Service Account JWT)
                    ┌──────────────────┐           ┌────────────────────────────┐
                    │ Settings Table   │           │ Google Sheets Data Layer   │
                    │ Sync Ledger      │           │ • Pharmacy Master Tracker  │
                    └──────────────────┘           │ • Finance Multi-Branch     │
                                                   │ • Inventory Movements      │
                                                   └────────────────────────────┘
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** v20.12+ or v22+
- **npm** v10+

### 2. Install Dependencies
Run from the `angavu-app` root directory:
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` (or use the pre-configured `.env`):
```bash
cp .env.example .env
```

Your pre-configured `.env` already contains your Clerk test credentials:
```env
PORT=5000
NODE_ENV=development

CLERK_PUBLISHABLE_KEY=pk_test_a2Vlbi1hbnRlYXRlci0xNTE4LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_VZiTL75MX69tlz26E28GIjN3TU81TmgLqzPrxjsuq2
SESSION_SECRET=YhcDIh0kS/91ZHTwYMgKLhY0/GTolv8Rdzmlq7iRktcAR8qLMpm8fXl+AhZx3wBosiiB6y8oGtlZrp9wW3JZmA==
VITE_CLERK_PUBLISHABLE_KEY=pk_test_a2Vlbi1hbnRlYXRlci0xNTE4LmNsZXJrLmFjY291bnRzLmRldiQ

DATABASE_PATH=./angavu.db
```

### 4. Run Locally
Start both backend API server and frontend Vite server with one command:
```bash
npm run dev
```
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:5000`

### 5. Run Automated Tests
```bash
npm test
```
Runs the automated `node:test` regression suite covering:
- Financial and inventory metrics aggregation algorithms
- Date and currency formatting
- Idempotent deduplication logic for offline sync queues
- SQLite settings and ledger operations

---

## 📊 Connecting Google Sheets (Service Account Setup)

To allow the server to securely read and append to client Google Sheets without exposing them:

### Step 1: Create a Google Cloud Service Account
1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `Angavu-Production`).
3. Navigate to **APIs & Services > Library** and enable **Google Sheets API**.
4. Navigate to **IAM & Admin > Service Accounts** and click **Create Service Account**.
   - Name: `angavu-sheet-bridge`
5. Click **Done**. Click on the newly created service account and go to the **Keys** tab.
6. Click **Add Key > Create New Key > JSON**. A JSON credentials file will download.

### Step 2: Configure Server Environment
Open the downloaded JSON file. In your `.env` (or hosting dashboard):
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL="angavu-sheet-bridge@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...-----END PRIVATE KEY-----\n"
```
*(Keep the newline characters `\n` in the private key string).*

### Step 3: Share Your Google Sheets
Open your Google Sheets workbook (Pharmacy, Finance, or Inventory) and click **Share**. Add your Service Account email address as **Editor** (or **Viewer** if you don't use Quick Entry appending).

---

## 📑 Workbook Specifications

Angavu supports the official templates:

### 1. Angavu Pharmacy (`DawaIntel_MasterTracker_v2.xlsx`)
- **Stock Tab**: Tab name is the pharmacy name (e.g. `Mary Wanjiku Pharmacy`).
  - Columns: `Col A`: Drug Name, `Col B`: Unit, `Col C`: Current Stock, `Col F`: Days Remaining, `Col H`: Stock Status, `Col I`: Nearest Expiry, `Col J`: Days to Expiry.
- **Form Responses 1**:
  - `Col A`: Timestamp, `Col B`: Pharmacy, `Col C`: Date, `Col D`: Staff Name, `Col E`: Drug Name, `Col F`: Movement Type (`Dispensed` | `Received` | `Returned` | `Expired`), `Col G`: Quantity, `Col H`: Expiry Date, `Col I`: Notes, `Col J`: Entry ID.
- **Overview Dashboard**:
  - Cell range `B4:G5` contains the summary count metrics (Stockouts, Critical, Low Stock, Expiry Warnings, Expired Batches, Needs Action).

### 2. Angavu Finance
- **Dashboard**:
  - `Dashboard!B9:K10`: Executive summary (Total Income, Expenses, Net Position, Pending Supplier Claims).
- **Daily Transactions**:
  - `A6:L`: `Col A`: Date, `Col B`: Branch, `Col C`: Type (`Income` | `Expense`), `Col D`: Category, `Col E`: Description, `Col F`: Amount, `Col G`: Payment Method, `Col J`: Employee, `Col L`: Entry ID.

### 3. Angavu Inventory
- **Stock Movements**:
  - `A1:L`: `Col A`: Date, `Col B`: Type (`Stock In` | `Stock Out` | `Stock Count`), `Col C`: Item Name, `Col D`: SKU, `Col E`: Category, `Col F`: Quantity, `Col G`: Unit, `Col H`: Unit Cost, `Col I`: Reorder Level, `Col J`: Branch/Location, `Col K`: Notes, `Col L`: Entry ID.

---

## 🌐 Production Deployment Guide (Free & Affordable Options)

### Option 1: Render.com (Recommended Free Tier)
Render offers a free Web Service tier with custom domains and SSL.

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of self-hostable Angavu"
   git remote add origin https://github.com/your-username/angavu.git
   git push -u origin main
   ```
2. **Create a Web Service on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com) and click **New > Web Service**.
   - Connect your GitHub repository.
   - **Root Directory**: `angavu-app` (or leave blank if repository root is `angavu-app`).
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
3. **Set Environment Variables in Render**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `CLERK_PUBLISHABLE_KEY`: *(Your Clerk Publishable Key)*
   - `CLERK_SECRET_KEY`: *(Your Clerk Secret Key)*
   - `VITE_CLERK_PUBLISHABLE_KEY`: *(Your Clerk Publishable Key)*
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: *(Your service account email)*
   - `GOOGLE_PRIVATE_KEY`: *(Your service account private key)*
   - `DATABASE_PATH`: `/opt/render/project/src/angavu.db`

*Note: In production, the Express server automatically serves the compiled frontend static files from `client/dist`. A single web service serves both the API and the web frontend!*

---

### Option 2: Fly.io (Free / Micro VM)
Fly.io provides 3 free shared micro-VMs with persistent volume storage for SQLite.

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh` (or `winget install flyctl` on Windows).
2. Run `fly launch` in `angavu-app`.
3. Create a persistent volume for the SQLite database:
   ```bash
   fly volumes create angavu_data --size 1
   ```
4. Set secrets:
   ```bash
   fly secrets set CLERK_PUBLISHABLE_KEY=... CLERK_SECRET_KEY=... VITE_CLERK_PUBLISHABLE_KEY=...
   ```
5. Deploy: `fly deploy`.

---

### Option 3: VPS (Ubuntu 22.04 / 24.04 on DigitalOcean, Hetzner, AWS)
For production with full control ($4–$5/month):

1. **Install Node.js & PM2**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx
   sudo npm install -g pm2
   ```
2. **Clone & Build**:
   ```bash
   git clone https://github.com/your-username/angavu.git /var/www/angavu
   cd /var/www/angavu/angavu-app
   npm install
   npm run build
   ```
3. **Start Process with PM2**:
   ```bash
   pm2 start npm --name "angavu" -- run start
   pm2 save
   pm2 startup
   ```
4. **Configure Nginx**:
   ```nginx
   server {
       server_name angavu.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
5. **Enable HTTPS (Free)**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d angavu.yourdomain.com
   ```

---

## 🔒 Clerk Authentication Setup

In your [Clerk Dashboard](https://dashboard.clerk.com):
1. Go to **Configure > Paths**:
   - Sign-in path: `/sign-in`
   - Sign-up path: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`
2. Go to **Domains / Production Instances**:
   - Add your production domain (e.g. `angavu.yourdomain.com` or `angavu.onrender.com`).
   - The app uses standard Clerk authentication without any proprietary domain proxying.

---

## 📦 Directory Structure

```
angavu-app/
├── package.json              # Monorepo workspaces definition (server, client)
├── .env.example              # Environment variables template
├── .env                      # Active credentials
├── README.md                 # Complete documentation & deployment guide
├── server/                   # Express API + SQLite + Google Sheets Bridge
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts          # Server entrypoint & graceful shutdown
│   │   ├── app.ts            # Express configuration & static file serving
│   │   ├── db.ts             # SQLite schema, settings, and sync ledger
│   │   ├── lib/
│   │   │   ├── logger.ts     # Pino logger
│   │   │   └── googleSheets.ts # Official googleapis JWT service account bridge
│   │   └── routes/
│   │       ├── index.ts
│   │       ├── health.ts     # GET /api/healthz
│   │       └── angavu.ts     # Dashboard aggregations, settings, and sync endpoints
│   └── test/
│       ├── aggregation.test.ts # Node:test aggregation regression suite
│       └── db.test.ts        # Node:test SQLite persistence suite
└── client/                   # Vite + React 19 + Tailwind v4 + Clerk
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts        # Path aliases and /api proxy configuration
    ├── index.html            # SEO meta tags and Google fonts
    ├── public/
    │   ├── logo.svg          # Official Angavu mark
    │   ├── favicon.svg
    │   └── robots.txt
    └── src/
        ├── main.tsx          # Application bootstrap with ErrorBoundary
        ├── App.tsx           # Route definitions, Clerk provider, and navigation
        ├── index.css         # Tailwind v4 theme, IBM Plex Mono, Manrope, DM Sans
        ├── lib/
        │   ├── api.ts        # Typed API client + React Query v5 hooks
        │   ├── offline-queue.ts # IndexedDB offline entry storage
        │   └── utils.ts      # Tailwind class merger (cn)
        ├── hooks/
        │   └── use-toast.ts  # Lightweight toast notification hook
        ├── components/
        │   ├── AppShell.tsx  # Responsive sidebar and navigation shell
        │   ├── LoadingState.tsx
        │   ├── error-boundary.tsx
        │   └── ui/
        │       ├── toast.tsx
        │       ├── toaster.tsx
        │       └── tooltip.tsx
        └── pages/
            ├── Landing.tsx   # Brand pitch, 4-module overview, and privacy guarantees
            ├── Dashboard.tsx # Live Recharts visualization (Finance, Pharmacy, Inventory, Analytics)
            ├── Entry.tsx     # Fast quick-entry form with offline IndexedDB queue
            ├── Settings.tsx  # Google Sheets connection manager with privacy guarantees
            └── not-found.tsx # 404 page
```

---

## 💼 Business Intelligence Modules Summary

| Module | Target Client | Value Proposition | Pricing Tier |
| :--- | :--- | :--- | :--- |
| **Angavu Pharmacy** | Independent community pharmacies | Prevents stockouts & expiry losses with Monday morning WhatsApp clarity | KES 2,000 – 5,500/mo |
| **Angavu Finance** | Retail, wholesale, printing (8+ branches or single location) | Cashflow, expense tracking, and supplier claims visibility | KES 3,500 – 25,000/mo |
| **Angavu Inventory** | Hardware stores, mini-marts, stationery | Reorder point warnings, SKU turnover, and wastage tracking | KES 2,500 – 7,500/mo |
| **Angavu Analytics** | Growing SMEs needing FP&A | Custom financial models, unit economics, and quarterly review | KES 15,000 – 50,000/project |

---

**Built with pride in Nakuru, Kenya for African SMEs.**
