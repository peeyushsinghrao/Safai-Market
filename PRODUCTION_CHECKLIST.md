# Safai Market — Production Readiness Checklist

## Authentication ✅ / ❌

- [x] Login with Email + Password works
- [x] Register new account works
- [x] Phone OTP login UI exists
- [x] Session persists across page refresh
- [x] Sign out works from More menu
- [x] Unauthenticated users redirected to /auth/login
- [x] Auth guard protects all routes
- [ ] Password reset email flow (Supabase default, needs testing)
- [ ] Email verification enforced (configure in Supabase dashboard)

## Multi-Shop Isolation ✅ / ❌

- [x] `shop_id` column on products, bills, customers, categories
- [x] API routes filter by `req.shopId` via `optionalAuth` middleware
- [x] New records stamped with `shopId` on create
- [x] Demo mode (no login) works via NULL shop_id isolation
- [ ] Row-Level Security (RLS) on Supabase (requires migrating DB to Supabase)
- [ ] Multi-branch support (branches table — Phase F1)

## Billing System ✅ / ❌

- [x] Multi-product cart
- [x] Item quantity stepper
- [x] Item-level discount
- [x] Bill-level discount (flat / %)
- [x] Split payment (Cash + UPI + Udhaar)
- [x] Udhaar requires customer selection
- [x] Stock deducted atomically in DB transaction
- [x] Profit calculated per item + total
- [x] Cart persists across page refresh
- [x] Discount shown on receipt (B4 fixed)
- [x] Bundle stock check uses real stock (B3 fixed)
- [ ] GST calculation on bills (Phase F8)
- [ ] Sales return / refund flow (Phase F9)

## Barcode System ✅ / ❌

- [x] USB/Bluetooth hardware scanner (keyboard wedge)
- [x] Camera barcode scanner (ZXing)
- [x] Barcode search in billing
- [ ] Unknown barcode → Create product / Assign product workflow
- [ ] Bulk scan mode (auto-add to cart)
- [ ] Internal barcode generator (SMAT-000001 format)

## Products ✅ / ❌

- [x] Add product with all fields
- [x] Edit product (PATCH /products/:id)
- [x] Archive product
- [x] Stock adjustment (add / reduce)
- [x] Stock movement history
- [x] Category filter works
- [x] Barcode field
- [ ] Supplier selector in product form (P8)
- [ ] Barcode label printing

## Customers ✅ / ❌

- [x] Customer list with udhaar balances
- [x] Customer detail with ledger history
- [x] Receive payment
- [x] Edit customer
- [x] Search by name / phone

## Reports ✅ / ❌

- [x] Today's dashboard (IST timezone fixed — B8)
- [x] Profit report with Recharts charts
- [x] Bills history with cancel
- [x] Bill detail page
- [x] Daily closing
- [x] Stock movements
- [x] Low stock alerts
- [ ] GST report (Phase F8)
- [ ] Branch-level reports (Phase F1)

## PWA ✅ / ❌

- [x] manifest.json with name, icons, theme color
- [x] Apple mobile web app meta tags
- [x] Android web app capable meta
- [x] Installable from browser
- [ ] Service worker / offline support (Phase P5 — critical for low-connectivity shops)
- [ ] Background sync queue

## WhatsApp Share ✅ / ❌

- [x] Uses `https://wa.me/?text=` (B5 fixed — works on desktop + mobile)

## Security Checklist

- [x] Supabase JWT validated server-side on API routes
- [x] No hardcoded credentials in code
- [x] Environment variables used for all secrets
- [ ] Rate limiting on API routes
- [ ] Input sanitization audit
- [ ] RLS policies in Supabase (if DB migrated there)

## Performance Checklist

- [x] Lazy loading of barcode scanner (only loads when opened)
- [x] Debounced search (200ms)
- [x] TanStack Query caching
- [ ] Product list virtualization (needed for 1000+ products)
- [ ] Image optimization (no product images currently)

## Mobile Responsiveness

- [x] 360px (small Android) — works
- [x] 375px (iPhone SE) — works
- [x] 390px (iPhone 15) — works
- [x] 430px (iPhone Pro Max) — works
- [ ] Desktop / tablet layout (stretched mobile UI — Phase P6)

## Before Going Live

1. Set all environment variables in production
2. Run `pnpm --filter @workspace/db run push` on production DB
3. Test login / register / onboarding flow end-to-end
4. Create first shop in onboarding
5. Add sample products and verify billing works
6. Test receipt print
7. Test WhatsApp share
8. Test camera barcode scanner on mobile
9. Verify "Today's Sales" shows correct date in IST
