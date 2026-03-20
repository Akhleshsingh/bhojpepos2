# Bhojpe POS SaaS

Enterprise-grade Restaurant Point of Sale (POS) Software as a Service with multi-tenant architecture, RBAC, real-time WebSockets, and offline-first capabilities.

## Architecture

### Frontend
- **Framework**: React 18 + Vite (port 5000)
- **UI**: Material UI (MUI) v5
- **State**: Redux Toolkit
- **Routing**: React Router DOM v6
- **Offline**: Dexie.js (IndexedDB)
- **Package Manager**: npm

### Backend
- **Framework**: FastAPI (Python)
- **Server**: Uvicorn (port 8001)
- **Database**: MongoDB (port 27017)
- **Auth**: JWT tokens
- **Real-time**: WebSockets

## Project Structure

```
/
├── frontend/           # React + Vite frontend (port 5000)
│   ├── src/
│   │   ├── app/        # Redux store
│   │   ├── features/   # Redux slices (auth, orders, menu, etc.)
│   │   ├── pages/      # Page components (pos, kitchen, reports, etc.)
│   │   ├── components/ # Reusable UI components
│   │   ├── services/   # API clients
│   │   └── offline/    # Local DB sync (Dexie.js)
│   └── vite.config.js  # Vite config with proxy to backend
├── backend/            # FastAPI backend (port 8001)
│   ├── server.py       # Main server (1800+ lines)
│   ├── requirements.txt
│   └── emergentintegrations/  # Local Stripe stub (for dev without API key)
└── data/db/            # MongoDB data directory
```

## Running the App

The "Start application" workflow handles everything:
1. Starts MongoDB on port 27017
2. Starts FastAPI backend on port 8001
3. Starts Vite dev server on port 5000 (proxies /api to backend)

## Demo Credentials

- **Super Admin**: superadmin / admin123
- **Admin**: admin / demo123
- **Manager**: manager / demo123
- **Cashier**: cashier / demo123
- **Waiter**: waiter / demo123
- **Chef**: chef / demo123

## Environment Variables

- `MONGO_URL`: MongoDB connection string (default: `mongodb://localhost:27017`)
- `DB_NAME`: Database name (default: `bhojpe_pos`)
- `JWT_SECRET`: JWT signing secret (auto-generated if not set)
- `STRIPE_API_KEY`: Stripe API key (optional, for payment processing)

## Key Features

- Multi-tenant restaurant management
- Role-Based Access Control (RBAC)
- POS interface for order taking
- Kitchen Display System (KDS)
- Table management
- Customer management
- Reports & analytics
- Real-time updates via WebSockets
- Offline-first with IndexedDB sync
- Stripe payment integration (requires API key)
