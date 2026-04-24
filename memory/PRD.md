# AutoParts - PRD

## Phase 4 Updates (2026-04-24)
- IBAN unique: FR7617238000010039398259386 / BIC: SCSYFRP2 / Holder: Mahmoud Nsangou
- Homepage: removed hero "Trouver ma pièce en quelques clics" + car image
- SearchHero: brand dropdown + plaque XX-123-XX validation
- Product page: COMPLETE REDESIGN dark theme eBay-style (Achat immédiat / Ajouter au panier / Faire une offre / Suivre cet objet)
- Compatibility check by plate on product page (modal)
- Offers system: customer offer → admin validates (accept/reject) with email
- PayPal 3x/4x redirect (not Stripe)
- Bank transfer: /bank-transfer/:orderId with IBAN display
- Reviews section with 5-star ratings on homepage
- Social media: Facebook + TikTok (tiktok.com/@auto_france_33) + Instagram (autoparts.eup) + Snapchat (autopart.s) + WhatsApp (wa.me/message/RCG5UHW43X6SG1). YouTube removed.
- Address updated: 306 rue de la petite compagne, 60730 Sainte Geneviève
- Admin: /admin/offers page for managing offers

## Test credentials
- Admin: billionsmahmoud@gmail.com / admin123

## Known limitations (non-blocking)
- Resend test mode: customer emails go only to verified admin address. Awaiting DNS verification.
- Stripe test mode. User will provide production keys when ready.
- PayPal uses paypal.me redirect (user has personal PayPal, not Business).
- IBAN hardcoded in .env - single account

## Next action items
- Wait for Resend DNS validation
- Provide production Stripe keys (sk_live_...)
- Consider refactoring server.py (1800+ lines) into modules
