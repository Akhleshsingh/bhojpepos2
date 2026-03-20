# Bhojpe POS SaaS - Product Requirements Document

## Overview
Enterprise-grade Restaurant POS SaaS with RBAC, Stripe payments, KDS, and redesigned Table View.

## Tech Stack
- Frontend: React (Vite), MUI v5, Redux Toolkit, Dexie
- Backend: FastAPI, MongoDB, WebSockets
- Payments: Stripe

## What's Been Implemented

### Phase 1: MVP
- 50+ REST API endpoints with JWT auth
- RBAC with 7 roles (Super Admin → Delivery Boy)
- Multi-tenant architecture
- POS interface, Dashboard, Offline-first

### Phase 2: Advanced Features
- Stripe Payment Integration
- Kitchen Display System (KDS)
- Receipt Generation & Printing
- WebSocket Real-time Notifications

### Phase 3: UI Redesign ✅ NEW
- **Optimized Header**: Bhojpe logo + All Order + Table View (orange) + New Order (red)
- **Tables Page Redesign**: Floor grouping, status legend, table cards with actions
- **Login → /tables**: Users land on Table View after login

## Demo Credentials
- Admin: `admin / demo123`
- Super Admin: `superadmin / admin123`

## Test Results: 100% Frontend, 98% Overall
