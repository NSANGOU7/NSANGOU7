# AutoParts E-commerce - PRD

## Original Problem Statement
Site e-commerce complet de vente de pièces automobiles, inspiré d'eBay, dédié à UN SEUL vendeur.

## Architecture
- Backend: FastAPI + MongoDB (motor), JWT auth, Stripe payments
- Frontend: React 19 + React Router 7 + Tailwind CSS + shadcn/ui
- Design: Light theme Swiss high-contrast, Outfit/Manrope fonts, red accent #FF3333 + blue #3B5BFF

## Implemented Features (2026-04)

### Phase 1 - MVP (Day 1)
- Auth JWT (login, register, logout, admin seed) with bcrypt + cookies + brute force protection
- Products CRUD avec filtres avancés (catégorie, état, prix, marque, OEM)
- Enchères avec proxy bidding et timer temps réel
- Cart + Wishlist + Q&A produits
- Checkout Stripe (card, bank transfer)
- User dashboard (orders, wishlist)
- Admin dashboard avec stats
- Pages statiques (About, Contact, CGV, Returns)

### Phase 2 - Admin Management (Day 1 later)
- Admin Products CRUD with modal form (add/edit/delete, featured toggle)
- Admin Orders management (status update, tracking number, CSV export)

### Phase 3 - Enhanced Features (Day 2)
- **Mobile-first SearchHero** with 3 tabs (Plaque/Véhicule/Référence), WhatsApp 0761524533/0753106346, stats 30K+/700+/4.8
- **Shipping Method Choice**: Livraison à domicile OU Retrait magasin (-15% auto)
- **Country Selector** in checkout (15 pays)
- **Multi Payment Methods**: Stripe, PayPal (MOCKED), Installments 3x/4x, Bank Transfer
- **Save Card Option** (via Stripe token)
- **Public Tracking Page** `/suivi` with tracking number lookup
- **Live Chat Widget** (floating button, polling-based, anonymous support)
- **Admin Chat Management** with real-time polling
- Admin notifications in logs (MOCKED email)

## Test Credentials
- Admin: admin@autoparts.com / admin123

## Key Files
- Backend: /app/backend/server.py (all-in-one, 1500+ lines)
- Frontend pages: /app/frontend/src/pages/
- Frontend components: /app/frontend/src/components/

## MOCKED Integrations
- PayPal (UI only, simulates success)
- Email notifications (console logs only)
- Installments 3x/4x (redirect to standard Stripe)

## Backlog (P1/P2)
- Real PayPal integration (needs business credentials)
- SendGrid/Resend email integration
- Real Stripe installments via Klarna/Alma
- Image upload via Object Storage (currently URL-based)
- Admin auctions management page
- Password reset email flow
- Order invoice PDF generation
