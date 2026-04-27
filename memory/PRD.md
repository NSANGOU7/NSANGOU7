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
- **[Feb 2026]** Added `specifications` field (Dict[str, str]) to Product model — allows admin to add custom key-value technical characteristics (Cylindrée, Fabricant, Marque, Nombre de cylindres, Type de carburant, etc.) like eBay
- **[Feb 2026]** Created `SpecificationsEditor` component in admin with 18 auto-parts quick-add suggestions + custom rows
- **[Feb 2026]** Product detail page displays specifications as a clean table in "À propos de cet objet" section

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
