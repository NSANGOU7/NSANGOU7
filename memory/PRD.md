# AUTOPARTS - Product Requirements Document

## Original Problem Statement
Create a full-stack single-seller auto parts e-commerce site inspired by eBay. Key features include search by plate/vehicle, product details (compatibility, OEM ref, condition), real-time auctions, an offer system ("Faire une offre"), cart, diverse checkout options (Stripe, PayPal redirection, Installments, Bank Transfer with specific IBAN, Delivery vs. Pickup), order tracking, live admin chat, and an admin dashboard for full management.

## Tech Stack
- Frontend: React.js + Tailwind CSS + Shadcn UI
- Backend: FastAPI + MongoDB (Motor async)
- Auth: JWT in httpOnly cookies
- Emails: Resend
- Object Storage: Emergent Object Storage (for product images)
- Payments: Stripe (test keys), PayPal.me redirect, Bank Transfer (IBAN FR7617238000010039398259386)

## User Preference
Language: French (all UI, emails, messages in French)

## Credentials
- Admin: `billionsmahmoud@gmail.com` / `admin123`
- Test client (created for testing): `client-test@example.com` / `client123`

---

## ✅ Completed Features

### Core e-commerce
- Product catalog with categories (Moteur, Freinage, Suspension, etc.)
- Search by license plate / brand / OEM reference
- Dark theme eBay-style product detail page
- Cart + Wishlist
- Checkout: Delivery vs Pickup (-15%), Stripe, PayPal.me, Bank Transfer, Installments
- Order tracking with public tracking page
- Admin dashboard (stats, orders, products, auctions, offers, chat)
- Real-time auctions with bidding
- "Faire une offre" (Make an offer) system with admin approval
- Image upload via Object Storage
- Live chat widget (customer ↔ admin)
- Resend email integration

### Latest additions (Feb 2026)
- **[Feb 2026]** Added `specifications` field to Product model — admin can add custom key-value technical characteristics like eBay
- **[Feb 2026]** Created `SpecificationsEditor` component with 18 auto-parts quick-add suggestions
- **[Feb 2026]** Product detail page displays specifications as table
- **[Feb 2026]** PRO PACK: TrustBadges, PaymentMethodIcons, SEO meta tags, OG + Twitter Card, custom favicon, robots.txt, sitemap.xml, WhatsApp floating button, promo banner, Breadcrumbs, 404 page, free shipping bar, newsletter, sales chart 30 days, CSV export
- **[Feb 2026]** LANGUAGE SWITCHER: 4 langues (FR/EN/ES/AR) avec RTL pour arabe
- **[Feb 2026]** Email + WhatsApp finalisés : `contact@automobilepart.fr` + `+33 7 61 52 45 33`
- **[Feb 2026]** REFONTE PRODUITS eBay-style sombre (`ProductCardDark` + `ProductShowcase`)

### Latest (May 2026)
- **[May 2026]** ✅ **GUEST CHECKOUT** : achat possible sans compte (champs email + nom sur Checkout). CartContext hybride (API si connecté, localStorage sinon). Migration automatique du panier guest → user à la connexion.
- **[May 2026]** ✅ **PAYPAL BUSINESS API v2** : intégration des Smart Buttons (remplace `paypal.me`). Endpoints `/api/paypal/create-order` et `/api/paypal/capture-order/{id}`. Lib `@paypal/react-paypal-js`. Mode sandbox (clés livrées sont SANDBOX, doivent être remplacées par des clés LIVE pour la prod). Frontend `PayPalSmartButtons` composant.
- **[May 2026]** ✅ **SÉCURITÉ** : middleware FastAPI ajoutant headers `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, `HSTS` (si HTTPS). Rate limit IP register (5/h). Brute-force login déjà en place (5 tentatives → 15 min lockout).
- **[May 2026]** ✅ **UPLOAD IMAGES VPS** : stockage local (`UPLOAD_DIR`) + fallback Object Storage. URLs relatives `/api/files/{id}` qui fonctionnent partout.
- **[May 2026]** ✅ **PAIEMENTS** : retrait 4× / 3×, conservé 1× et 2×. Adresse pickup affichée : `306 rue de la petite compagne, 60730 Sainte Geneviève`.
- **[May 2026]** ✅ **MOBILE** : Dialog admin produits `w-[calc(100vw-2rem)]` sur mobile, bouton "Ajouter produit" full-width mobile, filtres en colonne sur mobile.
- **[May 2026]** ✅ **EMERGENT BADGE** : `display: none !important` (badge "Made with Emergent" caché).

---

## 🟢 What Works (Verified)
- Backend auth: login/register HTTP 200 (curl tested)
- Frontend login form: works, toast "Connexion réussie" appears
- Admin dashboard: loads with stats, 8 products, orders, etc.
- Admin product edit modal: fully functional with specs editor
- Product detail page: displays custom specifications correctly

## 🔴 Known Issues
- Resend client-facing emails: fail silently until user verifies DNS on `automobileparts.fr` domain (pending user domain purchase)

---

## 📋 Next Action Items

### P0 — User verification
- User to test adding a real product with images + specifications via `/admin/products`

### P1 — Domain & emails
- Help user verify DNS records on Resend once `automobileparts.fr` is purchased

### P2 — Pro enhancements (proposed, awaiting user choice)
- **Trust & conversion**: Payment badges, free shipping progress bar, trust banner, real-time stock counter
- **SEO**: Per-page meta tags, favicon, sitemap.xml, robots.txt, Open Graph tags
- **UX**: WhatsApp floating button, breadcrumbs, 404 page, recently viewed, image zoom
- **Marketing**: Newsletter signup, promo codes, promo banner, "Why us" page
- **Admin**: CSV export/import, 30-day sales graph, new-order email notifications

### P3 — Future
- Migration to OVH VPS / custom domain linking

---

## Code Architecture
```
/app/
├── backend/
│   ├── server.py              # FastAPI routes (auth, products, auctions, orders, offers, chat, tracking)
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── ImageUploader.js
│   │   │   │   └── SpecificationsEditor.js   # NEW
│   │   │   ├── chat/ChatWidget.js
│   │   │   ├── home/ (SearchHero, ReviewsSection)
│   │   │   └── layout/ (Header, Footer, CategoryNav)
│   │   ├── contexts/ (AuthContext, CartContext)
│   │   └── pages/
│   │       ├── HomePage.js
│   │       ├── ProductDetailPage.js           # shows specs table
│   │       ├── AdminProductsPage.js           # has specs editor
│   │       └── ... (Cart, Checkout, Tracking, Admin*, etc.)
```

## Key Models
- `Product.specifications: Dict[str, str]`  — flexible key-value spec table
- `users {email, password_hash, role, name, addresses}`
- `orders {user_id, items, total, status, shipping_method, tracking_number}`
- `offers {user_id, product_id, amount, status}`
- `auctions {product_id, current_price, end_time, bids}`
